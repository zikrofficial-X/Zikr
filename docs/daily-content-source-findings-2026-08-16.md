# Daily Content Source Findings

## Quran Foundation / Quran.com

Source: https://quran.com/en/developers and https://api-docs.quran.foundation/

The official developer pages state that Quran.com provides verified Quran text, translations, tafsir, word-for-word morphology, recitations, and content APIs. The API documentation says content APIs are intended for backend/server calls and expose chapters, verses, translations, tafsir, audio, and search. Access requires creating an application in the Quran Foundation Developer Console, storing the client secret server-side, and requesting production permissions where required. Search has a separate pre-live permission. This makes Quran Foundation suitable for canonical Quran-related synchronization only after credentials and permission are configured; it should not be called from browser code with private credentials.

## Engineering implication

The daily updater must keep Quran text, translations, tafsir, and recitations in their own source-scoped paths, store the upstream reference and retrieval timestamp, validate the response schema, deduplicate by stable upstream identifiers, and publish only records that pass source and content checks. Generated AI text must never be used as a replacement for canonical Quran or hadith source material.
