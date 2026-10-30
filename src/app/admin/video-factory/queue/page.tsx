import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function VideoFactoryQueueLegacyPage() {
  redirect("/admin/video/requests");
}
