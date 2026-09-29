import { ContentGuide } from "@/components/content/content-guide";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import KidsProgressDashboard from "@/features/kids/components/games/progress-dashboard";

export const dynamic = "force-static";
export const metadata: Metadata = pageMetadata({ title: "تقدم ألعاب الأطفال | ذكر", description: "تتبع مستوى ونتائج وشارات عالم ذِكر للأطفال.", path: "/kids/progress" });

export default function KidsProgressPage() { return <KidsProgressDashboard />; }
