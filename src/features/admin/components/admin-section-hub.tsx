import Link from "next/link";
import { Container } from "@/components/ui/container";

export type AdminHubLink = {
  href: string;
  label: string;
  description: string;
};

const LABELS: Record<string, string> = {
  Dashboard: "لوحة التحكم",
  "Audio Dashboard": "مركز الصوت",
  "Video Voices": "أصوات الفيديو",
  Audio: "الصوت",
  AUDIO: "الصوت",
  Quran: "القرآن",
  QURAN: "القرآن",
  Adhan: "الأذان",
  ADHAN: "الأذان",
  TTS: "تحويل النص إلى صوت",
  "Site Audio": "صوت الموقع",
  "SITE AUDIO": "صوت الموقع",
  Content: "المحتوى",
  CONTENT: "المحتوى",
  Categories: "التصنيفات",
  Sources: "المصادر",
  "Content Sources": "مصادر المحتوى",
  Editorial: "التحرير والنشر",
  Library: "مكتبة المحتوى",
  Search: "البحث والفهرسة",
  Knowledge: "المعرفة الإسلامية",
  Prophets: "الأنبياء",
  Battles: "الغزوات",
  Sections: "الأقسام",
  Kids: "الأطفال",
  Games: "الألعاب",
  Levels: "المستويات",
  Assets: "الأصول",
  Analytics: "التحليلات",
  "Video Studio": "استوديو الفيديو",
  "AI Video Studio": "استوديو الفيديو بالذكاء الاصطناعي",
  "Video Factory": "مصنع الفيديو",
  "VIDEO FACTORY": "مصنع الفيديو",
  Scripts: "نصوص السرد",
  Voices: "الأصوات",
  Visuals: "العناصر المرئية",
  Templates: "القوالب",
  Queue: "الطابور",
  QA: "ضبط الجودة",
  Scheduler: "التشغيل المجدول",
  Publishing: "النشر",
  "Automation Ops": "التشغيل الآلي",
  "Admin Settings": "إعدادات الإدارة",
  "Canonical Admin Module": "وحدة إدارة أساسية",
};

function translateLabel(value: string) {
  const direct = LABELS[value.trim()];
  if (direct) return direct;
  return value
    .split("/")
    .map((part) => LABELS[part.trim()] ?? part.trim())
    .join(" / ");
}

function translateEyebrow(value: string) {
  return value
    .split("/")
    .map((part) => translateLabel(part))
    .join(" / ");
}

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
        <p className="text-xs tracking-[0.18em] text-brand-cream/35">{translateEyebrow(eyebrow)}</p>
        <h1 className="text-3xl font-bold text-brand-gold">{translateLabel(title)}</h1>
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
              <span className="text-base font-semibold text-brand-gold">{translateLabel(link.label)}</span>
              <span className="mt-2 block text-sm leading-6 text-brand-cream/50">{link.description}</span>
              <span className="mt-4 inline-flex text-xs text-brand-gold/70">فتح الوحدة ←</span>
            </Link>
          ))}
        </section>
      )}

      <section className="rounded-2xl border border-brand-gold/10 bg-black/10 p-5">
        <p className="text-xs font-semibold tracking-wide text-brand-gold/70">وحدة إدارة أساسية</p>
        <p className="mt-2 text-sm leading-7 text-brand-cream/45">
          هذا المسار هو نقطة الدخول الرسمية لهذه الوحدة داخل بنية الإدارة. المسارات القديمة أو المكررة لا تظهر في التنقل الرئيسي ويتم تحويلها إلى المسار الرسمي عند الحاجة.
        </p>
      </section>
    </Container>
  );
}
