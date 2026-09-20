import type { Metadata } from "next";
import { QuranCatalogPage } from "@/features/quran/components/quran-catalog-page";
import { pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "القرآن الكريم",
  description:
    "اقرأ واستمع إلى القرآن الكريم كاملاً: 114 سورة مع التفسير والتلاوات الصوتية بأصوات كبار القراء.",
  path: "/quran",
});

export default function QuranPage() {
  return <QuranCatalogPage />;
}
