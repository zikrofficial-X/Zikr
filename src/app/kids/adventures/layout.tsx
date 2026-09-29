import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "مغامرات ذِكر للأطفال",
  description: "مغامرات تعليمية تفاعلية للأطفال تجمع القيم والذاكرة والمواقف اليومية في تجربة آمنة.",
  path: "/kids/adventures",
});

export default function KidsAdventuresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
