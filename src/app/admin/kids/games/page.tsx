import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { GAME_REGISTRY } from "@/lib/games/registry";
import { supabaseServerAdminCount, supabaseServerAdminRequest } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type GameRow = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string | null;
  genre: string;
  age_min: number;
  age_max: number;
  difficulty: string;
  engine: string;
  published: boolean;
  featured: boolean;
  order_index: number;
  reward_xp: number;
};

const number = (value: number | null) =>
  value === null ? "غير متاح" : value.toLocaleString("ar-EG-u-nu-latn");

export default async function KidsGamesPage() {
  await requireAdminPermission("kids.manage");

  const [gamesResult, levelsResult] = await Promise.allSettled([
    supabaseServerAdminRequest<GameRow[]>(
      "/rest/v1/kids_games?select=id,slug,title_ar,title_en,genre,age_min,age_max,difficulty,engine,published,featured,order_index,reward_xp&order=order_index.asc&limit=100",
      { method: "GET" },
    ),
    supabaseServerAdminCount("kids_game_levels"),
  ]);

  const games = gamesResult.status === "fulfilled" ? gamesResult.value : [];
  const levelsCount = levelsResult.status === "fulfilled" ? levelsResult.value : null;
  const runtimeIds = new Set(Object.keys(GAME_REGISTRY));
  const databaseIds = new Set(games.map((game) => game.slug));
  const missingRuntime = games.filter((game) => !runtimeIds.has(game.slug));
  const missingDatabase = [...runtimeIds].filter((id) => !databaseIds.has(id));
  const publishedCount = games.filter((game) => game.published).length;
  const featuredCount = games.filter((game) => game.featured).length;

  return (
    <Container className="space-y-8 py-10 text-right" dir="rtl">
      <header className="space-y-2">
        <Link href="/admin/kids" className="text-xs text-brand-gold/60 hover:text-brand-gold">← مركز الأطفال</Link>
        <p className="mt-4 text-xs tracking-[0.2em] text-brand-cream/30">KIDS / GAME CATALOGUE</p>
        <h1 className="text-3xl font-bold text-brand-gold">سجل الألعاب وربط التشغيل</h1>
        <p className="max-w-4xl text-sm leading-7 text-brand-cream/55">
          مقارنة سجل الألعاب في قاعدة البيانات بسجل التشغيل الفعلي في التطبيق. هذه الصفحة للرقابة على الاتساق ولا تغيّر الألعاب أو تنشرها.
        </p>
      </header>

      {gamesResult.status === "rejected" && (
        <div role="alert" className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100">
          تعذر قراءة سجل الألعاب من Supabase. الأرقام التالية غير متاحة وليست أصفارًا.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-xs text-brand-cream/40">ألعاب قاعدة البيانات</p><p className="mt-2 text-3xl font-bold text-brand-gold">{gamesResult.status === "fulfilled" ? number(games.length) : "غير متاح"}</p></Card>
        <Card><p className="text-xs text-brand-cream/40">مسارات التشغيل في الكود</p><p className="mt-2 text-3xl font-bold text-sky-200">{number(runtimeIds.size)}</p></Card>
        <Card><p className="text-xs text-brand-cream/40">المستويات المسجلة</p><p className="mt-2 text-3xl font-bold text-emerald-300">{number(levelsCount)}</p></Card>
        <Card><p className="text-xs text-brand-cream/40">ألعاب منشورة / مميزة</p><p className="mt-2 text-3xl font-bold text-brand-cream">{gamesResult.status === "fulfilled" ? `${number(publishedCount)} / ${number(featuredCount)}` : "غير متاح"}</p></Card>
      </section>

      {missingRuntime.length > 0 && (
        <div role="alert" className="rounded-2xl border border-amber-400/25 bg-amber-400/5 p-4 text-sm leading-7 text-amber-100">
          <strong>تعارض يحتاج قرارًا:</strong> توجد ألعاب منشورة في قاعدة البيانات بلا Runtime مطابق في GAME_REGISTRY:
          {" "}{missingRuntime.map((game) => `${game.title_ar} (${game.slug})`).join("، ")}.
          لم يتم حذفها أو إخفاؤها.
        </div>
      )}
      {missingDatabase.length > 0 && (
        <div role="alert" className="rounded-2xl border border-amber-400/25 bg-amber-400/5 p-4 text-sm leading-7 text-amber-100">
          توجد مسارات تشغيل في الكود بلا سجل مقابل في kids_games: {missingDatabase.join("، ")}.
        </div>
      )}

      <section className="flex flex-wrap gap-3">
        <Link href="/admin/kids/levels" className="rounded-xl border border-brand-gold/25 bg-brand-gold/10 px-4 py-2 text-sm font-semibold text-brand-gold">مراجعة المستويات</Link>
        <Link href="/admin/kids/analytics" className="rounded-xl border border-brand-gold/15 px-4 py-2 text-sm text-brand-cream/70">تحليلات الألعاب</Link>
        <Link href="/admin/kids/assets" className="rounded-xl border border-brand-gold/15 px-4 py-2 text-sm text-brand-cream/70">أصول الألعاب</Link>
      </section>

      {gamesResult.status === "fulfilled" && (
        <section className="overflow-hidden rounded-2xl border border-brand-gold/10 bg-black/15">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-sm">
              <thead className="bg-black/20 text-brand-gold/75">
                <tr>
                  {["اللعبة", "Runtime", "المحرك", "الفئة العمرية", "الصعوبة", "النشر", "التمييز"].map((title) => <th key={title} className="px-4 py-3 text-right">{title}</th>)}
                </tr>
              </thead>
              <tbody>
                {games.map((game) => {
                  const runtime = GAME_REGISTRY[game.slug as keyof typeof GAME_REGISTRY];
                  return (
                    <tr key={game.id} className="border-t border-brand-gold/8">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-brand-cream/90">{game.title_ar}</p>
                        <p className="mt-1 text-[11px] text-brand-cream/35" dir="ltr">{game.slug}</p>
                      </td>
                      <td className="px-4 py-3">{runtime ? <span className="text-emerald-300">{runtime.runtimeKind} · v{runtime.version}</span> : <span className="text-amber-300">غير مربوط</span>}</td>
                      <td className="px-4 py-3 text-brand-cream/65" dir="ltr">{game.engine}</td>
                      <td className="px-4 py-3 text-brand-cream/65" dir="ltr">{game.age_min}–{game.age_max}</td>
                      <td className="px-4 py-3 text-brand-cream/65">{game.difficulty}</td>
                      <td className="px-4 py-3">{game.published ? <span className="text-emerald-300">منشورة</span> : <span className="text-amber-300">مسودة</span>}</td>
                      <td className="px-4 py-3">{game.featured ? "مميزة" : "عادية"}</td>
                    </tr>
                  );
                })}
                {games.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-brand-cream/45">لا توجد سجلات ألعاب.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="border-t border-brand-gold/8 px-4 py-3 text-xs text-brand-cream/35">سجل قاعدة البيانات مرتب حسب order_index. لا يتم تغيير ترتيب المستخدم أو حالة النشر من هذه الشاشة.</p>
        </section>
      )}
    </Container>
  );
}
