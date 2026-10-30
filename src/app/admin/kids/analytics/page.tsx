import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { supabaseServerAdminCount, supabaseServerAdminRequest } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ResultRow = {
  game_id: string;
  score: number;
  duration_seconds: number | null;
  completed: boolean | null;
  xp_awarded: number;
  played_at: string;
};

const number = (value: number | null) =>
  value === null ? "غير متاح" : value.toLocaleString("ar-EG-u-nu-latn");

export default async function KidsAnalyticsPage() {
  await requireAdminPermission("kids.manage");

  const [resultsCountResult, playersCountResult, unlockedCountResult, recentResult] = await Promise.allSettled([
    supabaseServerAdminCount("kids_game_results"),
    supabaseServerAdminCount("kids_player_progress"),
    supabaseServerAdminCount("kids_user_achievements"),
    supabaseServerAdminRequest<ResultRow[]>(
      "/rest/v1/kids_game_results?select=game_id,score,duration_seconds,completed,xp_awarded,played_at&order=played_at.desc&limit=300",
      { method: "GET" },
    ),
  ]);

  const resultsCount = resultsCountResult.status === "fulfilled" ? resultsCountResult.value : null;
  const playersCount = playersCountResult.status === "fulfilled" ? playersCountResult.value : null;
  const unlockedCount = unlockedCountResult.status === "fulfilled" ? unlockedCountResult.value : null;
  const recent = recentResult.status === "fulfilled" ? recentResult.value : [];
  const sampleScore = recent.length ? Math.round(recent.reduce((sum, row) => sum + row.score, 0) / recent.length) : null;
  const sampleXp = recent.reduce((sum, row) => sum + row.xp_awarded, 0);
  const completed = recent.filter((row) => row.completed).length;
  const durations = recent.flatMap((row) => row.duration_seconds === null ? [] : [row.duration_seconds]);
  const averageDuration = durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : null;
  const perGame = new Map<string, number>();
  for (const row of recent) perGame.set(row.game_id, (perGame.get(row.game_id) ?? 0) + 1);
  const games = [...perGame.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <Container className="space-y-8 py-10 text-right" dir="rtl">
      <header className="space-y-2">
        <Link href="/admin/kids/games" className="text-xs text-brand-gold/60 hover:text-brand-gold">← سجل الألعاب</Link>
        <p className="mt-4 text-xs tracking-[0.2em] text-brand-cream/30">KIDS / PRODUCT ANALYTICS</p>
        <h1 className="text-3xl font-bold text-brand-gold">تحليلات ألعاب الأطفال</h1>
        <p className="max-w-4xl text-sm leading-7 text-brand-cream/55">إحصاءات مجمعة فقط دون عرض أسماء الأطفال أو معرّفات حساباتهم. متوسطات الأداء محسوبة على آخر 300 نتيجة كحد أقصى.</p>
      </header>

      {recentResult.status === "rejected" && (
        <div role="alert" className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100">تعذر قراءة نتائج الألعاب. بيانات الأداء غير متاحة حاليًا.</div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-xs text-brand-cream/40">نتائج اللعب المسجلة</p><p className="mt-2 text-3xl font-bold text-brand-gold">{number(resultsCount)}</p></Card>
        <Card><p className="text-xs text-brand-cream/40">سجلات تقدم اللاعبين</p><p className="mt-2 text-3xl font-bold text-sky-200">{number(playersCount)}</p></Card>
        <Card><p className="text-xs text-brand-cream/40">إنجازات مفتوحة</p><p className="mt-2 text-3xl font-bold text-emerald-300">{number(unlockedCount)}</p></Card>
        <Card><p className="text-xs text-brand-cream/40">متوسط مدة الجولة بالعينة</p><p className="mt-2 text-3xl font-bold text-brand-cream">{averageDuration === null ? "غير متاح" : `${number(averageDuration)} ثانية`}</p></Card>
      </section>

      {resultsCount !== null && resultsCount < 30 && (
        <div role="status" className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm leading-7 text-amber-100">
          حجم بيانات اللعب الحالي صغير ({number(resultsCount)} نتيجة). استخدم هذه الشاشة لمراقبة وصول البيانات وسلامة التسجيل، وليس لاستخلاص اتجاهات أو مقارنة أداء الألعاب إحصائيًا حتى تتجمع عينة أكبر.
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <Card><p className="text-xs text-brand-cream/40">متوسط النقاط في العينة</p><p className="mt-2 text-2xl font-bold text-brand-gold">{recentResult.status === "fulfilled" ? number(sampleScore) : "غير متاح"}</p><p className="mt-1 text-xs text-brand-cream/35">آخر {number(recent.length)} نتيجة</p></Card>
        <Card><p className="text-xs text-brand-cream/40">جولات مكتملة في العينة</p><p className="mt-2 text-2xl font-bold text-emerald-300">{recentResult.status === "fulfilled" ? number(completed) : "غير متاح"}</p></Card>
        <Card><p className="text-xs text-brand-cream/40">XP مسجل في العينة</p><p className="mt-2 text-2xl font-bold text-sky-200">{recentResult.status === "fulfilled" ? number(sampleXp) : "غير متاح"}</p></Card>
      </section>

      <section className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
        <h2 className="font-semibold text-brand-gold">توزيع آخر النتائج حسب اللعبة</h2>
        {recentResult.status === "fulfilled" && games.length > 0 ? (
          <div className="mt-4 space-y-3">
            {games.map(([game, count]) => (
              <div key={game} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                <p className="truncate text-sm text-brand-cream/70" dir="ltr">{game}</p>
                <p className="text-sm font-semibold text-brand-gold">{number(count)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-brand-cream/40">{recentResult.status === "fulfilled" ? "لا توجد نتائج مسجلة بعد." : "التوزيع غير متاح بسبب فشل القراءة."}</p>
        )}
      </section>
    </Container>
  );
}
