import { NextRequest, NextResponse } from "next/server";
import { getVideoEngineConfig } from "@/features/videos/providers/types";
import { processTemplateVideoQueue, seedAutomatedVideoRequests } from "../../../../../../scripts/jobs/template-video-automation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const expected = process.env.INTERNAL_JOB_SECRET?.trim();
  const received = request.headers.get("x-internal-job-secret")?.trim() || request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!expected || !received || received !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const config = getVideoEngineConfig();
  const startedAt = Date.now();
  try {
    const created = await seedAutomatedVideoRequests();
    const processed = config.dryRun ? { processed: 0, succeeded: 0, failed: 0 } : await processTemplateVideoQueue(config.dailyLimit);
    return NextResponse.json({ ok: true, job: "daily_verified_video_seed", dryRun: config.dryRun, created, processed, durationMs: Date.now() - startedAt });
  } catch {
    return NextResponse.json({ error: "Daily video job failed." }, { status: 500 });
  }
}
