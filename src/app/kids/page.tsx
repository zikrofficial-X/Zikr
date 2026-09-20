export const dynamic = "force-dynamic";
import Image from "next/image";
import { pageMetadata } from "@/lib/site";

import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { getKidsContent } from "@/features/kids/services/kids-content";

const typeLabels: Record<string, string> = {
  story: "قصة",
  prayer: "دعاء",
  wudu: "الوضوء",
  quiz: "اختبار",
  game: "لعبة",
  video: "فيديو",
  memorize: "حفظ",
  puzzle: "لغز",
  coloring: "تلوين",
  matching: "توصيل",
  lesson: "درس",
};

const ageGroupLabels: Record<string, string> = {
  "3-5": "3-5 سنوات",
  "6-8": "6-8 سنوات",
  "9-12": "9-12 سنة",
  "13-15": "13-15 سنة",
};

// Full static content library is always merged with the database so a slow
// or partially unavailable Supabase request cannot hide the local catalogue.
export const metadata = pageMetadata({
  title: "قسم الأطفال | ذكر",
  description: "محتوى إسلامي تعليمي وترفيهي آمن ومناسب للأطفال",
  path: "/kids",
});

export default async function KidsPage() {
  const content = await getKidsContent();

  return (
    <Container className="py-12 space-y-12">
      <section className="text-center space-y-4">
        <span className="inline-flex rounded-full border border-brand-gold/30 bg-brand-gold/10 px-4 py-2 text-sm text-brand-gold">
          مدينة ذِكر للصغار
        </span>
        <h1 className="text-4xl font-bold text-brand-gold md:text-5xl">قسم الأطفال</h1>
        <p className="text-brand-cream/70 max-w-2xl mx-auto text-lg leading-relaxed">
          قصص قصيرة، قيم جميلة، ألعاب ذكية ومهام عائلية تجعل التعلم الإسلامي رحلة محبة واكتشاف.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2 text-sm" aria-label="إحصاءات قسم الأطفال">
          <span className="rounded-full bg-brand-emerald/15 px-4 py-2 text-brand-emerald">{content.length} نشاطًا ومحتوى</span>
          <span className="rounded-full bg-brand-gold/15 px-4 py-2 text-brand-gold">4 مسارات عمرية</span>
          <span className="rounded-full bg-brand-cream/10 px-4 py-2 text-brand-cream/80">آمن مع إشراف الأسرة</span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" aria-labelledby="kids-quick-start">
        <h2 id="kids-quick-start" className="sr-only">ابدأ رحلة التعلم</h2>
        <Link href="/kids/adventures" className="group">
          <Card className="h-full border-brand-gold/30 bg-gradient-to-br from-brand-gold/15 to-transparent p-5 transition-transform group-hover:-translate-y-1">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-brand-gold/70">المسار الأول</p>
            <h3 className="text-xl font-bold text-brand-gold">مغامرات القيم</h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-cream/70">مهام صغيرة للتعاون والصدق والرحمة والسلامة الرقمية.</p>
          </Card>
        </Link>
        <Link href="/kids/adventures?mode=memory" className="group">
          <Card className="h-full border-brand-emerald/30 bg-gradient-to-br from-brand-emerald/15 to-transparent p-5 transition-transform group-hover:-translate-y-1">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-brand-emerald/70">العب وتعلم</p>
            <h3 className="text-xl font-bold text-brand-emerald">مختبر الذاكرة</h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-cream/70">ألعاب ذاكرة وأسئلة سريعة تربط الذكر بالمواقف اليومية.</p>
          </Card>
        </Link>
        <Link href="/kids/puzzle" className="group">
          <Card className="h-full border-brand-gold/30 bg-gradient-to-br from-brand-gold/10 to-transparent p-5 transition-transform group-hover:-translate-y-1">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-brand-gold/70">تحدي اليوم</p>
            <h3 className="text-xl font-bold text-brand-gold">مركز الترتيب</h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-cream/70">رتّب الأركان والصلوات وخطوات الوضوء واكسب نقاطًا تعليمية.</p>
          </Card>
        </Link>
        <Link href="/kids/quiz-akhlaq-adventure" className="group">
          <Card className="h-full border-brand-emerald/30 bg-gradient-to-br from-brand-emerald/10 to-transparent p-5 transition-transform group-hover:-translate-y-1">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-brand-emerald/70">اختبر نفسك</p>
            <h3 className="text-xl font-bold text-brand-emerald">أبطال الأخلاق</h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-cream/70">مواقف تفاعلية تساعد الطفل على التفكير واختيار التصرف الحسن.</p>
          </Card>
        </Link>
        <Link href="/kids/audio" className="group">
          <Card className="h-full border-brand-gold/30 bg-gradient-to-br from-brand-gold/10 to-transparent p-5 transition-transform group-hover:-translate-y-1">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-brand-gold/70">اسمع وردد</p>
            <h3 className="text-xl font-bold text-brand-gold">صوتيات الصغار</h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-cream/70">قصص وأناشيد وأذكار مع تسجيل القراءة محليًا على جهازك.</p>
          </Card>
        </Link>
        <Link href="/kids/achievements" className="group">
          <Card className="h-full border-brand-emerald/30 bg-gradient-to-br from-brand-emerald/10 to-transparent p-5 transition-transform group-hover:-translate-y-1">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-brand-emerald/70">شجع نفسك</p>
            <h3 className="text-xl font-bold text-brand-emerald">نادي النجوم</h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-cream/70">شارات ونجوم ولوحة شرف محلية تحتفل بالتقدم دون مقارنة.</p>
          </Card>
        </Link>
        <Link href="/kids/games" className="group">
          <Card className="h-full border-brand-gold/30 bg-gradient-to-br from-brand-gold/10 to-transparent p-5 transition-transform group-hover:-translate-y-1">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-brand-gold/70">العالم الجديد</p>
            <h3 className="text-xl font-bold text-brand-gold">عالم ألعاب ذِكر</h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-cream/70">اثنتا عشرة لعبة أصلية للحركة والذاكرة والتعلم والإبداع.</p>
          </Card>
        </Link>
      </section>

      {Object.entries(ageGroupLabels).map(([age, label]) => {
        const items = byAgeGroup(age);
        if (items.length === 0) return null;
        return (
          <section key={age} className="space-y-6">
            <h2 className="text-2xl font-bold text-brand-gold border-b border-brand-gold/20 pb-3">
              {label}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(item => (
                <Link key={item.id} href={`/kids/${item.slug}`}>
                  <Card className="h-full overflow-hidden hover:border-brand-gold/50 transition-colors cursor-pointer flex flex-col">
                    {item.featured_image_url && (
                      <div className="w-full h-40 bg-brand-gold/10 overflow-hidden">
                        <Image
                          src={item.featured_image_url}
                          alt={item.title_ar}
                          width={800}
                          height={600}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <div className="p-4 space-y-3 flex-1 flex flex-col">
                      <h3 className="text-lg font-bold text-brand-gold leading-relaxed">
                        {item.title_ar}
                      </h3>
                      <div className="flex gap-2 flex-wrap mt-auto">
                        <span className="px-2 py-1 bg-brand-gold/20 text-brand-gold rounded text-xs font-medium">
                          {typeLabels[item.type] ?? item.type}
                        </span>
                        <span className="px-2 py-1 bg-brand-emerald/20 text-brand-emerald rounded text-xs font-medium">
                          {label}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {/* Games section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-brand-gold border-b border-brand-gold/20 pb-3">
          الألعاب التعليمية
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/kids/puzzle">
            <Card className="h-full hover:border-brand-gold/50 transition-colors cursor-pointer flex flex-col">
              <div className="w-full h-40 bg-brand-gold/10 flex items-center justify-center">
                <span
                  className="text-5xl text-brand-gold/60"
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-16 h-16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z"
                    />
                  </svg>
                </span>
              </div>
              <div className="p-4 space-y-3 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-brand-gold leading-relaxed">
                  لعبة الترتيب الإسلامية
                </h3>
                <p className="text-brand-cream/60 text-sm leading-relaxed">
                  رتّب أركان الإسلام والوضوء والخلفاء في لعبة تفاعلية ممتعة
                </p>
                <div className="flex gap-2 flex-wrap mt-auto">
                  <span className="px-2 py-1 bg-brand-gold/20 text-brand-gold rounded text-xs font-medium">
                    لعبة
                  </span>
                  <span className="px-2 py-1 bg-brand-emerald/20 text-brand-emerald rounded text-xs font-medium">
                    6-12 سنة
                  </span>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/kids/adventures">
            <Card className="h-full hover:border-brand-emerald/50 transition-colors cursor-pointer flex flex-col border-brand-emerald/25 bg-brand-emerald/5">
              <div className="w-full h-40 bg-brand-emerald/10 flex items-center justify-center">
                <div className="rounded-full border-2 border-brand-emerald/50 px-5 py-3 text-center text-brand-emerald">
                  <span className="block text-xs">مركز</span>
                  <span className="text-lg font-bold">المغامرات</span>
                </div>
              </div>
              <div className="p-4 space-y-3 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-brand-emerald leading-relaxed">مغامرات ذِكر</h3>
                <p className="text-brand-cream/60 text-sm leading-relaxed">مهام قيم، ذاكرة أذكار، ومواقف آمنة تساعدك على التفكير والاختيار.</p>
                <div className="flex gap-2 flex-wrap mt-auto">
                  <span className="px-2 py-1 bg-brand-emerald/20 text-brand-emerald rounded text-xs font-medium">مغامرة</span>
                  <span className="px-2 py-1 bg-brand-gold/20 text-brand-gold rounded text-xs font-medium">3-12 سنة</span>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </section>

      <Card className="p-6 text-center space-y-3 bg-brand-gold/10 border-brand-gold/30">
        <h3 className="text-xl font-bold text-brand-gold">محتوى آمن ومعتمد</h3>
        <p className="text-brand-cream/80 leading-relaxed">
          جميع محتويات قسم الأطفال تم اختيارها بعناية لتكون آمنة ومفيدة ومناسبة
          لكل مرحلة عمرية
        </p>
      </Card>
    </Container>
  );
}
