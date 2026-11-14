#!/usr/bin/env python3
import argparse
import json
import os
import re
from pathlib import Path
from urllib.error import URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

MAX_VIDEO_BYTES = 256 * 1024 * 1024
MIN_VIDEO_BYTES = 1024
SPACE_ID_PATTERN = re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")
BUILTIN_SPACE_IDS = {
    "zerogpu-aoti/wan2-2-fp8da-aoti-faster",
    "Lightricks/ltx-video-distilled",
}


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--provider", choices=["wan2_2_fast", "ltx_fast"], required=True)
    parser.add_argument("--space", required=True)
    parser.add_argument("--prompt-file", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--duration", type=float, default=8)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--image")
    parser.add_argument("--public-space", action="store_true")
    return parser.parse_args()


def _effective_port(parsed):
    # An explicit port 0 is not the HTTPS default; do not treat falsy ports as absent.
    return parsed.port if parsed.port is not None else (443 if parsed.scheme == "https" else 80)


def should_use_public_space(space_id, requested_public=False):
    return requested_public or space_id not in BUILTIN_SPACE_IDS


def is_trusted_space_origin(space_origin):
    try:
        parsed = urlsplit(space_origin)
        host = (parsed.hostname or "").lower()
        if parsed.scheme != "https" or parsed.username or parsed.password:
            return False
        if _effective_port(parsed) != 443:
            return False
        if host.endswith(".hf.space"):
            return True
        return host == "huggingface.co" and parsed.path.startswith("/spaces/")
    except (TypeError, ValueError):
        return False


def is_allowed_space_file_url(candidate, space_origin):
    if not is_trusted_space_origin(space_origin):
        return False
    try:
        target = urlsplit(candidate)
        origin = urlsplit(space_origin)
        if target.scheme != "https" or target.username or target.password:
            return False
        if (target.hostname or "").lower() != (origin.hostname or "").lower():
            return False
        if _effective_port(target) != _effective_port(origin):
            return False
        base_path = origin.path.rstrip("/")
        if base_path and target.path != base_path and not target.path.startswith(base_path + "/"):
            return False
        return True
    except (TypeError, ValueError):
        return False


class SameOriginRedirectHandler(HTTPRedirectHandler):
    def __init__(self, space_origin):
        super().__init__()
        self.space_origin = space_origin

    def redirect_request(self, request, file_pointer, code, message, headers, new_url):
        if not is_allowed_space_file_url(new_url, self.space_origin):
            raise URLError("Gradio output redirect left the configured Hugging Face Space origin.")
        return super().redirect_request(request, file_pointer, code, message, headers, new_url)


def extract_file_value(value):
    if value is None:
        return None
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        for key in ("url", "path", "file", "name", "video"):
            candidate = value.get(key)
            if candidate:
                return candidate
    for key in ("url", "path"):
        candidate = getattr(value, key, None)
        if candidate:
            return candidate
    if isinstance(value, (list, tuple)) and value:
        return extract_file_value(value[0])
    return None


def resolve_file_url(value, space_origin, encode_file_path):
    source = extract_file_value(value)
    if not isinstance(source, str) or not source:
        raise RuntimeError("Gradio output must include a file URL or remote file path.")
    if source.startswith(("http://", "https://")):
        return source
    if not is_trusted_space_origin(space_origin):
        raise RuntimeError("Cannot construct a file URL for an untrusted Space origin.")
    encoded_path = encode_file_path(source)
    if not isinstance(encoded_path, str) or not encoded_path:
        raise RuntimeError("Gradio returned an invalid remote file path.")
    return space_origin.rstrip("/") + "/file=" + encoded_path


