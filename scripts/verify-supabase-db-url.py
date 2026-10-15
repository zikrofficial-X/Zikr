#!/usr/bin/env python3
"""Validate a Supabase PostgreSQL connection URL without printing credentials."""
from __future__ import annotations

import os
import sys
from urllib.parse import parse_qs, unquote, urlsplit


def fail(message: str) -> None:
    print(f"SUPABASE_DB_URL_VALIDATION_FAILED: {message}", file=sys.stderr)
    raise SystemExit(1)


raw_url = os.environ.get("SUPABASE_DB_URL", "").strip()
expected_ref = os.environ.get("EXPECTED_PROJECT_REF", "").strip()

if not raw_url:
    fail("SUPABASE_DB_URL is missing.")
if not expected_ref:
    fail("EXPECTED_PROJECT_REF is missing.")

try:
    parsed = urlsplit(raw_url)
except ValueError:
    fail("SUPABASE_DB_URL is not a valid PostgreSQL URL.")

if parsed.scheme not in {"postgres", "postgresql"} or not parsed.hostname:
    fail("SUPABASE_DB_URL must use postgres:// or postgresql:// with a hostname.")

# The project ref can occur in a database username or hostname. Never print
# the URL because it contains credentials.
if expected_ref not in raw_url:
    fail(f"SUPABASE_DB_URL does not identify expected project {expected_ref}.")

query = parse_qs(parsed.query, keep_blank_values=True)
# libpq accepts user in the URI query as well as in the authority.
# If supplied, the query parameter is checked as the effective user.
query_users = query.get("user", [])
if query_users and query_users[-1]:
    effective_user = unquote(query_users[-1])
else:
    effective_user = unquote(parsed.username or '')

if effective_user == "zikr_seed_loader":
    fail("the URL resolves to retired role zikr_seed_loader, which cannot connect for migration reconciliation. Replace the production GitHub secret with a valid administrative database connection; do not reactivate the retired seed-loader role.")

ssl_modes = query.get("sslmode", [])
if ssl_modes and ssl_modes[-1].lower() not in {"require", "verify-ca", "verify-full"}:
    fail("the URL explicitly disables or weakens TLS; use sslmode=require or stronger.")

print("SUPABASE_DB_URL_VALIDATION_PASSED: scheme, project target, role, and TLS options validated.")
