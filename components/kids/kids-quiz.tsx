'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QuizQuestion {
  text: string;
  options: string[];
  correctAnswer: number;
}

interface KidsQuizProps {
  content: any;
}

export default function KidsQuiz({ content }: KidsQuizProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  // Extract quiz data safely
  const quizData = content.quiz_data || (content as any).quizData;
  const questions: QuizQuestion[] = quizData?.questions || [];

  if (questions.length === 0) return null;

  const handleAnswer = (qIdx: number, oIdx: number) => {
    if (!submitted) {
      setAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
    }
  };

  const calculateScore = () => {
    const correct = questions.filter((q, i) => answers[i] === q.correctAnswer).length;
    return Math.round((correct / questions.length) * 100);
  };

  return (
    <Card className="p-8 md:p-12 bg-black/30 border-brand-gold/20 shadow-2xl space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-brand-gold">اختبر معلوماتك يا بطل! 🧠</h2>
        <p className="text-brand-cream/60">أجب على الأسئلة التالية لنرى مدى تركيزك</p>
      </div>

      <div className="space-y-10">
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="space-y-4">
            <h3 className="text-2xl font-bold text-brand-gold text-right" dir="rtl">
              {qIdx + 1}. {q.text}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {q.options.map((opt, oIdx) => {
                const isSelected = answers[qIdx] === oIdx;
                const isCorrect = q.correctAnswer === oIdx;
                
                let buttonClass = "p-4 text-right rounded-2xl transition-all border-2 text-lg ";
                if (!submitted) {
                  buttonClass += isSelected 
                    ? "bg-brand-gold/20 border-brand-gold text-brand-gold" 
                    : "bg-black/40 border-brand-gold/10 hover:border-brand-gold/30 text-brand-cream";
                } else {
                  if (isCorrect) buttonClass += "bg-green-500/20 border-green-500 text-green-400";
                  else if (isSelected) buttonClass += "bg-red-500/20 border-red-500 text-red-400";
                  else buttonClass += "bg-black/40 border-brand-gold/5 text-brand-cream/40";
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleAnswer(qIdx, oIdx)}
                    disabled={submitted}
                    className={buttonClass}
                    dir="rtl"
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!submitted ? (
        <Button
          onClick={() => setSubmitted(true)}
          disabled={Object.keys(answers).length < questions.length}
          className="w-full py-6 text-xl bg-brand-gold text-black hover:bg-brand-goldSoft disabled:opacity-50"
        >
          تحقق من الإجابات ✨
        </Button>
      ) : (
        <div className="text-center space-y-6 p-8 bg-brand-gold/10 rounded-3xl border border-brand-gold/20">
          <div className="text-5xl">
            {calculateScore() >= 80 ? '🏆' : calculateScore() >= 50 ? '👏' : '📚'}
          </div>
          <h3 className="text-3xl font-bold text-brand-gold">
            نتيجتك هي: {calculateScore()}%
          </h3>
          <p className="text-brand-cream/80 text-lg">
            {calculateScore() >= 80 ? 'رائع جداً! أنت متميز بحق' : 
             calculateScore() >= 50 ? 'أحسنت، إجابات جيدة جداً' : 
             'حاول مرة أخرى لتتعلم أكثر'}
          </p>
          <Button
            onClick={() => {
              setAnswers({});
              setSubmitted(false);
            }}
            variant="outline"
            className="border-brand-gold/30 text-brand-gold"
          >
            إعادة الاختبار 🔄
          </Button>
        </div>
      )}
    </Card>
  );
}
