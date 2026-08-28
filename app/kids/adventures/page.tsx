'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { readKidsProgress, updateKidsProgress } from '@/lib/data/kids-audio-client';

type AdventureMode = 'missions' | 'memory' | 'scenarios';

type Mission = {
  title: string;
  value: string;
  action: string;
  reflection: string;
};

type MemoryCard = {
  id: string;
  label: string;
  pair: string;
};

type Scenario = {
  question: string;
  options: string[];
  answer: number;
  lesson: string;
};

const MISSIONS: Mission[] = [
  { title: 'رسالة تقدير', value: 'الكلمة الطيبة', action: 'قل لشخص في أسرتك كلمة تقدير حقيقية.', reflection: 'كيف تغيّر وجهه أو شعوره؟' },
  { title: 'يد العون', value: 'التعاون', action: 'ساعد في مهمة منزلية صغيرة قبل أن يطلب منك أحد.', reflection: 'ما الشيء الذي أصبح أسهل بالمساعدة؟' },
  { title: 'حارس النعمة', value: 'الشكر', action: 'أطفئ ضوءًا أو أغلق صنبورًا لا تحتاجه، ثم قل الحمد لله.', reflection: 'ما نعمة استخدمتها اليوم؟' },
  { title: 'صديق جديد', value: 'الرحمة', action: 'ادعُ طفلًا هادئًا للعب أو تحدث معه بلطف.', reflection: 'كيف نجعل المكان أكثر ترحيبًا؟' },
  { title: 'دقيقة هدوء', value: 'ضبط الغضب', action: 'خذ ثلاث أنفاس بطيئة قبل أن ترد في موقف مزعج.', reflection: 'هل ساعدك التمهل في اختيار كلامك؟' },
  { title: 'خبر يحتاج تثبتًا', value: 'التثبت', action: 'إذا سمعت معلومة غريبة، لا تنشرها واسأل كبيرًا موثوقًا.', reflection: 'لماذا نحمي الناس من الكلام غير المؤكد؟' },
  { title: 'مشاركة آمنة', value: 'الكرم', action: 'شارك شيئًا مناسبًا بعد سؤال ولي الأمر عن السلامة.', reflection: 'كيف تصبح المشاركة أجمل عندما ننتبه للآخر؟' },
  { title: 'ترتيب المكان', value: 'الأمانة', action: 'اترك مكان لعبك أنظف وأفضل مما وجدته.', reflection: 'من يستفيد من ترتيبك؟' },
];

const MEMORY_PAIRS: MemoryCard[] = [
  { id: 'sleep-1', label: 'قبل النوم', pair: 'باسمك اللهم أموت وأحيا' },
  { id: 'sleep-2', label: 'باسمك اللهم أموت وأحيا', pair: 'قبل النوم' },
  { id: 'food-1', label: 'قبل الطعام', pair: 'بسم الله' },
  { id: 'food-2', label: 'بسم الله', pair: 'قبل الطعام' },
  { id: 'home-1', label: 'دخول البيت', pair: 'السلام على الأهل' },
  { id: 'home-2', label: 'السلام على الأهل', pair: 'دخول البيت' },
  { id: 'sneeze-1', label: 'بعد العطاس', pair: 'الحمد لله' },
  { id: 'sneeze-2', label: 'الحمد لله', pair: 'بعد العطاس' },
];

