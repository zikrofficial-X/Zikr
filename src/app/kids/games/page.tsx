import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import KidsGamesIndex from "@/features/kids/components/games/games-index";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "عالم ذِكر للأطفال | الألعاب",
  description: "ألعاب تعليمية آمنة وأصلية للأطفال ضمن عالم ذِكر.",
  path: "/kids/games",
});

export default function KidsGamesPage() {
  return <KidsGamesIndex />;
}
