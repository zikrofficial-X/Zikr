
"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { runPostCommitAudit } from "@/features/admin/services/post-commit-audit";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import { prepareAndroidRelease } from "@/features/releases/services/github-release-manager";


type AdminAuditEvent = Parameters<typeof recordAdminAuditEvent>[0];
async function recordAdminAuditEventSafely(event: AdminAuditEvent): Promise<boolean> {
  return runPostCommitAudit(
    () => recordAdminAuditEvent(event),
    (error) => console.error("[admin/release] audit event failed after committed mutation:", error),
  );
}

export async function createAndroidReleaseAction() {
  const profile = await requireAdminPermission("release.manage");

  const existing = await supabaseServerAdminRequest<
    Array<{ value?: unknown }>
  >(
    "/rest/v1/admin_settings?key=eq.android_release_operation&select=value&limit=1",
    { method: "GET" },
  ).catch(() => []);

  const current = existing?.[0]?.value as
    | { status?: string; tag?: string; startedAt?: string }
    | undefined;

  if (
    current?.status === "building" &&
    current.startedAt &&
    Date.now() - Date.parse(current.startedAt) < 6 * 60 * 60 * 1000
  ) {
    redirect("/admin/release?android_release_error=" + encodeURIComponent("يوجد إصدار Android قيد البناء بالفعل. انتظر اكتماله قبل إطلاق إصدار جديد."));
  }

  let result: Awaited<ReturnType<typeof prepareAndroidRelease>>;
  try {
    result = await prepareAndroidRelease();
  } catch (error) {
    const reason = error instanceof Error ? error.message : "تعذر تجهيز إصدار Android.";
    redirect("/admin/release?android_release_error=" + encodeURIComponent(reason));
  }

  const now = new Date().toISOString();

  await supabaseServerAdminRequest("/rest/v1/admin_settings?on_conflict=key", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: "android_release_operation",
      value: {
        status: "building",
        tag: result.tag,
        version: result.version,
        versionCode: result.versionCode,
        commitSha: result.commitSha,
        releaseId: result.releaseId,
        releaseUrl: result.releaseUrl,
        startedAt: now,
        startedBy: profile.id,
        note:
          "Draft GitHub Release created and tagged. CircleCI should build the semantic release tag; `publish-android-release-assets.yml` publishes only after APK/AAB signatures and SHA256SUMS pass.",
      },
      updated_at: now,
    }),
  });

  await supabaseServerAdminRequest("/rest/v1/site_settings?on_conflict=key", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: "android_release",
      value: {
        mode: "auto",
        releaseTag: null,
        updatedAt: now,
      },
      updated_at: now,
    }),
  });

  await recordAdminAuditEventSafely({
    action: "admin.android_release.create",
    permission: "release.manage",
    resourceType: "github_release",
    resourceId: result.tag,
    metadata: {
      version: result.version,
      versionCode: result.versionCode,
      commitSha: result.commitSha,
      releaseId: result.releaseId,
      releaseUrl: result.releaseUrl,
      actor: profile.id,
    },
  });

  updateTag("site-setting:android_release");
  revalidatePath("/admin/release");
  revalidatePath("/admin/android");
  revalidatePath("/platform");
  revalidatePath("/api/app-version");
  revalidatePath("/api/download/android");
  revalidatePath("/api/download/android/aab");

  redirect(
    "/admin/release?android_release=started&tag=" +
      encodeURIComponent(result.tag),
  );
}
