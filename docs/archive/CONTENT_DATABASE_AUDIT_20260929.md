# ZIKR — Content Database Record Audit
Date: 29 September 2026
Repository: zikr-org/Zikr
Production Supabase: nmdeazfmtncelykzxkhs

## Scope

This pass audited the published records in the main content tables, record-by-record using source/length/status fields, then applied targeted content and metadata improvements instead of only changing page UI.

Published inventory at audit time:

| Table | Total | Published | Result |
|---|---:|---:|---|
| articles | 78 | 38 | 38 published records audited; all now have source metadata |
| stories | 21 | 21 | Quran-sourced and fictional editorial stories explicitly separated |
| prophets | 25 | 25 | All profiles expanded and mapped to Quran-first references |
| companions | 17 | 12 | All published profiles expanded and source-indexed |
| scholars | 8 | 8 | All profiles expanded and source-verified |
| videos | 9 | 9 | All descriptions expanded; all external sources marked pending verification |
| duas | 33 | 33 | Quran and editorial-source types explicitly classified |
| hadiths | 2964 | 2964 | Every record has a source reference; source-provided grades were preserved/annotated |

## Deficiencies found and fixed

### Articles
13 published editorial articles had no source metadata.
Fixed by adding source classification, direct source URLs, explicit attribution sections, and published editorial status.

### Stories
9 records were short and had no source because they were written as fictional educational stories.
Fixed by labeling them explicitly as fictional/editorial, expanding each with plot-learning context and reflection questions, and attaching ZIKR editorial policy as provenance.
The other 12 published stories already had direct Quran references and were classified as Quran-sourced.

### Prophets
All 25 published prophet records had reference data, but the biographies were too compressed.
Fixed by expanding every biography, adding Quran-first reference maps, and adding context about what the Quran does and does not state while avoiding unsupported extra-Quranic details.

### Companions
All 12 published companion records were reviewed. The shortest entries were expanded, including Abu Bakr, Hamzah, Umar, Uthman, Ali, Bilal, Abu Dharr, Khadijah, Khalid ibn al-Walid, Ibn Abbas and Zayd ibn Thabit.
Abu Bakr previously had no references; it now has a direct hadith reference to Jami at-Tirmidhi 3657.

### Scholars
All 8 published scholar biographies were expanded and their existing source verification metadata retained.

### Videos
All 9 published videos had an external YouTube identifier, but the repository metadata explicitly said channel ownership needed verification.
Fixed by expanding descriptions, adding canonical YouTube watch URLs, and marking every record as source_verification_status=pending.
No video was promoted to a verified-source state.

### Duas
33 published duas were reviewed. 13 are Quran-sourced and 20 are original/editorial supplication texts already marked not_hadith_quote=true.
The 20 editorial records are now explicitly classified as source_type=editorial. Short Quranic duas were not artificially expanded.

### Hadiths
All 2,964 published hadith records have a source reference.
1,704 records belong to Sahih al-Bukhari or Sahih Muslim and are explicitly labeled in the grade field as being within those collections.
The remaining 1,260 records come from other collections. Their individual grade was not invented; they are explicitly marked as not provided in the source dataset.

## Final quality checks

- Published articles without source metadata: 0
- Published stories without source URL: 0
- Published prophets without primary reference mapping: 0
- Published companions without references: 0
- Published scholars without source verification: 0
- Published duas without a source field: 0
- Published hadiths without a reference: 0
- Companion biographies under 300 characters: 0
- Scholar biographies under 300 characters: 0
- Prophet biographies under 300 characters: 0

## Editorial rule applied
The audit distinguishes source-backed religious content, modern editorial guidance, fictional educational stories, and externally hosted media awaiting verification. The database should never imply that these categories have the same evidentiary status.

## Verified external references used in the audit
- Sahih al-Bukhari 3815 — Khadijah.
- Sahih al-Bukhari 75 — Ibn Abbas and the prayer for knowledge.
- Sahih al-Bukhari 3522 — Abu Dharr's conversion narrative.
- Sahih al-Bukhari 4989 — Zayd ibn Thabit and the collection of the Quran.
- Jami at-Tirmidhi 3657 — Abu Bakr's virtues.

## Remaining review item
The only unresolved content-quality state is the 9 published YouTube videos: their identifiers exist, but external source ownership was not independently verified in this audit. They remain explicitly flagged as pending rather than being described as verified sources.