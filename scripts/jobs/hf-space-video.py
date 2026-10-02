#!/usr/bin/env python3
import argparse
import json
import shutil
from pathlib import Path
from urllib.request import urlopen


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--provider", choices=["wan2_2_fast", "ltx_fast"], required=True)
    parser.add_argument("--space", required=True)
    parser.add_argument("--prompt-file", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--duration", type=float, default=8)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--image")
    parser.add_argument("--hf-token")
    return parser.parse_args()


def extract_file_value(value):
    if value is None:
        return None
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        for key in ("path", "url", "file", "name", "video"):
            candidate = value.get(key)
            if candidate:
                return candidate
    if isinstance(value, (list, tuple)) and value:
        return extract_file_value(value[0])
    return None


def materialize_output(value, destination):
    source = extract_file_value(value)
    if not source:
        raise RuntimeError("Gradio returned no file output: " + repr(value))

    destination = Path(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)

    if source.startswith("http://") or source.startswith("https://"):
        with urlopen(source, timeout=120) as response, destination.open("wb") as target:
            shutil.copyfileobj(response, target)
    else:
        source_path = Path(source)
        if not source_path.exists():
            raise RuntimeError("Gradio output path does not exist: " + source)
        shutil.copyfile(source_path, destination)

    if destination.stat().st_size < 1024:
        raise RuntimeError("Downloaded video is empty or suspiciously small.")
    return destination


def main():
    args = parse_args()
    try:
        from gradio_client import Client, handle_file
    except Exception as exc:
        raise RuntimeError(
            "gradio_client is not installed. The workflow must install it before the video worker runs."
        ) from exc

    prompt = Path(args.prompt_file).read_text(encoding="utf-8").strip()
    token = args.hf_token or None
    client_kwargs = {"verbose": False}
    if token:
        client_kwargs["token"] = token
    client = Client(args.space, **client_kwargs)

    if args.provider == "wan2_2_fast":
        if not args.image:
            raise RuntimeError("Wan2.2 fast requires an input image.")
        result = client.predict(
            handle_file(args.image),
            prompt,
            4,
            api_name="/generate_video",
        )
    else:
        # LTX-Video Distilled current public Space contract:
        # text_to_video(prompt, negative_prompt, input_image, input_video,
        #               height, width, mode, duration, frames_to_use,
        #               seed, randomize_seed, guidance_scale, improve_texture)
        result = client.predict(
            prompt,
            "worst quality, inconsistent motion, blurry, jittery, distorted",
            None,
            None,
            512,
            704,
            "text-to-video",
            max(2, min(8, int(round(args.duration)))),
            9,
            args.seed,
            True,
            3.0,
            True,
            api_name="/text_to_video",
        )

    video_value = result[0] if isinstance(result, (tuple, list)) else result
    output = materialize_output(video_value, args.output)
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
