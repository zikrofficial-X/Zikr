'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { LockKeyhole, ShieldCheck, Star, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import {
  EMPTY_KIDS_PROGRESS,
  getEarnedKidsAchievements,
  KIDS_ACHIEVEMENTS,
  type KidsProgress,
} from '@/lib/data/kids-audio';
import { readKidsProgress } from '@/lib/data/kids-audio-client';

type HonorLevel = {
  title: string;
  minimumStars: number;
  description: string;
};

const HONOR_LEVELS: HonorLevel[] = [
  { title: 'بذرة الخير', minimumStars: 0, description: 'ابدأ بخطوة صغيرة كل يوم.' },
  { title: 'صديق الذكر', minimumStars: 5, description: 'تجمع النجوم بالاستماع والعمل الطيب.' },
  { title: 'قائد التعلم', minimumStars: 10, description: 'تجرب أكثر من مسار وتشارك أسرتك ما تعلمت.' },
  { title: 'بطل المغامرة', minimumStars: 20, description: 'تثبت أن المثابرة أجمل من السرعة.' },
  { title: 'نجم ذِكر', minimumStars: 30, description: 'قدوة في التعلم الهادئ والخلق الجميل.' },
];

function getCurrentHonorLevel(stars: number) {
  return HONOR_LEVELS.reduce((current, level) => stars >= level.minimumStars ? level : current, HONOR_LEVELS[0]);
}

function getNextHonorLevel(stars: number) {
  return HONOR_LEVELS.find(level => level.minimumStars > stars);
}

