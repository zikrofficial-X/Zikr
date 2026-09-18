'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type AdminNavItem = { href: string; label: string };
export type AdminNavGroup = { group: string; items: AdminNavItem[] };

export function AdminSidebar({ groups }: { groups: AdminNavGroup[] }) {
  const pathname = usePathname();
  const isActive = (href: string) => href === '/admin' ? pathname === href : pathname.startsWith(href);
  return (
    <aside className="hidden w-72 shrink-0 flex-col border-l border-brand-gold/12 bg-black/35 lg:flex" style={{ backdropFilter: 'blur(12px)', minHeight: 'calc(100vh - 4rem)', position: 'sticky', top: '4rem' }}>
      <div className="border-b border-brand-gold/10 px-5 py-5">
        <p className="text-sm font-bold text-brand-gold" dir="rtl">لوحة التحكم الموحدة</p>
        <p className="mt-1 text-[11px] text-brand-cream/40" dir="rtl">مركز إدارة وتشغيل منصة ذِكرٌ</p>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto p-4" aria-label="التنقل الموحد في لوحة الإدارة">
        {groups.map((group) => (
          <section key={group.group}>
            <h2 className="mb-2 px-3 text-[10px] font-bold tracking-wide text-brand-gold/50" dir="rtl">{group.group}</h2>
            <ul className="space-y-1" role="list">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return <li key={item.href}><Link href={item.href} aria-current={active ? 'page' : undefined} className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors ${active ? 'border-brand-gold/25 bg-brand-gold/15 text-brand-gold' : 'border-transparent text-brand-cream/60 hover:border-brand-gold/15 hover:bg-brand-gold/8 hover:text-brand-gold'}`} dir="rtl"><span>{item.label}</span>{active && <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" aria-hidden="true" />}</Link></li>;
              })}
            </ul>
          </section>
        ))}
      </nav>
      <div className="border-t border-brand-gold/10 px-4 py-4 text-center text-[10px] text-brand-cream/25" dir="rtl">منصة ذِكرٌ · صلاحيات محكومة وسجل تدقيق</div>
    </aside>
  );
}

export function AdminMobileNav({ groups }: { groups: AdminNavGroup[] }) {
  const pathname = usePathname();
  const links = groups.flatMap((group) => group.items);
  return <nav className="border-b border-brand-gold/15 bg-black/25 px-3 py-2 lg:hidden" aria-label="التنقل السريع في لوحة الإدارة"><div className="flex gap-1.5 overflow-x-auto pb-1">{links.map((item) => { const active = item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`shrink-0 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs ${active ? 'border-brand-gold/30 bg-brand-gold/15 text-brand-gold' : 'border-transparent text-brand-cream/60 hover:text-brand-gold'}`}>{item.label}</Link>; })}<Link href="/" className="mr-auto shrink-0 whitespace-nowrap rounded-lg border border-brand-gold/25 px-3 py-1.5 text-xs text-brand-gold/80">عرض الموقع</Link></div></nav>;
}
