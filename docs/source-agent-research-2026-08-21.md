# Source-Verified Content Agent research

## Verified source documentation

The Quran.com developer page states that Quran Foundation provides API documentation and verified Quran text, translations, tafsir, and morphology resources: https://quran.com/en/developers.

The Quran Foundation API documentation states that Content APIs provide chapters, verses, translations, tafsir, audio, and search, and that an application should be created in the Developer Console for backend content access: https://api-docs.quran.foundation/.

Al Quran Cloud publishes a REST API reference for the Noble Quran: https://alquran.cloud/api.

Sunnah.com states that its API provides a portion of hadith data, is manually checked progressively, and requires an API key requested through its developer process: https://sunnah.com/developers.

## Implementation consequence

The source registry seeds these documented sources but keeps Quran Foundation and Sunnah.com disabled until credentials and parser approval are configured. Al Quran Cloud is the only initially enabled source and is restricted to a catalog parser that stores source metadata in a non-published review queue; it does not synthesize religious text. No AI-generated Quran, hadith, ruling, or scholarly quotation is published.
