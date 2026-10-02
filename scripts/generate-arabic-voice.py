#!/usr/bin/env python3
"""Generate Arabic narration for ZIKR videos using the free Edge TTS endpoint."""
from __future__ import annotations

import argparse
import asyncio
import os
import re
import sys
from pathlib import Path


def clean_text(value: str) -> str:
    text = re.sub(r"<[^>]+>", " ", value or "")
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        raise ValueError("Arabic narration text is empty")
    # Avoid accidentally requesting an unbounded cloud synthesis job.
    return text[:8000]


async def synthesize(text: str, output: Path, voice: str, rate: str, pitch: str) -> None:
    try:
        import edge_tts  # type: ignore
    except ImportError as exc:
        raise RuntimeError("edge-tts is required; install it with python -m pip install edge-tts") from exc

    output.parent.mkdir(parents=True, exist_ok=True)
    communicate = edge_tts.Communicate(clean_text(text), voice=voice, rate=rate, pitch=pitch)
    await communicate.save(str(output))
    if not output.exists() or output.stat().st_size < 1024:
        raise RuntimeError("Arabic TTS returned an empty audio file")


# Male Arabic Edge TTS voice profiles (ARABIC_TTS_PROFILE). ARABIC_TTS_VOICE overrides the profile.
VOICE_PROFILES = {
    "msa": "ar-SA-HamedNeural",
    "egyptian": "ar-EG-ShakirNeural",
}
DEFAULT_PROFILE = "msa"


def default_voice() -> str:
    explicit = os.getenv("ARABIC_TTS_VOICE", "").strip()
    if explicit:
        return explicit
    return VOICE_PROFILES.get(os.getenv("ARABIC_TTS_PROFILE", DEFAULT_PROFILE).strip().lower(), VOICE_PROFILES[DEFAULT_PROFILE])


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--text", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--voice", default=default_voice())
    parser.add_argument("--rate", default=os.getenv("ARABIC_TTS_RATE", "-12%"))
    parser.add_argument("--pitch", default=os.getenv("ARABIC_TTS_PITCH", "-2Hz"))
    args = parser.parse_args()
    try:
        asyncio.run(synthesize(args.text, Path(args.output), args.voice, args.rate, args.pitch))
    except Exception as exc:  # pragma: no cover - CLI error path
        print(f"[arabic-tts] {exc}", file=sys.stderr)
        return 1
    print(f"[arabic-tts] Generated {args.output} with {args.voice}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
