import Link from 'next/link';

export function LibraryAdminNav() {
  const links = [
    ['/admin/library', 'المكتبة الإسلامية'],
    ['/admin/library?view=sources', 'المصادر والتوثيق'],
    ['/admin/library?view=media', 'الوسائط والحقوق'],
    ['/admin/library?view=games', 'ألعاب الأطفال'],
    ['/admin/library?view=reviews', 'المراجعة والنشر'],
  ] as const;

  return (
    <div className="border-b border-brand-gold/10 bg-black/10">
      <div className="mx-auto flex max-w-[1800px] flex-wrap gap-2 px-4 py-2">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="rounded-lg border border-brand-gold/10 px-3 py-1.5 text-xs text-brand-cream/55 transition hover:border-brand-gold/30 hover:text-brand-gold">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
