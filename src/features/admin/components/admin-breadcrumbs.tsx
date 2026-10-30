import Link from "next/link";
import { ADMIN_MODULES } from "@/features/admin/config/modules";

export function AdminBreadcrumbs({ current, parentHref = "/admin" }: { current: string; parentHref?: string }) {
  const parent = ADMIN_MODULES.find((module) => module.basePath === parentHref);
  return (
    <nav aria-label="مسار التنقل الإداري" dir="rtl" className="mb-4 flex flex-wrap items-center gap-2 text-xs text-brand-cream/40">
      <Link href="/admin" className="transition hover:text-brand-gold">لوحة الإدارة</Link>
      {parent && parent.basePath !== "/admin" ? <><span aria-hidden="true">/</span><Link href={parent.basePath} className="transition hover:text-brand-gold">{parent.label}</Link></> : null}
      <span aria-hidden="true">/</span>
      <span className="text-brand-cream/70" aria-current="page">{current}</span>
    </nav>
  );
}
