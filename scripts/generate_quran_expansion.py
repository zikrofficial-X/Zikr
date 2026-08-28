from __future__ import annotations

import json
import sys
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.request import Request, urlopen

API_BASE = "https://api.alquran.cloud/v1/surah/{surah}/ar.muyassar"
AUTHOR = "التفسير الميسر"
RETRIEVED_AT = "2026-08-17T00:00:00+00:00"

RECITERS = [
    ("be8e62a2-a607-4077-b17f-13f4695c69f1", "ar.abdulsamad", "https://server7.mp3quran.net/basit"),
    ("e264a728-1e12-4533-86a7-6240113d369c", "ar.as-sudais", "https://server11.mp3quran.net/sds"),
    ("5c00f8d1-f994-4e01-a897-bbf1352f212c", "ar.mahermuaiqly", "https://server12.mp3quran.net/maher"),
    ("200485ee-b041-47d9-b5a5-29ec34fe5946", "ar.alafasy", "https://server8.mp3quran.net/afs"),
    ("2db91ada-2da4-4abe-964d-9ea3feff5c49", "ar.minshawi", "https://server10.mp3quran.net/minsh"),
    ("76415e0d-83e9-4751-876c-b744b63202bb", "ar.saadghamidi", "https://server7.mp3quran.net/s_gmd"),
    ("e79cb6d8-e49f-463f-81a9-58139ac4a43d", "ar.shuraym", "https://server7.mp3quran.net/shur"),
]


def fetch_surah(surah: int) -> dict:
    last_error: Exception | None = None
    for attempt in range(4):
        try:
            request = Request(API_BASE.format(surah=surah), headers={"User-Agent": "Zikr-content-import/1.0"})
            with urlopen(request, timeout=90) as response:
                payload = json.load(response)
            if payload.get("code") != 200 or not payload.get("data", {}).get("ayahs"):
                raise RuntimeError(f"Invalid tafsir response for surah {surah}")
            return payload["data"]
        except Exception as error:
            last_error = error
            if attempt < 3:
                time.sleep(2 ** attempt)
    raise RuntimeError(f"Failed to fetch surah {surah}: {last_error}")


def sql_text(value: str | None) -> str:
    return "NULL" if value is None else "'" + value.replace("'", "''") + "'"


def main() -> int:
    output = Path(sys.argv[1] if len(sys.argv) > 1 else "supabase/migrations/20260817090000_expand_quran_tafsir_and_audio.sql")
    output.parent.mkdir(parents=True, exist_ok=True)

    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(fetch_surah, surah): surah for surah in range(1, 115)}
        surahs = []
        for future in as_completed(futures):
            surahs.append(future.result())
    surahs.sort(key=lambda row: row["number"])
    ayahs = [(int(surah["number"]), ayah) for surah in surahs for ayah in surah["ayahs"]]
    if len(ayahs) != 6236:
        raise RuntimeError(f"Expected 6236 tafsir rows, received {len(ayahs)}")

    for reciter_id, _code, base in RECITERS:
        for surah in (1, 2, 114):
            url = f"{base}/{surah:03d}.mp3"
            request = Request(url, method="HEAD", headers={"User-Agent": "Zikr-content-import/1.0"})
            with urlopen(request, timeout=60) as response:
                if response.status != 200:
                    raise RuntimeError(f"Audio source check failed: {url} ({response.status})")

    lines = [
        "-- Source-indexed Quran expansion: Al Quran Cloud ar.muyassar and mp3quran.net reciter streams.",
        "-- Generated from verified upstream responses; do not edit religious text manually.",
        "ALTER TABLE public.quran_tafsir ADD COLUMN IF NOT EXISTS source_url text;",
        "ALTER TABLE public.quran_tafsir ADD COLUMN IF NOT EXISTS retrieved_at timestamptz;",
        "ALTER TABLE public.quran_audio ADD COLUMN IF NOT EXISTS source_url text;",
        "ALTER TABLE public.quran_audio ADD COLUMN IF NOT EXISTS retrieved_at timestamptz;",
        "ALTER TABLE public.quran_audio ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;",
        "",
    ]
    for surah_id, ayah in ayahs:
        ayah_number = int(ayah["numberInSurah"])
        tafsir = ayah.get("text", "").strip()
        if not tafsir:
            raise RuntimeError(f"Empty tafsir for {surah_id}:{ayah_number}")
        lines.append(
            "INSERT INTO public.quran_tafsir (id,surah_id,ayah_number,tafsir_ar,author,created_at,updated_at,source_url,retrieved_at) "
            f"SELECT gen_random_uuid(),{surah_id},{ayah_number},{sql_text(tafsir)},{sql_text(AUTHOR)},now(),now(),{sql_text('https://api.alquran.cloud/v1/surah/' + str(surah_id) + '/ar.muyassar')},{sql_text(RETRIEVED_AT)} "
            f"WHERE EXISTS (SELECT 1 FROM public.quran_surahs WHERE id={surah_id}) "
            "ON CONFLICT (surah_id,ayah_number,author) DO UPDATE SET tafsir_ar=excluded.tafsir_ar,updated_at=now(),source_url=excluded.source_url,retrieved_at=excluded.retrieved_at;"
        )

    for reciter_id, code, base in RECITERS:
        for surah in range(1, 115):
            audio_url = f"{base}/{surah:03d}.mp3"
            row_id = uuid.uuid5(uuid.NAMESPACE_URL, f"{code}:{surah}")
            lines.append(
                "INSERT INTO public.quran_audio (id,surah_id,reciter_id,audio_url,source_url,retrieved_at,metadata) "
                f"SELECT {sql_text(str(row_id))},{surah},{sql_text(reciter_id)},{sql_text(audio_url)},{sql_text('https://www.mp3quran.net/')},{sql_text(RETRIEVED_AT)},'{{\"source\":\"mp3quran.net\",\"reciter_code\":{json.dumps(code, ensure_ascii=False)}}}'::jsonb "
                f"WHERE EXISTS (SELECT 1 FROM public.quran_surahs WHERE id={surah}) "
                "ON CONFLICT (id) DO UPDATE SET audio_url=excluded.audio_url,source_url=excluded.source_url,retrieved_at=excluded.retrieved_at,metadata=excluded.metadata;"
            )

    output.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps({"tafsir_rows": len(ayahs), "audio_rows": len(RECITERS) * 114, "output": str(output)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
