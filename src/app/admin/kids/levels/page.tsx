import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { supabaseServerAdminCount, supabaseServerAdminRequest } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type LevelRow = {
  id: string;
  game_id: string;
  level_no: number;
  title_ar: string;
  title_en: string;
  mechanic: string;
  difficulty: string;
  reward_xp: number;
  published: boolean;
  updated_at: string;
};
type GameRow = { id: string; slug: string; title_ar: string };

const displayNumber = (value: number | null) =>
  value === null ? "غير متاح" : value.toLocaleString("ar-EG-u-nu-latn");

export default async function KidsLevelsPage() {
  await requireAdminPermission("kids.manage");

  const [levelsCountResult, questionsCountResult, levelsResult, gamesResult] = await Promise.allSettled([
    supabaseServerAdminCount("kids_game_levels"),
    supabaseServerAdminCount("kids_game_questions"),
    supabaseServerAdminRequest<LevelRow[]>(
      "/rest/v1/kids_game_levels?select=id,game_id,level_no,title_ar,title_en,mechanic,difficulty,reward_xp,published,updated_at&order=updated_at.desc&limit=100",
      { method: "GET" },
    ),
    supabaseServerAdminRequest<GameRow[]>(
      "/rest/v1/kids_games?select=id,slug,title_ar&limit=100",
      { method: "GET" },
    ),
  ]);

  const levelsCount = levelsCountResult.status === "fulfilled" ? levelsCountResult.value : null;
  const questionsCount = questionsCountResult.status === "fulfilled" ? questionsCountResult.value : null;
  const levels = levelsResult.status === "fulfilled" ? levelsResult.value : [];
  const games = gamesResult.status === "fulfilled" ? gamesResult.value : [];
  const gameNames = new Map(games.map((game) => [game.id, game.title_ar]));
  const publishedSample = levels.filter((level) => level.published).length;
  const quizSample = levels.filter((level) => level.mechanic === "quiz").length;

  return (
    <Container className="space-y-8 py-10 text-right" dir="rtl">
      <header className="space-y-2">
        <Link href="/admin/kids/games" className="text-xs text-brand-gold/60 hover:text-brand-gold">← سجل الألعاب</Link>
        <p className="mt-4 text-xs tracking-[0.2em] text-brand-cream/30">KIDS / LEVEL GOVERNANCE</p>
        <h1 className="text-3xl font-bold text-brand-gold">مراقبة المستويات والمحتوى</h1>
        <p className="max-w-4xl text-sm leading-7 text-brand-cream/55">جرد مستويات الألعاب ومراجعة التغطية التعليمية. تعرض القائمة آخر 100 مستوى، بينما أعداد السجلات الإجمالية تُقرأ بصورة منفصلة من قاعدة البيانات.</p>
      </header>

      {(levelsResult.status === "rejected" || gamesResult.status === "rejected") && (
        <div role="alert" className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100">تعذر تحميل تفاصيل المستويات أو الألعاب. لن يتم عرض فشل القراءة كقائمة فارغة سليمة.</div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-xs text-brand-cream/40">إجمالي المستويات</p><p className="mt-2 text-3xl font-bold text-brand-gold">{displayNumber(levelsCount)}</p></Card>
        <Card><p className="text-xs text-brand-cream/40">أسئلة مرتبطة بالمستويات</p><p className="mt-2 text-3xl font-bold text-sky-200">{displayNumber(questionsCount)}</p></Card>
        <Card><p className="text-xs text-brand-cream/40">منشور في آخر 100 مستوى</p><p className="mt-2 text-3xl font-bold text-emerald-300">{levelsResult.status === "fulfilled" ? displayNumber(publishedSample) : "غير متاح"}</p></Card>
        <Card><p className="text-xs text-brand-cream/40">مستويات Mechanic=Quiz في العينة</p><p className="mt-2 text-3xl font-bold text-amber-200">{levelsResult.status === "fulfilled" ? displayNumber(quizSample) : "غير متاح"}</p></Card>
      </section>

      {questionsCount === 0 && (
        <div role="alert" className="rounded-2xl border border-amber-400/25 bg-amber-400/5 p-4 text-sm leading-7 text-amber-100">
          جدول kids_game_questions فارغ حاليًا. يجب التأكد من أن ألعاب الاختبارات تقرأ محتواها من مصدر موثق آخر، أو ربط أسئلة المستويات بهذا الجدول قبل الاعتماد على هذه الطبقة.
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-brand-gold/10 bg-black/15">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-gold/10 p-4">
          <h2 className="font-semibold text-brand-gold">آخر 100 مستوى</h2>
          <span className="text-xs text-brand-cream/35">العرض الأحدث حسب updated_at</span>
        </div>
        {levelsResult.status === "fulfilled" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-black/20 text-brand-gold/75"><tr>{["اللعبة", "المستوى", "العنوان", "Mechanic", "الصعوبة", "XP", "الحالة"].map((title) => <th key={title} className="px-4 py-3 text-right">{title}</th>)}</tr></thead>
              <tbody>
                {levels.map((level) => (
                  <tr key={level.id} className="border-t border-brand-gold/8">
                    <td className="px-4 py-3 text-brand-cream/70">{gameNames.get(level.game_id) ?? "لعبة غير معروفة"}</td>
                    <td className="px-4 py-3 text-brand-cream/70">{displayNumber(level.level_no)}</td>
                    <td className="px-4 py-3"><p className="text-brand-cream/85">{level.title_ar}</p><p className="text-[11px] text-brand-cream/35">{level.title_en}</p></td>
                    <td className="px-4 py-3 text-brand-cream/60" dir="ltr">{level.mechanic}</td>
                    <td className="px-4 py-3 text-brand-cream/60">{level.difficulty}</td>
                    <td className="px-4 py-3 text-brand-cream/60">{displayNumber(level.reward_xp)}</td>
                    <td className="px-4 py-3">{level.published ? <span className="text-emerald-300">منشور</span> : <span className="text-amber-300">مسودة</span>}</td>
                  </tr>
                ))}
                {levels.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-brand-cream/45">لا توجد مستويات في العينة.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Container>
  );
}
