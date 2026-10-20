"use client";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/layout/language-provider";
import type { GameDifficulty } from "@/lib/games/registry";
import type { GameSoundEvent } from "@/lib/games/tone-feedback";
import type { WorldHud } from "@/features/kids/components/games/world-game-stage";
import {
  GameToast,
  KidsGameHeader,
  KidsGameHud,
  KidsGameStage,
  KidsProgress,
} from "@/features/kids/components/games/kids-game-kit";
import { getKidsLevelMeta } from "@/lib/games/kids-level-system";

export type LetterLabProps = {
  difficulty: GameDifficulty;
  restartToken: number;
  paused: boolean;
  onHud: (hud: WorldHud) => void;
  onResult: (result: WorldHud) => void;
  onSound: (event: GameSoundEvent) => void;
};

const LETTERS = [
  "ا",
  "ب",
  "ت",
  "ث",
  "ج",
  "ح",
  "خ",
  "د",
  "ذ",
  "ر",
  "ز",
  "س",
  "ش",
  "ص",
  "ض",
  "ط",
  "ظ",
  "ع",
  "غ",
  "ف",
  "ق",
  "ك",
  "ل",
  "م",
  "ن",
  "ه",
  "و",
  "ي",
];
const ROUND_COUNT = 8;
const choiceCount: Record<GameDifficulty, number> = {
  easy: 3,
  normal: 4,
  hard: 5,
};

function seededIndex(seed: number, max: number, offset: number) {
  return Math.abs((seed + offset * 7919) % max);
}

