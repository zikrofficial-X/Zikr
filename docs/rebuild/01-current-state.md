# ZIKR Rebuild Baseline

Date: 2026-09-19

- Repository: Zikrmediaofficial/Zikr
- Rebuild branch: rebuild/clean-foundation-v2
- Main baseline: 1,142 files / ~96.5 MB
- Live Supabase: Zikr / eydxvcamhjhajxjrsgym
- PostgreSQL: 17.6.1.104
- Public tables: 111
- Public tables without RLS: 0
- Recorded migrations: 230
- Performance advisor: 113 unused-index findings
- Auth advisor: leaked-password protection disabled

Overlapping/legacy areas requiring review include favorites, notifications, social sync state, admin audit records, subscription/payment records, and prayer caches. No production database object is deleted by the rebuild.
