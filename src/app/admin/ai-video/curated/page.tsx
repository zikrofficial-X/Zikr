import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function CuratedVideoLibraryLegacyPage() {
  // سلاسل قصص الأطفال تُعرض من المسار canonical التالي مع حماية الصلاحيات.
  redirect("/admin/video/studio/curated");
}