export function KidsLetterLabGame({
  difficulty,
  restartToken,
  paused,
  onHud,
  onResult,
  onSound,
}: LetterLabProps) {
  const { isEnglish } = useLanguage();
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState(
    isEnglish
      ? "Choose the letter you hear and see."
      : "اختر الحرف الذي تراه وتسمعه."
  );
  const [locked, setLocked] = useState(false);
  const [completed, setCompleted] = useState(false);
  const meta = getKidsLevelMeta("letter-lab", difficulty, round);
  const target = LETTERS[seededIndex(meta.seed, LETTERS.length, 1)];
  const choices = useMemo(() => {
    const pool = new Set<string>([target]);
    for (let i = 0; pool.size < choiceCount[difficulty]; i += 1)
      pool.add(LETTERS[seededIndex(meta.seed, LETTERS.length, i + 3)]);
    return Array.from(pool).sort(
      (a, b) => LETTERS.indexOf(a) - LETTERS.indexOf(b)
    );
  }, [difficulty, meta.seed, target]);

  useEffect(() => {
    setRound(0);
    setScore(0);
    setMistakes(0);
    setCompleted(false);
    setLocked(false);
    setFeedback(
      isEnglish
        ? "Choose the letter you hear and see."
        : "اختر الحرف الذي تراه وتسمعه."
    );
  }, [difficulty, restartToken, isEnglish]);

  useEffect(() => {
    onHud({
      score,
      collectibles: round,
      distance: 0,
      combo: Math.max(0, round - mistakes),
      level: round + 1,
      completed,
      mistakes,
      accuracy: round ? Math.round(((round - mistakes) / round) * 100) : 100,
    });
  }, [completed, mistakes, onHud, round, score]);

  const choose = (letter: string) => {
    if (paused || locked || completed) return;
    if (letter !== target) {
      setMistakes(value => value + 1);
      onSound("miss");
      setFeedback(
        isEnglish
          ? "Almost! Listen and try again."
          : "قريبًا! استمع وحاول مرة أخرى."
      );
      return;
    }
    const nextRound = round + 1;
    const nextScore = score + Math.max(40, 120 - mistakes * 10);
    setLocked(true);
    setScore(nextScore);
    onSound("collect");
    if (nextRound >= ROUND_COUNT) {
      setCompleted(true);
      onSound("success");
      onHud({
        score: nextScore,
        collectibles: nextRound,
        distance: 0,
        combo: Math.max(0, nextRound - mistakes),
        level: nextRound,
        completed: true,
        mistakes,
        accuracy: Math.round(((nextRound - mistakes) / nextRound) * 100),
      });
      onResult({
        score: nextScore,
        collectibles: nextRound,
        distance: 0,
        combo: Math.max(0, nextRound - mistakes),
        level: nextRound,
        completed: true,
        mistakes,
        accuracy: Math.round(((nextRound - mistakes) / nextRound) * 100),
      });
      setFeedback(
        isEnglish ? "You completed the letter lab!" : "أكملت مختبر الحروف!"
      );
      return;
    }
    setFeedback(
      isEnglish
        ? "Great choice! Next letter is ready."
        : "اختيار رائع! الحرف التالي جاهز."
    );
    window.setTimeout(() => {
      setRound(nextRound);
      setLocked(false);
    }, 420);
  };

  return (
    <KidsGameStage
      theme="library"
      ariaLabel={isEnglish ? "Arabic letter lab" : "مختبر الحروف العربية"}
    >
      <KidsGameHeader
        eyebrow="LETTER LAB"
        title={isEnglish ? "Arabic Letter Lab" : "مختبر الحروف"}
        description={
          isEnglish
            ? "Recognize Arabic letters through a calm, replayable game."
            : "تعرّف على الحروف العربية من خلال لعبة هادئة قابلة لإعادة اللعب."
        }
        right={
          <div className="hidden w-52 sm:block">
            <KidsProgress
              value={(round / ROUND_COUNT) * 100}
              label={
                isEnglish
                  ? `Round ${round + 1}/${ROUND_COUNT}`
                  : `الجولة ${round + 1}/${ROUND_COUNT}`
              }
            />
          </div>
        }
      />
      <div className="px-4 sm:px-6">
        <KidsGameHud
          items={[
            {
              label: isEnglish ? "Score" : "النقاط",
              value: score,
              tone: "text-brand-gold",
            },
            {
              label: isEnglish ? "Round" : "الجولة",
              value: `${round}/${ROUND_COUNT}`,
              tone: "text-brand-emerald",
            },
            {
              label: isEnglish ? "Mistakes" : "الأخطاء",
              value: mistakes,
              tone: "text-rose-100",
            },
            {
              label: isEnglish ? "Accuracy" : "الدقة",
              value: `${round ? Math.round(((round - mistakes) / round) * 100) : 100}%`,
              tone: "text-sky-200",
            },
            {
              label: isEnglish ? "Level" : "المستوى",
              value: round + 1,
              tone: "text-violet-200",
            },
          ]}
        />
      </div>
      <div className="mx-4 mt-5 rounded-[2rem] border border-white/10 bg-black/20 p-5 text-center sm:mx-6 sm:p-8">
        <p className="text-sm font-bold text-brand-emerald">
          {isEnglish ? "Find this letter" : "اعثر على هذا الحرف"}
        </p>
        <div
          className="mx-auto mt-4 grid h-32 w-32 place-items-center rounded-[2rem] border-2 border-brand-gold/50 bg-brand-gold/10 text-7xl font-black text-brand-gold shadow-[0_0_45px_rgba(243,201,105,.15)]"
          aria-label={
            (isEnglish ? "Target letter " : "الحرف المطلوب ") + target
          }
        >
          {target}
        </div>
        <p className="mt-4 text-sm leading-7 text-brand-cream/65">
          {isEnglish
            ? "Say the letter aloud, then choose the matching card."
            : "انطق الحرف بصوتك، ثم اختر البطاقة المطابقة."}
        </p>
        <div className="mx-auto mt-6 grid max-w-xl gap-3 sm:grid-cols-5">
          {choices.map(letter => (
            <button
              key={letter}
              type="button"
              onClick={() => choose(letter)}
              disabled={paused || locked || completed}
              onKeyDown={event => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  choose(letter);
                }
              }}
              className={`grid min-h-20 place-items-center rounded-2xl border text-4xl font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-gold ${letter === target && locked ? "border-brand-emerald bg-brand-emerald/20 text-brand-emerald" : "border-white/10 bg-white/[.04] text-brand-cream hover:-translate-y-1 hover:border-brand-gold/50"}`}
              aria-label={
                (isEnglish ? "Choose letter " : "اختيار الحرف ") + letter
              }
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
      <GameToast tone={completed ? "emerald" : "gold"}>{feedback}</GameToast>
    </KidsGameStage>
  );
}
