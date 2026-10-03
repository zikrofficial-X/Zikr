import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { getProphetsWithStats } from "@/features/prophets/services/prophets";
import { pageMetadata } from "@/lib/site";
import { getRequestLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return pageMetadata({
    title: locale === "en" ? "Prophets and Messengers" : "قصص الأنبياء والرسل",
    description:
      locale === "en"
        ? "An organized knowledge index of the prophets and messengers mentioned in the Quran."
        : "قصص الأنبياء والرسل عليهم السلام — فهرس معرفي منظم مع نبذات ومحتوى قصصي قابل للقراءة.",
    path: "/prophets",
  });
}

export default async function ProphetsPage() {
  const locale = await getRequestLocale();
  const isEnglish = locale === "en";
  const displayProphets = await getProphetsWithStats();

  const totalStorySections = displayProphets.reduce(
    (total, prophet) => total + prophet.storySections,
    0,
  );
  const totalStoryChars = displayProphets.reduce(
    (total, prophet) => total + prophet.storyChars,
    0,
  );

  return (
    <main className="min-h-screen" dir={isEnglish ? "ltr" : "rtl"}>
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0A2A1E] to-[#071A13] py-20 text-center">
        <div className="pointer-events-none absolute inset-0 select-none opacity-10">
          <div className="absolute left-1/4 top-8 h-32 w-px rotate-12 bg-brand-gold" />
          <div className="absolute bottom-8 right-1/3 h-24 w-px -rotate-12 bg-brand-gold" />
        </div>

        <Container className="relative space-y-6">
          <p className="font-arabic text-sm tracking-widest text-brand-gold/60">
            {isEnglish ? "Prophets and messengers mentioned in the Quran" : "﴿ وَكُلًّا نَّقُصُّ عَلَيْكَ مِنْ أَنبَاءِ الرُّسُلِ ﴾"}
          </p>

          <h1 className="font-arabic text-5xl font-bold leading-tight text-brand-gold md:text-6xl">
            {isEnglish ? "Prophets and Messengers" : "قصص الأنبياء والرسل"}
          </h1>

          <p className="mx-auto max-w-2xl text-lg leading-8 text-brand-cream/70">
            {isEnglish
              ? "An organized index of prophets and messengers mentioned in the Quran, with profiles and direct links to available stories."
              : "فهرس منظم للأنبياء والرسل المذكورين في القرآن الكريم، مع نبذة لكل نبي وروابط مباشرة إلى القصة والمحتوى المتاح."}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-brand-gold">
                {displayProphets.length}
              </p>
              <p className="text-xs text-brand-cream/50">{isEnglish ? "prophets and messengers in the index" : "نبيًا ورسولًا في الفهرس"}</p>
            </div>

            <div className="h-10 w-px bg-brand-gold/20" />

            <div>
              <p className="text-3xl font-bold text-brand-gold">
                {totalStorySections.toLocaleString(isEnglish ? "en-US" : "ar-EG")}
              </p>
              <p className="text-xs text-brand-cream/50">{isEnglish ? "story sections available" : "قسمًا قصصيًا متاحًا"}</p>
            </div>

            <div className="h-10 w-px bg-brand-gold/20" />

            <div>
              <p className="text-3xl font-bold text-brand-gold">
                {totalStoryChars.toLocaleString("ar-EG")}
              </p>
              <p className="text-xs text-brand-cream/50">{isEnglish ? "characters of story content" : "حرفًا من المحتوى القصصي"}</p>
            </div>
          </div>
        </Container>
      </section>

      <Container className="space-y-8 py-12">
        {displayProphets.length === 0 ? (
          <section className="rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-8 text-center">
            <h2 className="text-2xl font-bold text-brand-gold">
              {isEnglish ? "No content is currently available" : "لا يوجد محتوى متاح حاليًا"}
            </h2>
            <p className="mt-3 text-brand-cream/60">
              {isEnglish ? "Unable to load the prophets index. Please try again." : "تعذر تحميل فهرس الأنبياء في هذه اللحظة. حاول فتح الصفحة مرة أخرى."}
            </p>
          </section>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {displayProphets.map((prophet, index) => {
              const colorClass = [
                "from-amber-900/40 to-yellow-900/40 border-amber-700/30",
                "from-emerald-900/40 to-teal-900/40 border-emerald-700/30",
                "from-sky-900/40 to-blue-900/40 border-sky-700/30",
                "from-rose-900/40 to-pink-900/40 border-rose-700/30",
                "from-violet-900/40 to-purple-900/40 border-violet-700/30",
              ][index % 5];

              return (
                <Link
                  key={prophet.id}
                  href={"/prophets/" + prophet.slug}
                  className="group block"
                >
                  <article
                    className={"h-full rounded-xl border bg-gradient-to-br " + colorClass + " p-5 transition-all duration-300 hover:scale-[1.02] hover:border-brand-gold/40 hover:shadow-xl hover:shadow-brand-gold/10"}
                  >
                    <div className="mb-3 flex items-start gap-4">
                      <div className="relative shrink-0">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-brand-gold/30 bg-brand-gold/10 transition-colors group-hover:border-brand-gold/60">
                          <span className="font-arabic text-lg font-bold text-brand-gold">
                            {(isEnglish ? prophet.nameEn : prophet.nameAr).slice(0, 2)}
                          </span>
                        </div>
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-brand-gold/40 bg-[#0A2A1E] text-[9px] font-bold text-brand-gold/70">
                          {prophet.orderNum ?? index + 1}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-bold leading-snug text-brand-gold">
                          {isEnglish ? prophet.nameEn : prophet.nameAr}
                        </h2>

                        

                        <Badge
                          variant="outline"
                          className="mt-1.5 border-brand-gold/30 text-[10px] text-brand-gold/70"
                        >
                          {prophet.storySections > 0
                            ? prophet.storySections + (isEnglish ? " story sections" : " أقسام قصصية")
                            : (isEnglish ? "Profile" : "نبذة وتعريف")}
                        </Badge>
                      </div>
                    </div>

                    {(isEnglish ? prophet.bioEn : prophet.bioAr) && (
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-brand-cream/70">
                        {isEnglish ? prophet.bioEn : prophet.bioAr}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-brand-cream/55">
                      <span className="rounded-full border border-brand-gold/20 px-2 py-1 text-brand-gold/75">
                        {isEnglish ? "Prophet page" : "صفحة النبي"}
                      </span>

                      {prophet.storySections > 0 && (
                        <span>
                          {prophet.storyChars.toLocaleString(isEnglish ? "en-US" : "ar-EG")} {isEnglish ? "characters" : "حرفًا"}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-1 text-xs text-brand-gold/60 transition-colors group-hover:text-brand-gold/90">
                      <span>{isEnglish ? "Read content" : "اقرأ المحتوى"}</span>
                      <span aria-hidden="true">←</span>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}

        <section className="mt-8 space-y-4 rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-8 text-center">
          {isEnglish ? (
            <p className="text-sm leading-7 text-brand-cream/65">
              Quran quotations are shown in their original Arabic in Arabic mode.
            </p>
          ) : (
            <>
              <p className="font-arabic text-2xl leading-loose text-brand-cream" dir="rtl">
                ﴿ تِلْكَ الرُّسُلُ فَضَّلْنَا بَعْضَهُمْ عَلَىٰ بَعْضٍ مِّنْهُم مَّن كَلَّمَ اللَّهُ وَرَفَعَ بَعْضَهُمْ دَرَجَاتٍ ﴾
              </p>
              <p className="text-sm text-brand-gold/60">سورة البقرة — الآية 253</p>
            </>
          )}
        </section>
      </Container>
    </main>
  );
}
