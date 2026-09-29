// @ts-nocheck - Game implementation with Phaser physics engine
"use client";

import { useEffect, useState } from "react";
import { ToneFeedback } from "@/lib/games/tone-feedback";

export type QuizHud = {
  score: number;
  collectibles: number;
  answered: number;
};

export type QuizCallbacks = {
  onReady: () => void;
  onHud: (hud: QuizHud) => void;
  onGameOver: (hud: QuizHud) => void;
};

type Question = {
  id: number;
  questionAr: string;
  questionEn: string;
  options: string[];
  correctIndex: number;
  answered: boolean;
  correct: boolean;
};

const QUESTIONS: Question[] = [
  {
    id: 1,
    questionAr: "كم عدد أركان الإسلام الخمسة؟",
    questionEn: "How many pillars of Islam are there?",
    options: ["3", "4", "5", "6"],
    correctIndex: 2,
    answered: false,
    correct: false,
  },
  {
    id: 2,
    questionAr: "ما أول ركن من أركان الإسلام؟",
    questionEn: "What is the first pillar of Islam?",
    options: ["الصيام", "الشهادة", "الصلاة", "الحج"],
    correctIndex: 1,
    answered: false,
    correct: false,
  },
  {
    id: 3,
    questionAr: "كم عدد آيات القرآن الكريم تقريباً؟",
    questionEn: "How many verses are in the Quran approximately?",
    options: ["5,000", "6,236", "7,500", "8,000"],
    correctIndex: 1,
    answered: false,
    correct: false,
  },
  {
    id: 4,
    questionAr: "ما أول سورة في القرآن الكريم؟",
    questionEn: "What is the first chapter of the Quran?",
    options: ["البقرة", "الفاتحة", "يس", "الإخلاص"],
    correctIndex: 1,
    answered: false,
    correct: false,
  },
  {
    id: 5,
    questionAr: "كم عدد أشهر الحج الحرام؟",
    questionEn: "How many sacred months are there in the Islamic calendar?",
    options: ["2", "3", "4", "5"],
    correctIndex: 2,
    answered: false,
    correct: false,
  },
];

export default function ZikrQuizGame({ callbacks }: { callbacks: QuizCallbacks }) {
  const [questions, setQuestions] = useState<Question[]>(QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [collectibles, setCollectibles] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const tone = new ToneFeedback("learning");

  useEffect(() => {
    callbacks.onReady();
  }, [callbacks]);

  const handleAnswer = (optionIndex: number) => {
    const question = questions[currentIndex];
    if (question.answered) return;

    const isCorrect = optionIndex === question.correctIndex;

    setSelectedAnswer(optionIndex);
    setShowFeedback(true);

    const newScore = score + (isCorrect ? 200 : 0);
    const newCollectibles = collectibles + (isCorrect ? 20 : 5);
    const newAnswered = answered + 1;

    setScore(newScore);
    setCollectibles(newCollectibles);
    setAnswered(newAnswered);

    if (isCorrect) {
      tone.play("victory");
    } else {
      tone.play("error");
    }

    // Update question
    const updatedQuestions = [...questions];
    updatedQuestions[currentIndex].answered = true;
    updatedQuestions[currentIndex].correct = isCorrect;
    setQuestions(updatedQuestions);

    callbacks.onHud({
      score: newScore,
      collectibles: newCollectibles,
      answered: newAnswered,
    });

    setTimeout(() => {
      if (newAnswered < QUESTIONS.length) {
        setCurrentIndex(currentIndex + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        callbacks.onGameOver({
          score: newScore,
          collectibles: newCollectibles,
          answered: newAnswered,
        });
      }
    }, 1500);
  };

  const question = questions[currentIndex];

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6" dir="rtl">
      <h2 className="text-2xl font-bold text-center text-amber-400">اختبار ذِكر</h2>

      <div className="space-y-4">
        <div className="flex justify-between text-sm text-cream/70">
          <span>السؤال {currentIndex + 1} من {QUESTIONS.length}</span>
          <span>النقاط: {score}</span>
        </div>

        <div className="w-full bg-slate-800 rounded-full h-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition"
            style={{ width: `${((currentIndex + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-slate-800/50 p-6 rounded-lg space-y-4">
        <h3 className="text-lg font-bold text-cream">{question.questionAr}</h3>
        <p className="text-sm text-cream/70">{question.questionEn}</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(index)}
            disabled={showFeedback}
            className={`p-4 rounded-lg border-2 text-right font-bold transition ${
              selectedAnswer === index
                ? index === question.correctIndex
                  ? "bg-emerald-900/30 border-emerald-500 text-emerald-400"
                  : "bg-rose-900/30 border-rose-500 text-rose-400"
                : "bg-slate-800/50 border-amber-400/30 text-cream hover:border-amber-400"
            } ${showFeedback ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {option}
          </button>
        ))}
      </div>

      {showFeedback && (
        <div
          className={`p-4 rounded-lg font-bold text-center ${
            selectedAnswer === question.correctIndex
              ? "bg-emerald-900/30 text-emerald-400 border border-emerald-500"
              : "bg-rose-900/30 text-rose-400 border border-rose-500"
          }`}
        >
          {selectedAnswer === question.correctIndex ? "✅ صحيح!" : "❌ خطأ"}
        </div>
      )}

      <div className="text-center text-sm text-cream/70">
        <div>الإجابات: {answered}/{QUESTIONS.length}</div>
        <div>المجموع: {collectibles}</div>
      </div>
    </div>
  );
}