const SCENARIOS: Scenario[] = [
  {
    question: 'وصلتك رسالة من شخص مجهول يطلب صورتك ومكانك. ماذا تفعل؟',
    options: ['أرسلها فورًا', 'لا أرد وأخبر ولي الأمر', 'أرسلها إلى صديق آخر'],
    answer: 1,
    lesson: 'خصوصيتك مهمة. لا تشارك الصور أو المكان مع الغرباء، واطلب مساعدة شخص بالغ موثوق.',
  },
  {
    question: 'أخطأت في حق صديقك أمام الآخرين. ما الخطوة الشجاعة؟',
    options: ['أهرب من الموقف', 'أعتذر وأحاول إصلاح ما حدث', 'ألوم شخصًا آخر'],
    answer: 1,
    lesson: 'الاعتذار الصادق وإصلاح الخطأ علامة قوة وحسن خلق.',
  },
  {
    question: 'وجدت قلمًا جميلًا في الفصل ولا تعرف صاحبه. ماذا تفعل؟',
    options: ['أحتفظ به سرًا', 'أسأل عن صاحبه أو أسلمه للمعلم', 'أرميه بعيدًا'],
    answer: 1,
    lesson: 'الأمانة تعني حفظ حقوق الآخرين حتى عندما لا يراك أحد.',
  },
  {
    question: 'خسر فريقك في اللعبة وبدأت تشعر بالغضب. ماذا تختار؟',
    options: ['أكسر اللعبة', 'آخذ استراحة وأهنئ الفريق الآخر', 'أصرخ في زملائي'],
    answer: 1,
    lesson: 'الرياضة فرصة للتعلم والتعاون، وليست سببًا لإيذاء نفسك أو غيرك.',
  },
  {
    question: 'سمعت خبرًا لم تتأكد منه عن زميلك. ماذا تفعل؟',
    options: ['أنشره بسرعة', 'أتثبت ولا أنقله وأخبر كبيرًا عند الحاجة', 'أضيف تفاصيل من خيالي'],
    answer: 1,
    lesson: 'التثبت يحمي الناس من الظلم والكلام المؤذي.',
  },
];

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export default function KidsAdventuresPage() {
  const [mode, setMode] = useState<AdventureMode>('missions');
  const [completedMissions, setCompletedMissions] = useState<number[]>([]);
  const [missionIndex, setMissionIndex] = useState(0);
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>(() => shuffle(MEMORY_PAIRS));
  const [memoryOpen, setMemoryOpen] = useState<string[]>([]);
  const [memoryMatched, setMemoryMatched] = useState<string[]>([]);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [scenarioAnswer, setScenarioAnswer] = useState<number | null>(null);
  const [scenarioScore, setScenarioScore] = useState(0);
  const [scenarioDone, setScenarioDone] = useState(false);
  const [memoryRewarded, setMemoryRewarded] = useState(false);
  const [scenarioRewarded, setScenarioRewarded] = useState(false);
  const [stars, setStars] = useState(0);

  useEffect(() => {
    const requestedMode = new URLSearchParams(window.location.search).get('mode');
    if (requestedMode === 'memory' || requestedMode === 'scenarios') setMode(requestedMode);
    try {
      const saved = JSON.parse(localStorage.getItem('zikr-kids-adventure-progress') ?? '{}') as { missions?: number[] };
      if (Array.isArray(saved.missions)) setCompletedMissions(saved.missions);
    } catch {
      // Local progress is optional; the activity remains fully usable.
    }
    setStars(readKidsProgress().stars);
    const refreshStars = () => setStars(readKidsProgress().stars);
    window.addEventListener('zikr-kids-progress', refreshStars);
    return () => window.removeEventListener('zikr-kids-progress', refreshStars);
  }, []);

  useEffect(() => {
    localStorage.setItem('zikr-kids-adventure-progress', JSON.stringify({ missions: completedMissions }));
  }, [completedMissions]);

  const currentMission = MISSIONS[missionIndex];
  const currentScenario = SCENARIOS[scenarioIndex];
  const memoryFinished = memoryMatched.length === MEMORY_PAIRS.length;
  const missionProgress = Math.round((completedMissions.length / MISSIONS.length) * 100);

  const tabClass = (tab: AdventureMode) =>
    `rounded-full px-4 py-2 text-sm font-bold transition-colors ${mode === tab ? 'bg-brand-gold text-black' : 'bg-brand-cream/10 text-brand-cream/70 hover:bg-brand-gold/15 hover:text-brand-gold'}`;

  const completeMission = () => {
    if (completedMissions.includes(missionIndex)) return;
    setCompletedMissions(previous => [...previous, missionIndex]);
    const next = updateKidsProgress(progress => ({
      ...progress,
      completedActivities: progress.completedActivities + 1,
      stars: progress.stars + 1,
    }));
    setStars(next.stars);
  };

  const chooseMemoryCard = (id: string) => {
    if (memoryOpen.includes(id) || memoryMatched.includes(id) || memoryOpen.length >= 2) return;
    const nextOpen = [...memoryOpen, id];
    setMemoryOpen(nextOpen);
    if (nextOpen.length === 2) {
      const first = memoryCards.find(card => card.id === nextOpen[0]);
      const second = memoryCards.find(card => card.id === nextOpen[1]);
      if (!first || !second) return;
      if (first.pair === second.label) {
        const nextMatched = [...memoryMatched, first.id, second.id];
        setMemoryMatched(nextMatched);
        setMemoryOpen([]);
        if (nextMatched.length === MEMORY_PAIRS.length && !memoryRewarded) {
          setMemoryRewarded(true);
          const next = updateKidsProgress(progress => ({
            ...progress,
            completedActivities: progress.completedActivities + 1,
            stars: progress.stars + 3,
          }));
          setStars(next.stars);
        }
      } else {
        window.setTimeout(() => setMemoryOpen([]), 700);
      }
    }
  };

  const resetMemory = () => {
    setMemoryCards(shuffle(MEMORY_PAIRS));
    setMemoryOpen([]);
    setMemoryMatched([]);
    setMemoryRewarded(false);
  };

  const chooseScenario = (answer: number) => {
    if (scenarioAnswer !== null || scenarioDone) return;
    setScenarioAnswer(answer);
    if (answer === currentScenario.answer) setScenarioScore(score => score + 1);
  };

  const nextScenario = () => {
    if (scenarioIndex === SCENARIOS.length - 1) {
      setScenarioDone(true);
      if (!scenarioRewarded) {
        setScenarioRewarded(true);
        const next = updateKidsProgress(progress => ({
          ...progress,
          completedActivities: progress.completedActivities + 1,
          stars: progress.stars + 3,
        }));
        setStars(next.stars);
      }
      return;
    }
    setScenarioIndex(index => index + 1);
    setScenarioAnswer(null);
  };

  const restartScenarios = () => {
    setScenarioIndex(0);
    setScenarioAnswer(null);
    setScenarioScore(0);
    setScenarioDone(false);
    setScenarioRewarded(false);
  };

  return (
    <Container className="max-w-5xl space-y-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4" dir="rtl">
        <div>
          <Link href="/kids" className="text-sm text-brand-gold/70 hover:text-brand-gold">قسم الأطفال</Link>
          <h1 className="mt-3 text-4xl font-bold text-brand-gold">مغامرات ذِكر</h1>
          <p className="mt-2 max-w-2xl leading-relaxed text-brand-cream/70">مركز لعب آمن: جرّب، فكّر، ساعد، ثم احكِ لأسرتك ما تعلمته.</p>
        </div>
        <div className="rounded-2xl border border-brand-gold/25 bg-brand-gold/10 px-5 py-4 text-right">
          <p className="text-xs text-brand-cream/60">تقدم مهام القيم</p>
          <p className="mt-1 text-2xl font-bold text-brand-gold">{completedMissions.length} / {MISSIONS.length}</p>
          <p className="mt-1 text-xs font-bold text-brand-emerald">{stars} نجمة</p>
          <div className="mt-2 h-2 w-36 overflow-hidden rounded-full bg-black/30" aria-label={`${missionProgress}% من مهام القيم`}>
            <div className="h-full rounded-full bg-brand-gold transition-all" style={{ width: `${missionProgress}%` }} />
          </div>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2" dir="rtl" aria-label="أنماط المغامرات">
        <button className={tabClass('missions')} onClick={() => setMode('missions')}>مهام القيم</button>
        <button className={tabClass('memory')} onClick={() => setMode('memory')}>ذاكرة الأذكار</button>
        <button className={tabClass('scenarios')} onClick={() => setMode('scenarios')}>ماذا ستفعل؟</button>
      </nav>

      {mode === 'missions' && (
        <Card className="space-y-6 border-brand-gold/25 bg-gradient-to-br from-brand-gold/10 to-transparent p-6 md:p-8" dir="rtl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-brand-gold/70">مهمة {missionIndex + 1} من {MISSIONS.length}</p>
              <h2 className="mt-2 text-3xl font-bold text-brand-gold">{currentMission.title}</h2>
            </div>
            <span className="rounded-full bg-brand-emerald/15 px-4 py-2 text-sm font-bold text-brand-emerald">{currentMission.value}</span>
          </div>
          <p className="text-xl leading-relaxed text-brand-cream">{currentMission.action}</p>
          <div className="rounded-2xl border border-brand-gold/20 bg-black/20 p-4 text-brand-cream/75">
            <strong className="text-brand-gold">فكر قليلًا: </strong>{currentMission.reflection}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={completeMission} disabled={completedMissions.includes(missionIndex)}>أنجزت المهمة</Button>
            <Button variant="outline" onClick={() => setMissionIndex(index => (index + 1) % MISSIONS.length)}>مهمة أخرى</Button>
          </div>
          <p className="text-sm text-brand-cream/50">لا توجد إجابة مثالية هنا؛ اطلب مساعدة ولي الأمر إذا كانت المهمة غير مناسبة أو غير آمنة.</p>
        </Card>
      )}

      {mode === 'memory' && (
        <Card className="space-y-6 border-brand-emerald/25 bg-gradient-to-br from-brand-emerald/10 to-transparent p-6 md:p-8" dir="rtl">
          <div>
            <p className="text-sm text-brand-emerald/70">اقلب بطاقتين وابحث عن الزوج</p>
            <h2 className="mt-2 text-3xl font-bold text-brand-emerald">ذاكرة الأذكار</h2>
            <p className="mt-2 text-brand-cream/70">اربط الموقف بالذكر المناسب. الهدف هو التذكر والهدوء، لا السرعة.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {memoryCards.map(card => {
              const visible = memoryOpen.includes(card.id) || memoryMatched.includes(card.id);
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => chooseMemoryCard(card.id)}
                  aria-label={visible ? card.label : 'بطاقة مخفية'}
                  className={`min-h-24 rounded-2xl border p-3 text-center text-sm font-bold transition-all ${visible ? 'border-brand-emerald/60 bg-brand-emerald/20 text-brand-cream' : 'border-brand-emerald/20 bg-black/25 text-brand-cream/30 hover:border-brand-emerald/50'}`}
                >
                  {visible ? card.label : '؟'}
                </button>
              );
            })}
          </div>
          {memoryFinished && <p className="rounded-xl bg-brand-gold/15 p-4 text-center font-bold text-brand-gold">أحسنت! ربطت كل الأذكار بمواقفها.</p>}
          <Button variant="outline" onClick={resetMemory}>خلط البطاقات من جديد</Button>
        </Card>
      )}

      {mode === 'scenarios' && (
        <Card className="space-y-6 border-brand-gold/25 bg-gradient-to-br from-brand-gold/10 to-transparent p-6 md:p-8" dir="rtl">
          {!scenarioDone ? (
            <>
              <div className="flex items-center justify-between gap-3 text-sm text-brand-cream/60">
                <span>موقف {scenarioIndex + 1} من {SCENARIOS.length}</span>
                <span>النقاط: {scenarioScore}</span>
              </div>
              <h2 className="text-2xl font-bold leading-relaxed text-brand-gold">{currentScenario.question}</h2>
              <div className="space-y-3">
                {currentScenario.options.map((option, index) => {
                  const selected = scenarioAnswer === index;
                  const correct = currentScenario.answer === index;
                  const style = scenarioAnswer === null
                    ? 'border-brand-gold/20 bg-black/20 hover:border-brand-gold/60'
                    : correct
                      ? 'border-emerald-500/60 bg-emerald-900/25'
                      : selected
                        ? 'border-red-500/60 bg-red-900/25'
                        : 'border-brand-gold/10 bg-black/10 opacity-60';
                  return <button key={option} type="button" onClick={() => chooseScenario(index)} className={`w-full rounded-2xl border p-4 text-right text-lg text-brand-cream transition-colors ${style}`}>{option}</button>;
                })}
              </div>
              {scenarioAnswer !== null && (
                <div className="space-y-4 rounded-2xl border border-brand-gold/20 bg-black/20 p-4">
                  <p className="leading-relaxed text-brand-cream/80">{currentScenario.lesson}</p>
                  <Button onClick={nextScenario}>{scenarioIndex === SCENARIOS.length - 1 ? 'عرض النتيجة' : 'الموقف التالي'}</Button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-5 text-center">
              <p className="text-sm text-brand-emerald">اكتملت الرحلة</p>
              <h2 className="text-3xl font-bold text-brand-gold">نتيجتك: {scenarioScore} / {SCENARIOS.length}</h2>
              <p className="text-lg leading-relaxed text-brand-cream/75">الاختيار الحكيم ينمو بالتدرب والسؤال وطلب المساعدة من الكبار الموثوقين.</p>
              <Button onClick={restartScenarios}>إعادة الرحلة</Button>
            </div>
          )}
        </Card>
      )}

      <Card className="border-brand-cream/10 bg-black/15 p-5 text-center" dir="rtl">
        <p className="text-sm leading-relaxed text-brand-cream/60">هذه الأنشطة تعليمية وللترفيه الآمن. لا تشارك اسمك أو صورتك أو موقعك مع الغرباء، واطلب مساعدة ولي الأمر عند أي موقف غير مريح.</p>
      </Card>
    </Container>
  );
}
