import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { dispatchGitHubWorkflow } from "@/lib/github/dispatch-workflow";
import {
  adoptServerConfiguredFacebookPageToken,
  getFacebookPageConnectionHealth,
  unblockFacebookAuthBlockedQueue,
} from "@/features/social/services/facebook-credentials";

export const dynamic = "force-dynamic";

type QueueItem = {
  id: string;
  content_type: string;
  content_id: string | null;
  title: string;
  target_platforms: string[];
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  error_message: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
};

const retryableStatuses = new Set(["failed", "partial"]);

function successfulPlatforms(
  metadata: Record<string, unknown> | null | undefined
): Set<string> {
  const values = metadata?.platformResults;
  const result = new Set<string>();

  if (values && typeof values === "object" && !Array.isArray(values)) {
    for (const [platform, value] of Object.entries(values)) {
      if (!value || typeof value !== "object") continue;
      const row = value as {
        platform?: unknown;
        ok?: unknown;
        remoteId?: unknown;
      };
      if (
        row.ok === true¶»§q«^