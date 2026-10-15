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
    output.parent.mkdir(parents=True, exist_ok=True)
    normalized_text = clean_text(text)

    # Prefer Microsoft's neural voices when the endpoint accepts the runner's
    # connection. GitHub-hosted datacenter IPs can still receive WebSocket 403s,
    # even on edge-tts versions with Sec-MS-GEC v2 support.
    try:
        import edge_tts  # type: ignore

        communicate = edge_tts.Communicate(normalized_text, voice=voice, rate=rate, pitch=pitch)
        await communicate.save(str(output))
        if output.exists() and output.stat().st_size >= 1024:
            print(f"[arabic-tts] Primary provider succeeded: edge-tts voice={voice}")
            return
        raise RuntimeError("Edge TTS returned an empty or tiny audio file")
    except Exception as edge_error:
        output.unlink(missing_ok=True)
        print(
            "[arabic-tts] Edge TTS failed; trying the no-key Google Translate Arabic fallback: "
            + str(edge_error)[:300],
            file=sys.stderr,
        )

    try:
        from gtts import gTTS  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "Edge TTS failed and the gTTS fallback is not installed. "
            "Install gTTS==2.5.4 in the worker environment."
        ) from exc

    try:
        fallback_tld = os.getenv("ARABIC_TTS_FALLBACK_TLD", "com").strip() or "com"
        gTTS(normalized_text, lang="ar", tld=fallback_tld, slow=False).save(str(output))
        if not output.exists() or output.stat().st_size < 1024:
            output.unlink(missing_ok=True)
            raise RuntimeError("gTTS returned an empty or tiny audio file")
        print(f"[arabic-tts] Fallback provider succeeded: gTTS Arabic (tld={fallback_tld})")
    except Exception as fallback_error:
        output.unlink(missing_ok=True)
        raise RuntimeError(
            f"Both Arabic TTS providers failed. Edge TTS failed; gTTS fallback failed: "
            f"{str(fallback_error)[:400]}"
        ) from fallback_error

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
