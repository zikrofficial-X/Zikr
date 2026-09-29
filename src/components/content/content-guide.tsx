import Link from "next/link";
import { BookOpen, CircleHelp, ExternalLink, Info } from "lucide-react";

type GuideLink = {
  label: string;
  href: string;
};

type ContentGuideProps = {
  title: string;
  intro: string;
  items: string[];
  links?: GuideLink[];
  note?: string;
};

export function ContentGuide({
  title,
  intro,
  items,
  links = [],
  note,
}: ContentGuideProps) {
  return (
    <section
      aria-labelledby="content-guide-title"
      className="rounded-2xl border border-brand-gold/15 bg-brand-gold/5 p-5 md:p-6"
      dir="rtl"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl border border-brand-gold/20 bg-black/15 p-2 text-brand-gold">
          <BookOpen className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="content-guide-title" className="text-xl font-bold text-brand-gold">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-7 text-brand-cream/75">{intro}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-xl border border-brand-gold/10 bg-black/10 p-4 text-sm leading-7 text-brand-cream/80"
          >
            <div className="flex items-start gap-2">
              <Info className="mt-1 h-4 w-4 shrink-0 text-brand-gold/80" aria-hidden="true" />
              <span>{item}</span>
            </div>
          </div>
        ))}
      </div>

      {links.length > 0 && (
        <div className="mt-5 rounded-xl border border-brand-gold/10 bg-black/10 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-gold">
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            مراجع وروابط مساعدة
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                className="inline-flex items-center gap-1 rounded-lg border border-brand-gold/15 px-3 py-2 text-sm text-brand-cream/80 transition-colors hover:border-brand-gold/40 hover:text-brand-gold"
              >
                {link.label}
                {link.href.startsWith("http") && (
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {note && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-brand-gold/10 bg-black/10 p-4 text-xs leading-6 text-brand-cream/60">
          <CircleHelp className="mt-1 h-4 w-4 shrink-0 text-brand-gold/60" aria-hidden="true" />
          <span>{note}</span>
        </div>
      )}
    </section>
  );
}
