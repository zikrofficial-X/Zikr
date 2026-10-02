"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GameDifficulty } from "@/lib/games/registry";
import { getVerifiedMemoryPairs, type VerifiedMemoryPair } from "@/lib/games/verified-content";
import type { GameSoundEvent } from "@/lib/games/tone-feedback";
import type { WorldHud } from "@/features/kids/components/games/world-game-stage";

type MemoryCard = VerifiedMemoryPair & {
  id: string;
  side: "situation" | "dhikr";
};

type Props = {
  difficulty: GameDifficulty;
  restartToken: number;
  paused: boolean;
  onHud: (hud: WorldHud) => void;
  onResult: (result: WorldHud) => void;
  onSound: (event: GameSoundEvent) => void;
};

const PAIRS_BY_DIFFICULTY: Record<GameDifficulty, number> = {
  easy: 3,
  normal: 4,
  hard: 5,
};

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function buildCards(pairCount: number): MemoryCard[] {
  const pairs = getVerifiedMemoryPairs().slice(0, pairCount);
  return shuffle(
    pairs.flatMap(pair => [
      { ...pair, id: `${pair.id}:s`, side: "situation" as const },
      { ...pair, id: `${pair.id}:d`, side: "dhikr" as const },
    ])
  );
}

export function ZikrMemoryGame({
  difficulty,
  restartToken,
  paused,
  onHud,
  onResult,
  onSound,
}: Props) {
  const pairCount = PAIRS_BY_DIFFICULTY[difficulty];
  const [cards, setCards] = useState<MemoryCard[]>(() => buildCards(pairCount));
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [combo, setCombo] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [feedback, setFeedback] = useState("");
  const completionReported = useRef(false);

  const matchedPairCount = matched.length / 2;
  const completed = cards.length > 0 && matchedPairCount === pairCount;

  useEffect(() => {
    setCards(buildCards(pairCount));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setCombo(0);
    setStartedAt(Date.now());
    setFeedback("");
    completionReported.current = false;
  }, [pairCount, restartToken]);

  useEffect(() => {
    if (paused || flipped.length !== 2) return;

    const [firstId, secondId] = flipped;
    const first = cards.find(card => card.id === firstId);
    const second = cards.find(card => card.id === secondId);
    if (!first || !second) return;

    const isMatch = first.pairId === second.pairId && first.side !== second.side;

    const timer = window.setTimeout(() => {
      setMoves(value => value + 1);

      if (isMatch) {
        setMatched(value => [...value, firstId, secondId]);
        setCombo(value => value + 1);
        setFeedback(`أحسنت! ${first.dhikr}`);
        onSound("collect");
      } else {
        setCombo(0);
        setFeedback("ليست مطابقة بعد. تذكّر الموقف والذكر المناسب.");
        onSound("miss");
      }

      setFlipped([]);
    }, isMatch ? 260 : 850);

    return () => window.clearTimeout(timer);
  }, [cards, flipped, onSound, paused]);

  const hud = useMemo<WorldHud>(() => {
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    const baseScore = matchedPairCount * 180;
    const comboBonus = combo * 35;
    const movePenalty = moves * 10;
    const timeBonus = completed ? Math.max(0, 420 - elapsedSeconds * 6) : 0;

    return {
      score: Math.max(0, baseScore + comboBonus - movePenalty + timeBonus),
      collectibles: matchedPairCount,
      distance: 0,
      combo,
      level: difficulty === "hard" ? 3 : difficulty === "normal" ? 2 : 1,
      completed,
    };
  }, [combo, completed, difficulty, matchedPairCount, moves, startedAt]);

  useEffect(() => {
    onHud(hud);
    if (!completed || completionReported.current) return;
    completionReported.current = true;
    onSound("success");
    onResult(hud);
  }, [completed, hud, onHud, onResult, onSound]);

  const chooseCard = (id: string) => {
    if (paused || flipped.length >= 2 || flipped.includes(id) || matched.includes(id)) return;
    setFeedback("");
    setFlipped(value => [...value, id]);
    onSound("move");
  };

  const progressLabel = `تمت مطابقة ${matchedPairCount} من ${pairCount} أزواج`;

  return (
    <div className="overflow-hidden rounded-3xl border border-brand-gold/25 bg-[radial-gradient(circle_at_top,#d7b56d18,transparent_45%),linear-gradient(145deg,#071b24,#0b2832)] p-4 shadow-2xl shadow-black/20 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-brand-emerald/90">ذاكرة الأذكار اليومية</p>
          <h3 className="mt-1 text-2xl font-black text-brand-cream">طابق الموقف مع الذكر المناسب</h3>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-brand-cream/65">
            اقلب بطاقة موقف وبطاقة ذكر. لا تبحث عن السرعة؛ الهدف أن تتذكر الربط بين الموقف والذكر.
          </p>
        </div>
        <div className="rounded-2xl border border-brand-gold/20 bg-black/20 px-4 py-3 text-right">
          <span className="block text-xs text-brand-cream/50">التقدم</span>
          <strong className="text-brand-gold">{progressLabel}</strong>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <span className="block text-xs text-brand-cream/50">النقاط</span>
          <strong className="mt-1 block text-lg text-brand-gold">{hud.score}</strong>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <span className="block text-xs text-brand-cream/50">الأزواج</span>
          <strong className="mt-1 block text-lg text-brand-gold">{matchedPairCount}/{pairCount}</strong>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <span className="block text-xs text-brand-cream/50">المحاولات</span>
          <strong className="mt-1 block text-lg text-brand-cream">{moves}</strong>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <span className="block text-xs text-brand-cream/50">السلسلة</span>
          <strong className="mt-1 block text-lg text-brand-emerald">{combo}</strong>
        </div>
      </div>

      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5"
        aria-label="بطاقات ذاكرة الأذكار اليومية"
      >
        {cards.map(card => {
          const visible = flipped.includes(card.id) || matched.includes(card.id);
          const locked = matched.includes(card.id);

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => chooseCard(card.id)}
              disabled={paused || locked}
              aria-label={
                visible
                  ? `${card.side === "situation" ? "موقف" : "ذكر"}: ${card.side === "situation" ? card.situation : card.dhikr}`
                  : "بطاقة مخفية"
              }
              className={[
                "group relative min-h-36 overflow-hidden rounded-2xl border p-4 text-right transition duration-200",
                visible
                  ? "border-brand-gold/45 bg-brand-gold/10 shadow-[0_12px_35px_rgba(199,168,107,0.10)]"
                  : "border-brand-cream/10 bg-white/[0.04] hover:-translate-y-1 hover:border-brand-gold/40 hover:bg-brand-gold/[0.06]",
                locked ? "ring-1 ring-brand-emerald/40" : "",
                paused ? "cursor-not-allowed opacity-70" : "",
              ].join(" ")}
            >
              <span className="absolute -left-8 -top-8 h-20 w-20 rounded-full bg-brand-gold/10 blur-2xl" aria-hidden="true" />
              <span className="relative block text-[11px] font-bold uppercase tracking-[0.16em] text-brand-emerald/80">
                {visible ? (card.side === "situation" ? "موقف" : "ذكر") : "ذاكرة"}
              </span>

              {visible ? (
                <span className="relative mt-3 block">
                  <strong className="block text-lg leading-8 text-brand-cream">{card.side === "situation" ? card.situation : card.dhikr}</strong>
                  {card.side === "situation" && (
                    <span className="mt-3 block text-xs leading-6 text-brand-gold/85">
                      ابحث عن الذكر المناسب
                    </span>
                  )}
                  {locked && (
                    <span className="mt-3 inline-flex rounded-full border border-brand-emerald/30 bg-brand-emerald/10 px-2.5 py-1 text-[11px] font-semibold text-brand-emerald">
                      تم التعلّم ✓
                    </span>
                  )}
                </span>
              ) : (
                <span className="relative mt-8 block text-center text-4xl font-black text-brand-gold/80 transition group-hover:scale-110">?</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5 min-h-12 rounded-2xl border border-brand-emerald/20 bg-brand-emerald/[0.06] px-4 py-3 text-sm text-brand-cream/75" role="status" aria-live="polite">
        {feedback || "اختر بطاقتين لتبدأ المطابقة."}
      </div>
    </div>
  );
}
