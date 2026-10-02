import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "قسم الأطفال",
  description: "عالم ذِكر للأطفال: ألعاب تعليمية ومغامرات آمنة وأنشطة تساعد الطفل على التعلم والمرح.",
  path: "/kids",
});

export default function KidsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
