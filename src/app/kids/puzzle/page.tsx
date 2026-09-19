'use client';

import { useState, useCallback } from 'react';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type Puzzle = {
  id: string;
  title: string;
  question: string;
  pieces: string[];
  answer: string[];
  hint: string;
};

const PUZZLES: Puzzle[] = [
  {
    id: 'p1',
    title: 'رتّب أركان الإسلام',
    question: 'رتّب أركان الإسلام الخمسة بالترتيب الصحيح',
    pieces: ['الصوم', 'الشهادتان', 'الحج', 'الصلاة', 'الزكاة'],
    answer: ['الشهادتان', 'الصلاة', 'الزكاة', 'الصوم', 'الحج'],
    hint: 'يبدأ بـ "أشهد أن لا إله إلا الله"',
  },
  {
    id: 'p2',
    title: 'رتّب خطوات الوضوء',
    question: 'رتّب خطوات الوضوء بالترتيب الصحيح',
    pieces: ['غسل القدمين', 'غسل اليدين', 'مسح الرأس', 'النية', 'غسل الوجه'],
    answer: ['النية', 'غسل اليدين', 'غسل الوجه', 'مسح الرأس', 'غسل القدمين'],
    hint: 'يبدأ بالنية في القلب',
  },
  {
    id: 'p3',
    title: 'رتّب الخلفاء الراشدين',
    question: 'رتّب الخلفاء الراشدين بالترتيب الزمني الصحيح',
    pieces: ['عثمان بن عفان', 'علي بن أبي طالب', 'أبو بكر الصديق', 'عمر بن الخطاب'],
    answer: ['أبو بكر الصديق', 'عمر بن الخطاب', 'عثمان بن عفان', 'علي بن أبي طالب'],
    hint: 'أول خليفة بعد النبي ﷺ هو الصديق',
  },
  {
    id: 'p4',
    title: 'رتّب الصلوات',
    question: 'رتّب الصلوات الخمس من الفجر إلى العشاء',
    pieces: ['المغرب', 'الفجر', 'العشاء', 'العصر', 'الظهر'],
    answer: ['الفجر', 'الظهر', 'العصر', 'المغرب', 'العشاء'],
    hint: 'أول صلاة عند طلوع الفجر',
  },
  {
    id: 'p5',
    title: 'رتّب أنبياء الله',
    question: 'رتّب هؤلاء الأنبياء بالترتيب الزمني الصحيح',
    pieces: ['موسى عليه السلام', 'آدم عليه السلام', 'محمد ﷺ', 'إبراهيم عليه السلام', 'نوح عليه السلام'],
    answer: ['آدم عليه السلام', 'نوح عليه السلام', 'إبراهيم عليه السلام', 'موسى عليه السلام', 'محمد ﷺ'],
    hint: 'أول الأنبياء هو أبو البشر',
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function PuzzlePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pieces, setPieces] = useState<string[]>(() => shuffle(PUZZLES[0].pieces));
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const puzzle = PUZZLES[currentIndex];

  const loadPuzzle = useCallback((index: number) => {
    setCurrentIndex(index);
    setPieces(shuffle(PUZZLES[index].pieces));
    setSelected([]);
    setResult('idle');
    setShowHint(false);
    setDragOver(null);
  }, []);

  function pickPiece(piece: string) {
    if (selected.includes(piece) || result !== 'idle') return;
    const next = [...selected, piece];
    setSelected(next);

    if (next.length === puzzle.answer.length) {
      const correct = puzzle.answer.every((a, i) => a === next[i]);
      setResult(correct ? 'correct' : 'wrong');
      if (correct) setScore((s) => s + 1);
    }
  }

  function removePiece(index: number) {
    if (result !== 'idle') return;
    setSelected((prev) => prev.filter((_, i) => i !== index));
  }

  function retry() {
    setPieces(shuffle(puzzle.pieces));
    setSelected([]);
    setResult('idle');
    setShowHint(false);
  }

  const isCompleted = currentIndex === PUZZLES.length - 1 && result === 'correct';

  return (
    <Container className="py-12 space-y-8 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/kids" className="text-brand-gold/60 hover:text-brand-gold text-sm transition-colors">
          قسم الأطفال
        </Link>
        <span className="text-brand-gold/30">/</span>
        <span className="text-brand-cream/60 text-sm">لعبة الترتيب</span>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-brand-gold">لعبة الترتيب الإسلامية</h1>
        <p className="text-brand-cream/60">رتّب العناصر بالترتيب الصحيح</p>
        <div className="flex items-center justify-center gap-4">
          <span className="text-brand-gold font-bold text-lg">{score} / {PUZZLES.length}</span>
          <span className="text-brand-cream/40 text-sm">نقاط</span>
        </div>
      </div>

      {/* Puzzle selector */}
      <div className="flex gap-2 flex-wrap justify-center">
        {PUZZLES.map((p, i) => (
          <button
            key={p.id}
            onClick={() => loadPuzzle(i)}
            className={`w-9 h-9 rounded-full text-sm font-bold transition-all ${
              i === currentIndex
                ? 'bg-brand-gold text-black'
                : 'bg-black/20 text-brand-cream/60 hover:bg-brand-gold/20'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <Card className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-brand-gold">{puzzle.title}</h2>
          <p className="text-brand-cream/70 text-sm">{puzzle.question}</p>
        </div>

        {/* Answer slots */}
        <div className="space-y-2">
          <p className="text-xs text-brand-cream/40 uppercase tracking-wider">ترتيبك</p>
          <div className="space-y-2 min-h-[120px]">
            {puzzle.answer.map((_, slotIndex) => {
              const filled = selected[slotIndex];
              return (
                <div
                  key={slotIndex}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(slotIndex); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(null);
                    const piece = e.dataTransfer.getData('piece');
                    if (!filled && piece && !selected.includes(piece)) {
                      pickPiece(piece);
                    }
                  }}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-all ${
                    filled
                      ? result === 'correct'
                        ? 'border-emerald-500/50 bg-emerald-900/20'
                        : result === 'wrong'
                        ? 'border-red-500/50 bg-red-900/20'
                        : 'border-brand-gold/40 bg-brand-gold/5'
                      : dragOver === slotIndex
                      ? 'border-brand-gold/60 bg-brand-gold/10 scale-105'
                      : 'border-brand-gold/10 bg-black/10 border-dashed'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-brand-gold/20 text-brand-gold text-xs flex items-center justify-center shrink-0">
                    {slotIndex + 1}
                  </span>
                  {filled ? (
                    <span className="flex-1 text-brand-cream font-medium">{filled}</span>
                  ) : (
                    <span className="flex-1 text-brand-cream/20 text-sm">اضغط على قطعة أو اسحبها هنا</span>
                  )}
                  {filled && result === 'idle' && (
                    <button
                      onClick={() => removePiece(slotIndex)}
                      className="text-brand-cream/30 hover:text-brand-cream/60 text-xs transition-colors"
                      aria-label="إزالة"
                    >
                      x
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Available pieces */}
        <div className="space-y-2">
          <p className="text-xs text-brand-cream/40 uppercase tracking-wider">القطع المتاحة</p>
          <div className="flex flex-wrap gap-2">
            {pieces
              .filter((p) => !selected.includes(p))
              .map((piece) => (
                <button
                  key={piece}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('piece', piece)}
                  onClick={() => pickPiece(piece)}
                  disabled={result !== 'idle'}
                  className="px-4 py-2 rounded-full bg-brand-gold/10 border border-brand-gold/30 text-brand-cream text-sm hover:bg-brand-gold/20 hover:border-brand-gold/50 transition-all cursor-pointer active:scale-95 disabled:opacity-40"
                >
                  {piece}
                </button>
              ))}
          </div>
        </div>

        {/* Result */}
        {result !== 'idle' && (
          <div className={`rounded-xl p-4 text-center space-y-3 ${
            result === 'correct'
              ? 'bg-emerald-900/30 border border-emerald-500/40'
              : 'bg-red-900/20 border border-red-500/30'
          }`}>
            <p className={`text-xl font-bold ${result === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>
              {result === 'correct' ? 'ممتاز! أجبت بشكل صحيح' : 'حاول مرة أخرى'}
            </p>
            {result === 'wrong' && (
              <div className="text-sm text-brand-cream/60 space-y-1">
                <p>الترتيب الصحيح:</p>
                <p className="text-brand-cream">{puzzle.answer.join(' — ')}</p>
              </div>
            )}
          </div>
        )}

        {/* Hint */}
        {showHint && result === 'idle' && (
          <div className="rounded-xl bg-amber-900/20 border border-amber-500/30 px-4 py-3 text-sm text-amber-300">
            تلميح: {puzzle.hint}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2 flex-wrap">
          {result === 'idle' && (
            <Button variant="ghost" onClick={() => setShowHint((v) => !v)} className="text-sm">
              {showHint ? 'إخفاء التلميح' : 'تلميح'}
            </Button>
          )}
          {result !== 'idle' && (
            <Button variant="secondary" onClick={retry}>
              إعادة المحاولة
            </Button>
          )}
          {result === 'correct' && !isCompleted && (
            <Button onClick={() => loadPuzzle(currentIndex + 1)}>
              اللغز التالي
            </Button>
          )}
          {result !== 'idle' && <Button variant="ghost" onClick={retry}>ابدأ من جديد</Button>}
        </div>
      </Card>

      {isCompleted && (
        <Card className="text-center space-y-4 bg-brand-gold/10 border-brand-gold/40 p-8">
          <p className="text-4xl text-brand-gold font-bold">مبروك!</p>
          <p className="text-brand-cream/80">أكملت جميع الألغاز بنجاح!</p>
          <p className="text-2xl font-bold text-brand-gold">{score} / {PUZZLES.length} نقطة</p>
          <Button onClick={() => { setScore(0); loadPuzzle(0); }}>العب مرة أخرى</Button>
        </Card>
      )}

      <Card className="text-center space-y-2 bg-black/10">
        <p className="text-brand-cream/60 text-sm">تحسّن كل يوم بلعبة جديدة واختبار معلوماتك الإسلامية</p>
        <Link href="/kids" className="text-brand-gold/70 hover:text-brand-gold text-sm underline underline-offset-2 transition-colors">
          العودة لقسم الأطفال
        </Link>
      </Card>
    </Container>
  );
}