export default function KidsAchievementsBoard() {
  const [progress, setProgress] = useState<KidsProgress>(EMPTY_KIDS_PROGRESS);

  useEffect(() => {
    setProgress(readKidsProgress());
    const refresh = () => setProgress(readKidsProgress());
    window.addEventListener('zikr-kids-progress', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('zikr-kids-progress', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const earned = useMemo(() => new Set(getEarnedKidsAchievements(progress).map(item => item.id)), [progress]);
  const currentLevel = getCurrentHonorLevel(progress.stars);
  const nextLevel = getNextHonorLevel(progress.stars);
  const levelProgress = nextLevel
    ? Math.min(100, Math.round(((progress.stars - currentLevel.minimumStars) / (nextLevel.minimumStars - currentLevel.minimumStars)) * 100))
    : 100;

  return (
    <Container className="space-y-10 py-10" dir="rtl">
      <section className="space-y-5 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-4 py-2 text-sm text-brand-gold"><Trophy className="h-4 w-4" aria-hidden="true" /> لوحة شرف ذِكر</span>
        <h1 className="text-4xl font-bold text-brand-gold md:text-5xl">كل خطوة طيبة تستحق نجمة</h1>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-brand-cream/70">اجمع النجوم من الاستماع والقراءة والألعاب والمهام. لا توجد مقارنة بين الأطفال؛ لوحة الشرف هنا تقيس تقدم هذا الجهاز فقط.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="ملخص التقدم">
        <Card className="space-y-2 border-brand-gold/30 bg-brand-gold/10 p-5 text-center"><Star className="mx-auto h-7 w-7 text-brand-gold" fill="currentColor" aria-hidden="true" /><p className="text-3xl font-bold text-brand-gold">{progress.stars}</p><p className="text-sm text-brand-cream/60">نجمة</p></Card>
        <Card className="space-y-2 border-brand-emerald/30 bg-brand-emerald/10 p-5 text-center"><p className="text-3xl font-bold text-brand-emerald">{earned.size}</p><p className="text-sm text-brand-cream/60">شارة مكتسبة</p></Card>
        <Card className="space-y-2 border-brand-gold/20 bg-black/15 p-5 text-center"><p className="text-3xl font-bold text-brand-gold">{progress.listenedTrackIds.length}</p><p className="text-sm text-brand-cream/60">صوتية مسموعة</p></Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="space-y-5 border-brand-gold/30 bg-gradient-to-br from-brand-gold/15 to-transparent p-6">
          <div className="flex items-center justify-between gap-3"><div><p className="text-sm text-brand-gold/70">مستواك الحالي</p><h2 className="mt-1 text-2xl font-bold text-brand-gold">{currentLevel.title}</h2></div><Trophy className="h-9 w-9 text-brand-gold" aria-hidden="true" /></div>
          <p className="leading-relaxed text-brand-cream/75">{currentLevel.description}</p>
          <div className="h-3 overflow-hidden rounded-full bg-black/30" aria-label={`${levelProgress}% نحو المستوى التالي`}><div className="h-full rounded-full bg-brand-gold transition-all" style={{ width: `${levelProgress}%` }} /></div>
          <p className="text-sm text-brand-cream/55">{nextLevel ? `تبقى ${Math.max(0, nextLevel.minimumStars - progress.stars)} نجوم للوصول إلى ${nextLevel.title}.` : 'وصلت إلى أعلى مستوى حاليًا؛ واصل التعلم بهدوء.'}</p>
        </Card>
        <Card className="space-y-4 border-brand-emerald/25 bg-brand-emerald/10 p-6">
          <div className="flex items-center gap-3"><Trophy className="h-6 w-6 text-brand-emerald" aria-hidden="true" /><h2 className="text-2xl font-bold text-brand-emerald">لوحة الشرف المحلية</h2></div>
          <p className="text-sm leading-relaxed text-brand-cream/70">مراكز رمزية مبنية على عدد النجوم في هذا الجهاز، وليست ترتيبًا عامًا ولا تجمع بيانات الأطفال.</p>
          <div className="space-y-2">
            {[...HONOR_LEVELS].reverse().map((level, index) => {
              const active = currentLevel.title === level.title;
              return <div key={level.title} className={`flex items-center justify-between rounded-xl border p-3 ${active ? 'border-brand-gold/50 bg-brand-gold/10' : 'border-brand-cream/10 bg-black/15'}`}><span className="flex items-center gap-3"><span className="text-brand-gold">{index + 1}</span><span className="font-bold text-brand-cream">{level.title}</span></span><span className="text-sm text-brand-cream/55">{level.minimumStars}+ نجمة</span></div>;
            })}
          </div>
        </Card>
      </section>

      <section className="space-y-5">
        <div><p className="text-sm text-brand-emerald/80">شاراتك التعليمية</p><h2 className="mt-1 text-2xl font-bold text-brand-gold">افتح شارة جديدة بالتدرج</h2></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {KIDS_ACHIEVEMENTS.map(achievement => {
            const unlocked = earned.has(achievement.id);
            return <Card key={achievement.id} className={`space-y-3 p-5 ${unlocked ? 'border-brand-gold/40 bg-brand-gold/10' : 'border-brand-cream/10 bg-black/15 opacity-75'}`}><div className="flex items-center justify-between"><span className={`text-4xl ${unlocked ? 'text-brand-gold' : 'text-brand-cream/25'}`} aria-hidden="true">{unlocked ? achievement.icon : '◇'}</span>{unlocked ? <Star className="h-5 w-5 text-brand-gold" fill="currentColor" aria-label="شارة مكتسبة" /> : <LockKeyhole className="h-5 w-5 text-brand-cream/40" aria-label="شارة مقفلة" />}</div><h3 className="text-xl font-bold text-brand-gold">{achievement.title}</h3><p className="text-sm leading-relaxed text-brand-cream/65">{achievement.description}</p><p className="text-xs text-brand-cream/45">الهدف: {achievement.threshold} {achievement.kind === 'stars' ? 'نجمة' : achievement.kind === 'audio' ? 'صوتيات' : achievement.kind === 'recording' ? 'تسجيل' : 'مهام'}</p></Card>;
          })}
        </div>
      </section>

      <Card className="space-y-4 border-brand-cream/10 bg-black/15 p-5 text-center"><div className="flex items-center justify-center gap-2 text-brand-emerald"><ShieldCheck className="h-5 w-5" aria-hidden="true" /><strong>تقدم خاص وآمن</strong></div><p className="text-sm leading-relaxed text-brand-cream/60">التقدم والنجوم والشارات تُحفظ محليًا في المتصفح. لا نعرض أسماء الأطفال ولا أصواتهم ولا نرسل تسجيلاتهم تلقائيًا.</p><div className="flex flex-wrap justify-center gap-3"><Link href="/kids/audio" className="rounded-lg bg-brand-gold px-4 py-2 text-sm font-bold text-black hover:bg-brand-gold/90">اذهب إلى الصوتيات</Link><Link href="/kids/adventures" className="rounded-lg border border-brand-gold/30 px-4 py-2 text-sm font-bold text-brand-gold hover:bg-brand-gold/10">اذهب إلى المغامرات</Link></div></Card>
    </Container>
  );
}
