import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { getAllScholars } from "@/features/scholars/services/scholars";
import ScholarsPageView from "@/features/scholars/components/scholars-page";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "العلماء والدعاة",
  description: "تعرف على أبرز علماء الإسلام مع بيانات تعريفية ومصادر وروابط يمكن الرجوع إليها.",
  path: "/scholars",
});

export default async function ScholarsPage() {
  const scholars = await getAllScholars();
  return <ScholarsPageView scholars={scholars} />;
}
