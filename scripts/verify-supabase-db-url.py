#!/usr/bin/env python3
"""Validate a Supabase PostgreSQL connection URL without printing credentials."""
from __future__ import annotations

import os
import re
import sys
from urllib.parse import unquote, urlsplit


def fail(message: str) -> None:
    print(f"SUPABASE_DB_URL_VALIDATION_FAILED: {message}", file=sys.stderr)
    raise SystemExit(1)


raw_url = os.environ.get("SUPABASE_DB_URL", "").strip()
expected_ref = os.environ.get("EXPECTED_PROJECT_REF", "").strip()

if not raw_url:
    fail("SUPABASE_DB_URL is missing.")
if not re.fullmatch(r"[a-z0-9]{20}", expected_ref):
    fail("EXPECTED_PROJECT_REF must be a 20-character lowercase Supabase project ref.")

def query_values(query: str, name: str) -> list[str]:
    values: list[str] = []
    for pair in query.split("&"):
        if not pair:
            continue
        key, separator, value = pair.partition("=")
        try:
            decoded_key = unquote(key, errors="strict")
            decoded_value = unquote(value if separator else "", errors="strict")
        except UnicodeDecodeError:
            fail("SUPABASE_DB_URL contains invalid percent-encoded query data.")
        if decoded_key == name:
            values.append(decoded_value)
    return values


def single_query_value(query: str, name: str) -> str | None:
    values = query_values(query, name)
    if len(values) > 1:
        fail(f"SUPABASE_DB_URL must not contain duplicate {name} parameters.")
    return values[0] if values else None


try:
    parsed = urlsplit(raw_url)
    hostname = (parsed.hostname or "").lower().rstrip(".")
    authority_port = parsed.port
    authority_user = unquote(parsed.username or "", errors="strict")
    path_database = unquote(parsed.path.lstrip("/"), errors="strict")
except (ValueError, UnicodeDecodeError):
    fail("SUPABASE_DB_URL is not a valid PostgreSQL URL.")

if parsed.scheme not in {"postgres", "postgresql"} or not hostname:
    fail("SUPABASE_DB_URL must use postgres:// or postgresql:// with a hostname.")

# libpq allows query parameters to replace values from the URI authority.
# Validate the effective connection target rather than trusting only the
# hostname printed before the query string.
for unsupported in ("hostaddr", "service", "servicefile", "options", "ssl"):
    if query_values(parsed.query, unsupported):
        fail(f"SUPABASE_DB_URL must not override the connection through {unsupported}.")

query_host = single_query_value(parsed.query, "host")
if query_host is not None and query_host.lower().rstrip(".") != hostname:
    fail("the effective database host does not match the URI authority hostname.")

query_port = single_query_value(parsed.query, "port")
if query_port is not None:
    if not query_port.isdigit():
        fail("the effective database port must be numeric.")
    effective_port = int(query_port)
    if authority_port is not None and effective_port != authority_port:
        fail("the effective database port does not match the URI authority port.")
else:
    effective_port = authority_port

query_user = single_query_value(parsed.query, "user")
if query_user is not None:
    effective_user = query_user
else:
    effective_user = authority_user
if not effective_user:
    fail("SUPABASE_DB_URL must identify a non-empty database user.")

query_database = single_query_value(parsed.query, "dbname")
if query_database is not None and path_database and query_database != path_database:
    fail("the effective database name does not match the URI path.")
effective_database = query_database or path_database
if effective_database != "postgres":
    fail("SUPABASE_DB_URL must target the postgres database explicitly.")

direct_host = f"db.{expected_ref}.supabase.co"
pooler_host = re.fullmatch(r"aws-\\d+-[a-z0-9-]+\\.pooler\\.supabase\\.com", hostname)

if hostname == direct_host:
    if effective_user not in {"postgres", f"postgres.{expected_ref}"}:
        fail("the direct Supabase database endpoint must use its postgres administrative role.")
    if effective_port not in {None, 5432}:
        fail("the direct Supabase database endpoint must use port 5432.")
elif pooler_host:
    if effective_user != f"postgres.{expected_ref}":
        fail("the Supabase pooler username must be postgres.<expected project ref>.")
    if effective_port not in {None, 5432, 6543}:
        fail("the Supabase pooler must use its supported PostgreSQL port.")
else:
    fail("the database hostname is not the expected project's direct endpoint or supported Supabase pooler.")

ssl_mode = single_query_value(parsed.query, "sslmode")
if ssl_mode is None or ssl_mode.lower() not in {"require", "verify-ca", "verify-full"}:
    fail("the connection URL must explicitly require TLS with sslmode=require, verify-ca, or verify-full.")

print("SUPABASE_DB_URL_VALIDATION_PASSED: endpoint, effective role, project ref, and TLS mode validated.")
