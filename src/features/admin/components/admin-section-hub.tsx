import Link from "next/link";
import { Container } from "@/components/ui/container";

export type AdminHubLink = {
  href: string;
  label: string;
  description: string;
};

export function AdminSectionHub({
  eyebrow,
  title,
  description,
  links = [],
}: {
  eyebrow: string;
  title: string;
  description: string;
  links?: readonly AdminHubLink[];
}) {
  return (
    <Container className="space-y-8 py-10" dir="rtl">
      <header className="space-y-2">
        <p className="text-xs tracking-[0.22em] text-brand-cream/30">{eyebrow}</p>
        <h1 className="text-3xl font-bold text-brand-gold">{title}</h1>
        <p className="max-w-4xl text-sm leading-7 text-brand-cream/55">{description}</p>
      </header>

      {links.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5 transition hover:border-brand-gold/25 hover:bg-brand-gold/5"
            >
              <span className="text-base font-semibold text-brand-gold">{link.label}</span>
              <span className="mt-2 block text-sm leading-6 text-brand-cream/50">{link.description}</span>
              <span className="mt-4 inline-flex text-xs text-brand-gold/70">فتح الوحدة ←</span>
            </Link>
          ))}
        </section>
      )}

      <section className="rounded-2xl border border-brand-gold/10 bg-black/10 p-5">
        <p className="text-xs font-semibold tracking-wide text-brand-gold/70">CANONICAL ADMIN MODULE</p>
        <p className="mt-2 text-sm leading-7 text-brand-cream/45">
          هذا المسار هو نقطة الدخول الرسمية لهذه الوحدة داخل بنية الإدارة. تبقى الوحدات التشغيلية القديمة متاحة داخليًا فقط عند الحاجة للتوافق الخلفي.
        </p>
      </section>
    </Container>
  );
}
