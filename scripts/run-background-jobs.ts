import { execFileSync } from "node:child_process";
import { join } from "node:path";
import {
  processTemplateVideoQueue,
  reconcileCompletedVideoSocialQueue,
  seedAutomatedVideoRequests,
} from "./jobs/template-video-automation";
import { processSocialPublishQueue } from "./jobs/social-publishing";
import { retryPendingPublishedVideoCleanup, resetQueuedSocialVideoMedia } from "../src/features/social/services/social-publishing";
import { processScheduledContent } from "./jobs/content-publishing";
import { getVideoEngineConfig } from "../src/features/videos/providers/types";
import { supabaseServerAdminRequest } from "../src/lib/supabase/admin-rest";
import { notifyNewQueueFailures } from "./jobs/admin-queue-alerts";
type VideoAutomationRunNow = {
  requestedAt: string;
  requestedBy?: string | null;
  dispatchedAt?: string | null;
};

type VideoAutomationSettings = {
  enabled: boolean;
  batchSize: number;
  aiEnabled: boolean;
  autoPublish: boolean;
  facebookEnabled: boolean;
  dailyTarget: number;
  aiAttemptsPerRun: number;
  videoSeconds: number;
  runNowRequest: VideoAutomationRunNow | null;
};

function parseBoolSetting(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
}

function parseBoundedNumberSetting(value: unknown, fallback: number, m¶»§q«^