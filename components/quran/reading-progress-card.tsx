'use client';

import { useQuranWird } from '@/hooks/use-quran-wird';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function ReadingProgressCard() {
  const { state, percent, resumePosition, loaded } = useQuranWird();

  if (!loaded || state.position === 0) return null;

  return (
    <Card className="p-6 border-brand-gold/20 bg-brand-gold/5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-gold/10 text-brand-gold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-brand-gold">تابع القراءة</h3>
            <p className="text-xs text-brand-cream/50">آخر ما قرأت: سورة {resumePosition.surah}، آية {resumePosition.ayah}</p>
          </div>
        </div>
        <Button href={`/quran/${resumePosition.surah}`} size="sm" className="gap-2">
          استكمال
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-brand-cream/60">تقدمك في الختمة</span>
          <span className="text-brand-gold font-bold">{percent}%</span>
        </div>
        <Progress value={percent} className="h-2 bg-black/40" />
      </div>
    </Card>
  );
}
