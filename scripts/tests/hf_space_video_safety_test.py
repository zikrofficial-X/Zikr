#!/usr/bin/env python3
import importlib.util
import io
import tempfile
import unittest
from pathlib import Path
from urllib.error import URLError
from urllib.request import Request
from unittest.mock import patch

MODULE_PATH = Path(__file__).resolve().parents[1] / "jobs" / "hf-space-video.py"
SPEC = importlib.util.spec_from_file_location("hf_space_video", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

SPACE_ORIGIN = "https://owner-space.hf.space"
FILE_URL = SPACE_ORIGIN + "/file=generated-video.mp4"
MP4_BYTES = b"\x00\x00\x00\x18ftypmp42" + (b"x" * 2048)


class FakeResponse:
    def __init__(self, payload, url, headers=None):
        self.payload = io.BytesIO(payload)
        self.url = url
        self.headers = headers or {}

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self, size=-1):
        return self.payload.read(size)

    def geturl(self):
        return self.url


class FakeOpener:
    def __init__(self, response):
        self.response = response
        self.request = None
        self.timeout = None

    def open(self, request, timeout=None):
        self.request = request
        self.timeout = timeout
        return self.response


class HuggingFaceOutputSafetyTests(unittest.TestCase):
    def test_only_https_urls_from_the_configured_space_origin_are_allowed(self):
        self.assertTrue(MODULE.is_allowed_space_file_url(FILE_URL, SPACE_ORIGIN))
        self.assertFalse(MODULE.is_allowed_space_file_url(FILE_URL.replace("https://", "http://"), SPACE_ORIGIN))
        self.assertFalse(MODULE.is_allowed_space_file_url("https://attacker.example/file=video.mp4", SPACE_ORIGIN))
        self.assertFalse(MODULE.is_allowed_space_file_url("https://169.254.169.254/latest/meta-data", SPACE_ORIGIN))
        self.assertFalse(MODULE.is_allowed_space_file_url("https://owner-space.hf.space.evil.example/file=video.mp4", SPACE_ORIGIN))

    def test_huggingface_origin_must_be_a_space_origin(self):
        self.assertTrue(MODULE.is_trusted_space_origin("https://huggingface.co/spaces/owner/space"))
        self.assertFalse(MODULE.is_trusted_space_origin("https://huggingface.co/"))
        self.assertFalse(MODULE.is_trusted_space_origin("http://owner-space.hf.space"))

    def test_filedata_url_is_preferred_over_untrusted_path(self):
        self.assertEqual(
            MODULE.extract_file_value({"path": "/etc/passwd", "url": FILE_URL}),
            FILE_URL,
        )

    def test_local_paths_are_rejected_without_opening_them(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(RuntimeError, "local paths are not accepted"):
                MODULE.materialize_output("/etc/passwd", Path(directory) / "output.mp4", SPACE_ORIGIN)

    def test_cross_origin_redirect_is_rejected(self):
        handler = MODULE.SameOriginRedirectHandler(SPACE_ORIGIN)
        request = Request(FILE_URL)
        with self.assertRaises(URLError):
            handler.redirect_request(
                request,
                io.BytesIO(),
                302,
                "Found",
                {},
                "http://169.254.169.254/latest/meta-data",
            )

    def test_same_origin_mp4_is_downloaded_atomically(self):
        with tempfile.TemporaryDirectory() as directory:
            destination = Path(directory) / "output.mp4"
            response = FakeResponse(
                MP4_BYTES,
                FILE_URL,
                {"Content-Length": str(len(MP4_BYTES))},
            )
            opener = FakeOpener(response)
            with patch.object(MODULE, "build_opener", return_value=opener):
                result = MODULE.materialize_output(
                    {"path": "/etc/passwd", "url": FILE_URL},
                    destination,
                    SPACE_ORIGIN,
                )
            self.assertEqual(result, destination)
            self.assertEqual(destination.read_bytes(), MP4_BYTES)
            self.assertEqual(opener.timeout, 120)
            self.assertFalse(destination.with_name(destination.name + ".part").exists())

    def test_download_size_limit_is_enforced_before_and_during_streaming(self):
        with tempfile.TemporaryDirectory() as directory:
            destination = Path(directory) / "output.mp4"
            response = FakeResponse(
                MP4_BYTES,
                FILE_URL,
                {"Content-Length": str(len(MP4_BYTES))},
            )
            with patch.object(MODULE, "MAX_VIDEO_BYTES", 1024):
                with patch.object(MODULE, "build_opener", return_value=FakeOpener(response)):
                    with self.assertRaisesRegex(RuntimeError, "size limit"):
                        MODULE.materialize_output(FILE_URL, destination, SPACE_ORIGIN)
            self.assertFalse(destination.exists())

    def test_non_mp4_output_is_rejected_and_partial_file_removed(self):
        with tempfile.TemporaryDirectory() as directory:
            destination = Path(directory) / "output.mp4"
            response = FakeResponse(
                b"not-a-video" + (b"x" * 2048),
                FILE_URL,
                {"Content-Length": "2059"},
            )
            with patch.object(MODULE, "build_opener", return_value=FakeOpener(response)):
                with self.assertRaisesRegex(RuntimeError, "valid MP4"):
                    MODULE.materialize_output(FILE_URL, destination, SPACE_ORIGIN)
            self.assertFalse(destination.exists())
            self.assertFalse(destination.with_name(destination.name + ".part").exists())


if __name__ == "__main__":
    unittest.main()
