"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GameDifficulty } from "@/lib/games/registry";
import { getVersePuzzleRules } from "@/lib/games/verse-puzzle";
import {
  isVerseOrderComplete,
  shuffleVerseTokens,
  type IndexedVerseToken,
} from "@/lib/games/gameplay-helpers";
import type { GameSoundEvent } from "@/lib/games/tone-feedback";
import type { WorldHud } from "@/features/kids/components/games/world-game-stage";

type Props = {
  difficulty: GameDifficulty;
  restartToken: number;
  paused: boolean;
  onHud: (hud: WorldHud) => void;
  onResult: (result: WorldHud) => void;
  onSound: (event: GameSoundEvent) => void;
};

type VersePayload = {
  difficulty: GameDifficulty;
  surah: number;
  ayah: number;
  sourceText: string;
  words: string[];
};

export function VersePuzzleGame({
  difficulty,
  restartToken,
  paused,
  onHud,
  onResult,
  onSound,
}: Props) {
  const rules = getVersePuzzleRules(difficulty);
  const [tokens, setTokens] = useState<IndexedVerseToken[]>([]);
  const [source, setSource] = useState<Pick<VersePayload, "surah" | "ayah"> | null>(null);
  const [answer, setAnswer] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const completionReported = useRef(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setAvailable(true);
    setTokens([]);
    setSource(null);
    setAnswer([]);
    setMistakes(0);
    setFeedback("");
    setShowHint(false);
    completionReported.current = false;

    fetch(`/api/kids/games/verse?difficulty=${difficulty}`, {
      credentials: "include",
    })
      .then(response => {
        if (!response.ok) throw new Error("unavailable");
        return response.json() as Promise<Partial<VersePayload>>;
      })
      .then(data => {
        if (!active) return;
        const words = Array.isArray(data.words)
          ? data.words.filter(word => typeof word === "string" && word.trim().length > 0)
          : [];
        const sourceText =
          typeof data.sourceText === "string" ? data.sourceText.trim() : "";
        const surah = typeof data.surah === "number" ? data.surah : 1;
        const ayah = typeof data.ayah === "number" ? data.ayah : 1;
        setAvailable(words.length > 0 && sourceText.length > 0);
        if (words.length === 0 || !sourceText) return;
        setSource({ surah, ayah });
        setTokens(shuffleVerseTokens(words, `${difficulty}:${restartToken}`));
      })
      .catch(() => {
        if (active) setAvailable(false);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [difficulty, restartToken]);

  const completed =
    tokens.length > 0 && isVerseOrderComplete(answer, tokens.length);

  const nextIndex = answer.length;
  const choose = (tokenIndex: number) => {
    if (paused || completed || answer.includes(tokenIndex)) return;

    if (tokenIndex !== nextIndex) {
      onSound("miss");
      setMistakes(value => value + 1);

      if (rules.resetOnMistake) {
        setAnswer([]);
        setFeedback("المحاولة أُعيدت من البداية. ركّز على الكلمة التالية.");
      } else if (rules.tolerateMistakes) {
        setFeedback("اختيار غير صحيح. أكمل بهدوء من الكلمة التالية.");
      } else {
        setFeedback("جرّب اختيار الكلمة التي تأتي بعد السابقة.");
      }
      return;
    }

    onSound("collect");
    setAnswer(value => [...value, tokenIndex]);
    setFeedback(
      answer.length + 1 === tokens.length
        ? "أحسنت! اكتملت الآية."
        : `اختيار صحيح: ${answer.length + 1} من ${tokens.length}`,
    );
  };

  const undo = () => {
    if (paused || answer.length === 0 || completed) return;
    onSound("move");
    setAnswer(value => value.slice(0, -1));
    setFeedback("تم التراجع عن آخر كلمة.");
  };

  const hud = useMemo<WorldHud>(() => {
    const correct = answer.length;
    const completionBonus = completed ? 500 : 0;
    const mistakePenalty = mistakes * rules.mistakePenalty;
    return {
      score: Math.max(0, correct * 220 + completionBonus - mistakePenalty),
      collectibles: correct,
      distance: 0,
      combo: Math.max(0, correct - mistakes),
      level: rules.level,
      completed,
    };
  }, [answer.length, completed, mistakes, rules.level, rules.mistakePenalty]);

  useEffect(() => {
    onHud(hud);
    if (!completed || completionReported.current) return;
    completionReported.current = true;
    onSound("success");
    onResult(hud);
  }, [completed, hud, onHud, onResult, onSound]);

  if (loading) {
    return (
      <div
        className="grid min-h-[320px] place-items-center rounded-3xl border border-brand-gold/25 bg-[#071b24] p-6 text-center text-brand-cream/70"
        role="status"
      >
        جاري تجهيز نص قرآني موثق...
      </div>
    );
  }

  if (!available || !source || tokens.length === 0) {
    return (
      <div
        className="grid min-h-[320px] place-items-center rounded-3xl border border-brand-gold/25 bg-[#071b24] p-6 text-center text-brand-cream/70"
        role="status"
      >
        لا يتوفر نص قرآني موثق للعبة حاليًا.
      </div>
    );
  }

  const progress = Math.round((answer.length / tokens.length) * 100);

  return (
    <div className="overflow-hidden rounded-3xl border border-brand-gold/25 bg-[radial-gradient(circle_at_top,#8b5cf616,transparent_42%),linear-gradient(145deg,#071b24,#10132c)] p-4 shadow-2xl shadow-black/20 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-violet-300/80">
            لغز الآية
          </p>
          <h3 className="mt-1 text-2xl font-black text-brand-cream">
            رتّب كلمات الآية بهدوء
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-brand-cream/65">
            النص القرآني يُعرض كما هو من المصدر الموثق، وكل كلمة تحتفظ بموضعها الأصلي حتى عند تكرار الكلمات.
          </p>
        </div>
        <div className="min-w-44 rounded-2xl border border-brand-cream/10 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3 text-xs text-brand-cream/55">
            <span>التقدم</span>
            <strong className="text-brand-gold">{answer.length}/{tokens.length}</strong>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-violet-300 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <span className="block text-xs text-brand-cream/50">النقاط</span>
          <strong className="mt-1 block text-lg text-brand-gold">{hud.score}</strong>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <span className="block text-xs text-brand-cream/50">الكلمات</span>
          <strong className="mt-1 block text-lg text-violet-300">{answer.length}/{tokens.length}</strong>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <span className="block text-xs text-brand-cream/50">الأخطاء</span>
          <strong className="mt-1 block text-lg text-brand-cream">{mistakes}</strong>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <span className="block text-xs text-brand-cream/50">المستوى</span>
          <strong className="mt-1 block text-lg text-brand-emerald">{rules.level}</strong>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-violet-300/15 bg-violet-300/[0.05] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-violet-200">
              الآية: {source.surah}:{source.ayah}
            </p>
            <p className="mt-1 text-xs text-brand-cream/45">
              الكلمة التالية: {completed ? "اكتملت" : nextIndex + 1}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {rules.allowHint && (
              <button
                type="button"
                onClick={() => setShowHint(value => !value)}
                disabled={paused || completed}
                className="rounded-lg border border-brand-cream/15 px-3 py-2 text-xs text-brand-cream/70 hover:border-brand-gold hover:text-brand-gold disabled:opacity-50"
                aria-pressed={showHint}
              >
                {showHint ? "إخفاء التلميح" : "تلميح"}
              </button>
            )}
            <button
              type="button"
              onClick={undo}
              disabled={paused || completed || answer.length === 0}
              className="rounded-lg border border-brand-cream/15 px-3 py-2 text-xs text-brand-cream/70 hover:border-violet-300/60 hover:text-violet-200 disabled:opacity-50"
            >
              تراجع
            </button>
          </div>
        </div>

        <div
          className="min-h-24 rounded-2xl border border-brand-emerald/20 bg-black/20 p-4 text-center text-xl leading-[2.3] text-brand-gold"
          dir="rtl"
          aria-live="polite"
        >
          {answer.length > 0 ? (
            answer.map(index => tokens.find(token => token.index === index)?.text ?? "").join(" ")
          ) : (
            <span className="text-sm text-brand-cream/30">ابدأ باختيار أول كلمة</span>
          )}
        </div>
      </div>

      {!completed && (
        <div className="grid gap-3 sm:grid-cols-2">
          {tokens.map(token => {
            const selected = answer.includes(token.index);
            const hinted = showHint && token.index === nextIndex && !selected;
            return (
              <button
                key={token.id}
                type="button"
                onClick={() => choose(token.index)}
                disabled={paused || selected}
                className={[
                  "min-h-16 rounded-2xl border p-4 text-right text-base font-semibold leading-8 transition duration-200",
                  selected
                    ? "border-brand-emerald/30 bg-brand-emerald/10 text-brand-cream/35"
                    : hinted
                      ? "border-violet-300/70 bg-violet-300/10 text-violet-100 shadow-lg shadow-violet-900/20"
                      : "border-brand-cream/10 bg-white/[0.03] text-brand-cream hover:-translate-y-0.5 hover:border-violet-300/50 hover:bg-violet-300/[0.05]",
                  paused ? "cursor-not-allowed" : "",
                ].join(" ")}
              >
                {token.text}
              </button>
            );
          })}
        </div>
      )}

      <div
        className="mt-5 min-h-12 rounded-2xl border border-brand-emerald/20 bg-brand-emerald/[0.06] px-4 py-3 text-sm leading-7 text-brand-cream/75"
        role="status"
        aria-live="polite"
      >
        {feedback ||
          (rules.resetOnMistake
            ? "في هذا المستوى، الاختيار الخاطئ يعيد ترتيب الجولة من البداية."
            : rules.tolerateMistakes
              ? "يمكنك المحاولة مع احتساب الأخطاء."
              : "اختر الكلمات بالترتيب الصحيح.")}
      </div>

      {completed && (
        <div className="mt-5 rounded-2xl border border-brand-gold/25 bg-brand-gold/[0.06] p-5">
          <p className="text-xs font-semibold tracking-[0.16em] text-brand-gold/75">
            اكتملت الجولة
          </p>
          <p className="mt-2 text-lg font-semibold leading-9 text-brand-cream">
            أحسنت. ظهرت الآية بترتيبها الصحيح دون تعديل النص.
          </p>
        </div>
      )}

    </div>
  );
}
