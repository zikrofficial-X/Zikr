import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { getServerEnv } from "@/lib/env";
import {
  saveFacebookPageCredential,
  unblockFacebookAuthBlockedQueue,
} from "@/features/social/services/facebook-credentials";
import { supabaseServerAdminRequest } from "@/lib/supabase/admin-rest";
import { dispatchGitHubWorkflow } from "@/lib/github/dispatch-workflow";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATE_COOKIE = "zikr-facebook-oauth-state";
const REQUIRED_PERMISSIONS = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "read_insights",
] as const;

type MetaGraphError = {
  code?: unknown;
  message?: unknown;
};

class MetaOAuthError extends Error {
  code: string | null;
  constructor(code: unknown, message: unknown) {
    super(String(message ?? "Meta OAuth request failed."));
    this.name = "MetaOAuthError";
    this.code = code == null ? null : String(code);
  }
}

type GraphTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: MetaGraphError;
};

type ManagedPage = {
  id?: string;
  name?: string;
  access_token?: string;
  expires_at?: number | string;
  expires_in?: number;
  tasks?: string[];
};

type ManagedPagesResponse = {
  data?: ManagedPage[];
  error?¶»§q«^