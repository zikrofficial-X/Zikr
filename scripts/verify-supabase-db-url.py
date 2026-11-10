#!/usr/bin/env python3
"""Validate a Supabase PostgreSQL connection URL without printing credentials."""
from __future__ import annotations

import os
import re
import sys
from urllib.parse import parse_qs, unquote, urlsplit


def fail(message: str) -> None:
    print(f"SUPABASE_DB_URL_VALIDATION_FAILED: {message}", file=sys.stderr)
    raise SystemExit(1)


raw_url = os.environ.get("SUPABASE_DB_URL", "").strip()
expected_ref = os.environ.get("EXPECTED_PROJECT_REF", "").strip()

if not raw_url:
    fail("SUPABASE_DB_URL is missing.")
if not re.fullmatch(r"[a-z0-9]{20}", expected_ref):
    fail("EXPECTED_PROJECT_REF must be a 20-character lowercase Supabase project ref.")

try:
    parsed = urlsplit(raw_url)
    hostname = (parsed.hostname or "").lower().rstrip(".")
except ValueError:
    fail("SUPABASE_DB_URL is not a valid PostgreSQL URL.")

if parsed.scheme not in {"postgres", "postgresql"} or not hostname:
    fail("SUPABASE_DB_URL must use postgres:// or postgresql:// with a hostname.")

query = parse_qs(parsed.query, keep_blank_values=True)
# libpq accepts user in the URI query as well as in the authority. The query
# parameter takes precedence, so validate the effective user rather than only
# the authority component.
query_users = query.get("user", [])
if query_users and query_users[-1]:
    effective_user = query_users[-1]
else:
    effective_user = unquote(parsed.username or "")

if effective_user == "zikr_seed_loader":
    fail("the URL resolves to retired role zikr_seed_loader; use the current administrative database role.")

direct_host = f"db.{expected_ref}.supabase.co"
pooler_host = re.fullmatch(r"aws-\d+-[a-z0-9-]+\.pooler\.supabase\.com", hostname)

if hostname == direct_host:
    if effective_user not in {"postgres", f"postgres.{expected_ref}"}:
        fail("the direct Supabase database endpoint must use its postgres administrative role.")
elif pooler_host:
    if effective_user != f"postgres.{expected_ref}":
        fail("the Supabase pooler username must be postgres.<expected project ref>.")
else:
    fail("the database hostname is not the expected project's direct endpoint or supported Supabase pooler.")

ssl_modes = query.get("sslmode", [])
ssl_mode = ssl_modes[-1].lower() if ssl_modes else ""
if ssl_mode not in {"require", "verify-ca", "verify-full"}:
    fail("the connection URL must explicitly require TLS with sslmode=require, verify-ca, or verify-full.")

print("SUPABASE_DB_URL_VALIDATION_PASSED: endpoint, effective role, project ref, and TLS mode validated.")
