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
    text = text.replace("—", "، ").replace("–", "، ").replace("•", "، ")
    text = re.sub(r"https?://\S+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        raise ValueError("Arabic narration text is empty")
    # Keep the canonical words intact while removing formatting that sounds awkward when spoken.
    return text[:5000]


VOICE_PROFILES = {
    "msa": {"voice": "ar-SA-HamedNeural", "rate": "-10%", "pitch": "-1Hz"},
    "hadith": {"voice": "ar-SA-HamedNeural", "rate": "-10%", "pitch": "-1Hz"},
    "documentary": {"voice": "ar-SA-HamedNeural", "rate": "-8%", "pitch": "-1Hz"},
    "egyptian": {"voice": "ar-EG-ShakirNeural", "rate": "-6%", "pitch": "0Hz"},
    "kids": {"voice": "ar-EG-ShakirNeural", "rate": "-6%", "pitch": "0Hz"},
}
DEFAULT_PROFILE = "msa"



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


def resolve_profile() -> dict[str, str]:
    profile_name = os.getenv("ARABIC_TTS_PROFILE", DEFAULT_PROFILE).strip().lower()
    return VOICE_PROFILES.get(profile_name, VOICE_PROFILES[DEFAULT_PROFILE])


def default_voice() -> str:
    explicit = os.getenv("ARABIC_TTS_VOICE", "").strip()
    return explicit or resolve_profile()["voice"]


def default_rate() -> str:
    return os.getenv("ARABIC_TTS_RATE", resolve_profile()["rate"])


def default_pitch() -> str:
    return os.getenv("ARABIC_TTS_PITCH", resolve_profile()["pitch"])


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--text", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--voice", default=default_voice())
    parser.add_argument("--rate", default=default_rate())
    parser.add_argument("--pitch", default=default_pitch())
    args = parser.parse_args()
    try:
        asyncio.run(synthesize(args.text, Path(args.output), args.voice, args.rate, args.pitch))
    except Exception as exc:  # pragma: no cover - CLI error path
        print(f"[arabic-tts] {exc}", file=sys.stderr)
        return 1
    print(f"[arabic-tts] Generated {args.output} with {args.voice} rate={args.rate} pitch={args.pitch}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