def materialize_output(value, destination, space_origin, token=None):
    source = extract_file_value(value)
    if not isinstance(source, str) or not source or not source.startswith(("http://", "https://")):
        raise RuntimeError("Gradio output must include a remote file URL; local paths are not accepted.")
    if not is_allowed_space_file_url(source, space_origin):
        raise RuntimeError("Gradio output URL must remain on the configured HTTPS Hugging Face Space origin.")

    destination = Path(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_name(destination.name + ".part")
    headers = {"Authorization": "Bearer " + token} if token else {}
    opener = build_opener(SameOriginRedirectHandler(space_origin))

    try:
        request = Request(source, headers=headers)
        with opener.open(request, timeout=120) as response:
            if not is_allowed_space_file_url(response.geturl(), space_origin):
                raise RuntimeError("Gradio output download resolved outside the configured Space origin.")
            content_length = response.headers.get("Content-Length")
            if content_length is not None:
                try:
                    expected_size = int(content_length)
                except (TypeError, ValueError) as exc:
                    raise RuntimeError("Gradio output returned an invalid Content-Length.") from exc
                if expected_size < 0 or expected_size > MAX_VIDEO_BYTES:
                    raise RuntimeError("Gradio output exceeds the configured video size limit.")

            total_size = 0
            with temporary.open("wb") as target:
                while True:
                    chunk = response.read(1024 * 1024)
                    if not chunk:
                        break
                    total_size += len(chunk)
                    if total_size > MAX_VIDEO_BYTES:
                        raise RuntimeError("Gradio output exceeds the configured video size limit.")
                    target.write(chunk)

        if total_size < MIN_VIDEO_BYTES:
            raise RuntimeError("Downloaded video is empty or suspiciously small.")
        with temporary.open("rb") as downloaded:
            header = downloaded.read(12)
        if len(header) < 12 or header[4:8] != b"ftyp":
            raise RuntimeError("Gradio output is not a valid MP4 container.")
        temporary.replace(destination)
        return destination
    except Exception:
        temporary.unlink(missing_ok=True)
        raise


def main():
    args = parse_args()
    if not SPACE_ID_PATTERN.fullmatch(args.space):
        raise RuntimeError("Hugging Face Space must use the owner/name identifier format.")

    args.public_space = should_use_public_space(args.space, args.public_space)
    if args.public_space:
        # A public custom Space must not inherit a runner's token or cached login.
        os.environ["HF_TOKEN"] = ""
        os.environ.pop("HF_TOKEN_PATH", None)
        os.environ.pop("HUGGING_FACE_HUB_TOKEN", None)
        os.environ.pop("HUGGINGFACE_HUB_TOKEN", None)
        os.environ["HF_HUB_DISABLE_IMPLICIT_TOKEN"] = "1"
        os.environ["HF_HOME"] = str(Path(args.output).parent / "hf-home")

    try:
        from gradio_client import Client, handle_file, utils
    except Exception as exc:
        raise RuntimeError(
            "gradio_client is not installed. The workflow must install it before the video worker runs."
        ) from exc

    prompt = Path(args.prompt_file).read_text(encoding="utf-8").strip()
    token = None if args.public_space else (os.environ.get("HF_TOKEN") or None)
    client = Client(args.space, token=token, verbose=False, download_files=False)
    space_origin = getattr(client, "src_prefixed", None) or getattr(client, "src", None)
    if not isinstance(space_origin, str) or not is_trusted_space_origin(space_origin):
        raise RuntimeError("Gradio client resolved to an untrusted or non-HTTPS Space origin.")

    if args.provider == "wan2_2_fast":
        if not args.image:
            raise RuntimeError("Wan2.2 fast requires an input image.")
        # Current Wan Space UI input order:
        # image, prompt, negative_prompt, duration_seconds, guidance_scale,
        # guidance_scale_2, steps, seed, randomize_seed.
        # The old adapter passed only three inputs and sent the step count as
        # negative_prompt, causing every Wan request to fail.
        result = client.predict(
            handle_file(args.image),
            prompt,
            "worst quality, inconsistent motion, blurry, jittery, distorted",
            max(2.0, min(5.0, float(args.duration))),
            1.0,
            3.0,
            4,
            min(2_147_483_647, max(0, int(args.seed))),
            True,
            api_name="/generate_video",
        )
    else:
        # LTX-Video Distilled current public Space contract:
        # text_to_video(prompt, negative_prompt, input_image, input_video,
        #               height, width, mode, duration, frames_to_use,
        #               seed, randomize_seed, guidance_scale, improve_texture)
        # Use a six-second single-pass visual layer to stay inside the Space's
        # 60-second ZeroGPU budget; FFmpeg composes/loops it into the full reel.
        result = client.predict(
            prompt,
            "worst quality, inconsistent motion, blurry, jittery, distorted",
            None,
            None,
            512,
            704,
            "text-to-video",
            max(2, min(6, int(round(args.duration)))),
            9,
            min(4_294_967_295, max(0, int(args.seed))),
            True,
            3.0,
            False,
            api_name="/text_to_video",
        )

    video_value = result[0] if isinstance(result, (tuple, list)) else result
    video_url = resolve_file_url(video_value, space_origin, utils.encode_file_path)
    output = materialize_output(video_url, args.output, space_origin, token=token)
    print(
        json.dumps(
            {
                "provider": args.provider,
                "space": args.space,
                "output": str(output),
                "size": output.stat().st_size,
                "durationRequested": args.duration,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
