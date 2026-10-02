# Phase 7 Checkpoint — Content Canonicalization
## ZIKR Finalization — 2026-10-02

### Status

**IN PROGRESS — implementation complete; verification gate pending.**

### Completed

- [x] Live content inventory captured.
- [x] Duplicate canonical slugs audited.
- [x] Existing unique slug indexes confirmed.
- [x] Canonical published-source resolver added.
- [x] Articles switched to database-authoritative catalogue selection.
- [x] Duas switched to database-authoritative catalogue selection.
- [x] Companions switched to database-authoritative catalogue selection.
- [x] Prophets switched to database-authoritative catalogue selection.
- [x] Existing DB-first services preserved where already correct.
- [x] No religious text was rewritten or deleted.
- [x] Dedicated content-canonicalization regression guard added.

### Gate

- [ ] `content:canonical:check` passes on the branch.
- [ ] Existing `verify:pr` passes with the new check included.
- [ ] Post-change live read confirms the canonical public catalogues still return published content.

### Release rule

Do not advance to Phase 8 until all three gates are verified.
