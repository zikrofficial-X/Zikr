"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { getGameDefinition } from "@/lib/games/registry";

type Progress = {
  xp: number;
  level: number;
  total_games: number;
  total_score: number;
  total_collectibles: number;
};
type GameProgress = { gameId: string; bestScore: number; playCount: number };
type Achievement = {
  id: string;
  titleAr: string;
  descriptionAr: string;
  icon: string;
  unlockedAt: string | null;
};

export default function KidsProgressDashboard() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [games, setGames] = useState<GameProgress[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loggedIn, setLoggedIn] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/kids/games/progress", { credentials: "include" }),
      fetch("/api/kids/games/achievements", { credentials: "include" }),
    ])
      .then(async ([progressResponse, achievementResponse]) => {
        if (!active) return;
        if (
          progressResponse.status === 401 ||
          achievementResponse.status === 401
        ) {
          setLoggedIn(false);
          return;
        }
        if (progressResponse.ok) {
          const data = (await progressResponse.json()) as {
            player: Progress;
            games: GameProgress[];
          };
          setProgress(data.player);
          setGames(data.games);
        }
        if (achievementResponse.ok) {
          const data = (await achievementResponse.json()) as {
            achievements: Achievement[];
          };
          setAchievements(data.achievements);
        }
      })
      .catch(() => setLoggedIn(false))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const xp = progress?.xp ?? 0;
  const level = progress?.level ?? 1;
  const xpIntoLevel = xp % 100;

  return (
    <Container className="space-y-8 py-10" dir="rtl">
      <section className="space-y-3 text-center">
        <div
          className="mx-auto grid h-20 w-20 place-items-center rounded-full border-4 border-brand-gold/50 bg-brand-emerald/20 text-3xl font-bold text-brand-gold"
          aria-label="الصورة الافتراضية للملف الشخصي"
        >
          ذ
        </div>
        <span className="inline-flex rounded-full border border-brand-gold/30 bg-brand-gold/10 px-4 py-2 text-sm text-brand-gold">
          عالم ذِكر للأطفال
        </span>
        <h1 className="text-4xl font-bold text-brand-gold">تقدمي وشاراتي</h1>
        <p className="mx-auto max-w-2xl text-brand-cream/70">
          تقدم خاص بك، بلا ترتيب عام ولا مقارنة مع الأطفال الآخرين.
        </p>
        <nav className="flex flex-wrap justify-center gap-3 text-sm">
          <Link
            href="/kids/games"
            className="text-brand-gold underline underline-offset-4"
          >
            الألعاب
          </Link>
          <Link
            href="/kids/progress"
            className="text-brand-gold underline underline-offset-4"
          >
            التقدم
          </Link>
          <Link
            href="/kids/achievements"
            className="text-brand-gold underline underline-offset-4"
          >
            الإنجازات
          </Link>
          <Link
            href="/kids/parent-dashboard"
            className="text-brand-emerald underline underline-offset-4"
          >
            لوحة ولي الأمر
          </Link>
        </nav>
      </section>
      {!loggedIn && (
        <Card className="border-brand-emerald/30 bg-brand-emerald/10 p-5 text-center text-brand-cream/75">
          سجّل الدخول لحفظ تقدمك عبر أجهزتك. اللعب الأساسي متاح محليًا دون حساب.
        </Card>
      )}
      {loading ? (
        <Card className="p-8 text-center text-brand-cream/70" role="status">
          جاري تحميل التقدم...
        </Card>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-4">
            <Stat label="المستوى" value={level} />
            <Stat label="XP" value={xp} />
            <Stat label="الجولات" value={progress?.total_games ?? 0} />
            <Stat label="النجوم" value={progress?.total_collectibles ?? 0} />
          </section>
          <Card className="space-y-3 border-brand-gold/25 bg-brand-gold/5 p-5">
            <div className="flex items-center justify-between text-sm text-brand-cream/70">
              <span>التقدم إلى المستوى التالي</span>
              <span>{xpIntoLevel}/100 XP</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-black/30">
              <div
                className="h-full rounded-full bg-brand-gold"
                style={{ width: `${xpIntoLevel}%` }}
              />
            </div>
          </Card>
          <section className="grid gap-6 lg:grid-cols-2">
            <Card className="space-y-4 p-5">
              <h2 className="text-2xl font-bold text-brand-gold">
                أفضل النتائج
              </h2>
              {games.length === 0 ? (
                <p className="text-sm text-brand-cream/60">
                  ابدأ لعبة لتظهر نتيجتك هنا.
                </p>
              ) : (
                games.map(game => (
                  <div
                    key={game.gameId}
                    className="flex items-center justify-between rounded-lg border border-brand-cream/10 p-3"
                  >
                    <span className="text-brand-cream">
                      {getGameDefinition(game.gameId)?.titleAr ?? game.gameId}
                    </span>
                    <span className="text-brand-gold">
                      {game.bestScore.toLocaleString("ar-SA")}
                    </span>
                  </div>
                ))
              )}
            </Card>
            <Card className="space-y-4 p-5">
              <h2 className="text-2xl font-bold text-brand-gold">الشارات</h2>
              {achievements.length === 0 ? (
                <p className="text-sm text-brand-cream/60">
                  ستظهر الشارات بعد تطبيق إعدادات عالم الألعاب.
                </p>
              ) : (
                achievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 ${achievement.unlockedAt ? "border-brand-gold/40 bg-brand-gold/10" : "border-brand-cream/10 opacity-60"}`}
                  >
                    <span
                      className="text-2xl text-brand-gold"
                      aria-hidden="true"
                    >
                      {achievement.unlockedAt ? achievement.icon : "◇"}
                    </span>
                    <div>
                      <p className="font-bold text-brand-cream">
                        {achievement.titleAr}
                      </p>
                      <p className="text-xs text-brand-cream/60">
                        {achievement.descriptionAr}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </Card>
          </section>
        </>
      )}
    </Container>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="space-y-1 p-4 text-center">
      <p className="text-sm text-brand-cream/60">{label}</p>
      <p className="text-3xl font-bold text-brand-gold">
        {value.toLocaleString("ar-SA")}
      </p>
    </Card>
  );
}
