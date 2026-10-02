import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/features/admin/services/admin";

export const dynamic = "force-dynamic";

export default async function AudioSiteAudioRedirectPage() {
  await requireAdminPermission("audio.manage");
  redirect("/admin/site-audio");
}
