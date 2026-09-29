// @ts-nocheck - Game implementation with Phaser physics engine
"use client";

import { useEffect, useState } from "react";
import { ToneFeedback } from "@/lib/games/tone-feedback";

export type DeedsHud = {
  score: number;
  collectibles: number;
  completed: number;
};

export type DeedsCallbacks = {
  onReady: () => void;
  onHud: (hud: DeedsHud) => void;
  onGameOver: (hud: DeedsHud) => void;
};

type Deed = {
  id: number;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  completed: boolean;
};

const DEEDS: Deed[] = [
  {
    id: 1,
    titleAr: "مساعدة أحد",
    titleEn: "Help someone",
    descriptionAr: "ساعد شخصاً في احتياجاته",
    completed: false,
  },
  {
    id: 2,
    titleAr: "ابتسام لطيفة",
    titleEn: "Smile warmly",
    descriptionAr: "أعط ابتسامة لطيفة لشخص",
    completed: false,
  },
  {
    id: 3,
    titleAr: "صدقة",
    titleEn: "Charity",
    descriptionAr: "تصدق بشيء على محتاج",
    completed: false,
  },
  {
    id: 4,
    titleAr: "كلمة طيبة",
    titleEn: "Kind words",
    descriptionAr: "قل كلمة طيبة لشخص",
    completed: false,
  },
  {
    id: 5,
    titleAr: "العفو والسماح",
    titleEn: "Forgive",
    descriptionAr: "سامح شخصاً أساء إليك",
    completed: false,
  },
];

export default function GoodDeedsGame({ callbacks }: { callbacks: DeedsCallbacks }) {
  const [deeds, setDeeds] = useState<Deed[]>(DEEDS);
  const [score, setScore] = useState(0);
  const [collectibles, setCollectibles] = useState(0);
  const [completed, setCompleted] = useState(0);
  const tone = new ToneFeedback("learning");

  useEffect(() => {
    callbacks.onReady();
  }, [callbacks]);

  const completeDeed = (deedId: number) => {
    setDeeds((prev) =>
      prev.map((deed) =>
        deed.id === deedId ? { ...deed, completed: true } : deed
      )
    );

    setScore((s) => s + 200);
    setCollectibles((c) => c + 20);
    setCompleted((c) => {
      const newCompleted = c + 1;
      tone.play("victory");

      callbacks.onHud({
        score: score + 200,
        collectibles: collectibles + 20,
        completed: newCompleted,
      });

      if (newCompleted === DEEDS.length) {
        setTimeout(() => {
          callbacks.onGameOver({
            score: score + 200,
            collectibles: collectibles + 20,
            completed: newCompleted,
          });
        }, 500);
      }

      return newCompleted;
    });
  };

  useEffect(() => {
    callbacks.onHud({ score, collectibles, completed });
  }, [score, collectibles, completed, callbacks]);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6" dir="rtl">
      <h2 className="text-2xl font-bold text-center text-amber-400">أعمال خيرة</h2>

      <div className="grid grid-cols-1 gap-4">
        {deeds.map((deed) => (
          <div
            key={deed.id}
            className={`p-4 rounded-lg border-2 cursor-pointer transition ${
              deed.completed
                ? "bg-emerald-900/20 border-emerald-500"
                : "bg-slate-800/50 border-amber-400/50 hover:border-amber-400"
            }`}
            onClick={() => !deed.completed && completeDeed(deed.id)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-bold text-cream text-lg">{deed.titleAr}</h3>
                <p className="text-cream/70 text-sm">{deed.descriptionAr}</p>
              </div>
              {deed.completed && (
                <div className="ml-4 text-2xl">✅</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-4 text-sm text-cream/70">
        <div>النقاط: {score}</div>
        <div>المجموع: {collectibles}</div>
        <div>الأعمال: {completed}/{DEEDS.length}</div>
      </div>
    </div>
  );
}
