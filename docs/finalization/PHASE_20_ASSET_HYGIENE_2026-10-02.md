# Phase 20 — Asset / Mobile Packaging Hygiene
## ZIKR Finalization — 2026-10-02

### Verified asset families

| Asset | Current locations | Decision |
|---|---|---|
| adhan.wav | public/audio, Android raw resources, iOS Resources | KEEP: platform packaging copies are intentional |
| adhan.mp3 | public/audio | KEEP: separate web audio format |
| mushaf-hafs.json | public/quran | KEEP: Quran runtime/catalog source |
| ayahs.json | public/offline-content/v1 | KEEP: offline-pack dataset contract |
| hadith.json | public/offline-content/v1 | KEEP: offline-pack dataset contract |

The three `adhan.wav` copies are the same recorded size and are referenced by the native/web configuration. They are not treated as accidental duplication.

The Quran/offline JSON files are also kept because their path contracts are consumed by different runtime layers. Equal file size is not sufficient evidence that either copy can be removed.

### Rule
No asset is deleted in Phase 20 unless:
1. all web references are absent;
2. offline/PWA references are absent;
3. Android packaging references are absent;
4. iOS packaging references are absent;
5. the replacement path is proven in CI.

### Outcome
Phase 20 is a hygiene/ownership pass. The safe result is to keep required platform copies and prevent future accidental deletion or unreferenced backup assets.
