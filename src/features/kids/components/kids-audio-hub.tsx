'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Headphones, Mic, Pause, Play, ShieldCheck, Square, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import {
  KIDS_AUDIO_CATEGORY_LABELS,
  KIDS_AUDIO_TRACKS,
  type KidsAudioCategory,
  type KidsAudioTrack,
} from '@/lib/data/kids-audio';
import { readKidsProgress, updateKidsProgress } from '@/lib/data/kids-audio-client';

const categoryOrder: Array<KidsAudioCategory | 'all'> = ['all', 'story', 'nasheed', 'dhikr'];
const categoryLabels: Record<KidsAudioCategory | 'all', string> = {
  all: 'الكل',
  ...KIDS_AUDIO_CATEGORY_LABELS,
};

export default function KidsAudioHub() {
  const [category, setCategory] = useState<KidsAudioCategory | 'all'>('all');
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingMessage, setRecordingMessage] = useState('');
  const [stars, setStars] = useState(0);
  const [recordingSupported, setRecordingSupported] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);

  const filteredTracks = useMemo(
    () => category === 'all' ? KIDS_AUDIO_TRACKS : KIDS_AUDIO_TRACKS.filter(track => track.category === category),
    [category],
  );

  useEffect(() => {
    setStars(readKidsProgress().stars);
    setRecordingSupported(typeof window !== 'undefined' && 'MediaRecorder' in window && !!navigator.mediaDevices?.getUserMedia);
    const handleProgress = (event: Event) => {
      const detail = (event as CustomEvent<{ stars?: number }>).detail;
      if (typeof detail?.stars === 'number') setStars(detail.stars);
    };
    window.addEventListener('zikr-kids-progress', handleProgress);
    return () => {
      window.removeEventListener('zikr-kids-progress', handleProgress);
      window.speechSynthesis?.cancel();
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    };
  }, [recordingUrl]);

  const markTrackListened = (track: KidsAudioTrack) => {
    const next = updateKidsProgress(progress => {
      const isNew = progress.listenedTrackIds.includes(track.id) === false;
      return {
        ...progress,
        listenedTrackIds: isNew ? [...progress.listenedTrackIds, track.id] : progress.listenedTrackIds,
        stars: progress.stars + (isNew ? 1 : 0),
      };
    });
    setStars(next.stars);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setActiveTrackId(null);
  };

  const playTrack = (track: KidsAudioTrack) => {
    if (activeTrackId === track.id && speaking) {
      stopSpeaking();
      return;
    }
    window.speechSynthesis?.cancel();
    setActiveTrackId(track.id);
    setSpeaking(true);
    markTrackListened(track);
    if (track.audioUrl) {
      const audio = new Audio(track.audioUrl);
      audio.onended = stopSpeaking;
      void audio.play().catch(() => setSpeaking(false));
      return;
    }
    if (!('speechSynthesis' in window)) {
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(track.transcript);
    utterance.lang = 'ar-SA';
    utterance.rate = track.category === 'dhikr' ? 0.78 : 0.9;
    utterance.onend = stopSpeaking;
    utterance.onerror = stopSpeaking;
    window.speechSynthesis.speak(utterance);
  };

  const startRecording = async () => {
    if (!recordingSupported || recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordingChunksRef.current = [];
      recorder.ondataavailable = event => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(recordingChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (recordingUrl) URL.revokeObjectURL(recordingUrl);
        setRecordingUrl(URL.createObjectURL(blob));
        const next = updateKidsProgress(progress => ({
          ...progress,
          recordingCount: progress.recordingCount + 1,
          stars: progress.stars + 2,
        }));
        setStars(next.stars);
        setRecordingMessage('تم حفظ التسجيل مؤقتًا على هذا الجهاز فقط. يمكنك الاستماع إليه أو تنزيله.');
      };
      recorder.onerror = () => setRecordingMessage('تعذر إكمال التسجيل. جرّب مرة أخرى أو تحقق من إذن الميكروفون.');
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setRecordingMessage('التسجيل جارٍ… اقرأ الذكر بهدوء ثم اضغط إيقاف.');
    } catch {
      setRecordingMessage('لم يُسمح بالميكروفون. يمكنك تفعيل الإذن من إعدادات المتصفح أو الاكتفاء بالاستماع.');
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
  };

  const clearRecording = () => {
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    setRecordingUrl(null);
    setRecordingMessage('حُذف التسجيل من هذه الصفحة ولم يُرفع إلى أي خادم.');
  };

  return (
    <Container className="space-y-10 py-10">
      <section className="space-y-5 text-center" dir="rtl">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-4 py-2 text-sm text-brand-gold">
          <Headphones className="h-4 w-4" aria-hidden="true" /> صوتيات ذِكر للصغار
        </span>
        <h1 className="text-4xl font-bold text-brand-gold md:text-5xl">اسمع، ردد، واكتشف</h1>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-brand-cream/70">
          قصص وأناشيد وأذكار قصيرة تساعد الطفل على التعلم بالصوت، مع مساحة آمنة لتسجيل القراءة على جهازه.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-gold/15 px-4 py-2 text-brand-gold"><Star className="h-4 w-4" fill="currentColor" /> {stars} نجمة</span>
          <Link href="/kids/achievements" className="rounded-full bg-brand-emerald/15 px-4 py-2 font-bold text-brand-emerald hover:bg-brand-emerald/25">لوحة الإنجازات والشرف</Link>
        </div>
      </section>

      <section className="space-y-5" dir="rtl" aria-labelledby="audio-library-title">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-brand-emerald/80">مكتبة صوتية قصيرة</p>
            <h2 id="audio-library-title" className="mt-1 text-2xl font-bold text-brand-gold">اختر ما تحب أن تسمع</h2>
          </div>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="تصنيف الصوتيات">
            {categoryOrder.map(item => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={category === item}
                onClick={() => setCategory(item)}
                className={`rounded-full px-3 py-2 text-sm font-bold transition-colors ${category === item ? 'bg-brand-gold text-black' : 'bg-brand-cream/10 text-brand-cream/70 hover:bg-brand-gold/15 hover:text-brand-gold'}`}
              >
                {categoryLabels[item]}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {filteredTracks.map(track => {
            const active = activeTrackId === track.id && speaking;
            return (
              <Card key={track.id} className="flex h-full flex-col gap-4 border-brand-gold/20 bg-gradient-to-br from-brand-gold/10 to-transparent p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs text-brand-emerald">{KIDS_AUDIO_CATEGORY_LABELS[track.category]} · {track.ageGroup} سنوات</span>
                    <h3 className="mt-2 text-xl font-bold text-brand-gold">{track.title}</h3>
                  </div>
                  <span className="rounded-full bg-black/20 px-3 py-1 text-xs text-brand-cream/60">{track.duration}</span>
                </div>
                <p className="text-sm leading-relaxed text-brand-cream/70">{track.description}</p>
                <div className="rounded-xl border border-brand-cream/10 bg-black/15 p-3 text-sm leading-relaxed text-brand-cream/75">{track.transcript}</div>
                <Button onClick={() => playTrack(track)} className="mt-auto w-full gap-2">
                  {active ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
                  {active ? 'إيقاف الاستماع' : 'استمع الآن'}
                </Button>
              </Card>
            );
          })}
        </div>
        <p className="text-sm leading-relaxed text-brand-cream/50">عند عدم وجود ملف صوتي مسجل، يستخدم الموقع صوت الجهاز لقراءة النص العربي. لا يُعرض هذا على أنه تسجيل إنشادي بشري.</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]" dir="rtl" aria-labelledby="record-title">
        <Card className="space-y-5 border-brand-emerald/30 bg-gradient-to-br from-brand-emerald/15 to-transparent p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-brand-emerald/20 p-3 text-brand-emerald"><Mic className="h-7 w-7" aria-hidden="true" /></div>
            <div>
              <p className="text-sm text-brand-emerald">مختبر الصوت</p>
              <h2 id="record-title" className="mt-1 text-2xl font-bold text-brand-gold">سجّل قراءة الذكر</h2>
            </div>
          </div>
          <p className="leading-relaxed text-brand-cream/75">اختر ذكرًا من المكتبة، استمع إليه، ثم اقرأه بصوتك. التسجيل يبقى في ذاكرة هذا الجهاز ولا يُرسل تلقائيًا إلى الموقع.</p>
          <div className="rounded-2xl border border-brand-gold/20 bg-black/20 p-4 text-center text-xl font-bold leading-relaxed text-brand-gold">باسمك اللهم أموت وأحيا</div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={recording ? stopRecording : startRecording} disabled={!recordingSupported} className="gap-2">
              {recording ? <Square className="h-4 w-4" aria-hidden="true" /> : <Mic className="h-4 w-4" aria-hidden="true" />}
              {recording ? 'إيقاف التسجيل' : 'ابدأ التسجيل'}
            </Button>
            {recordingUrl && <Button variant="outline" onClick={clearRecording} className="gap-2"><Trash2 className="h-4 w-4" aria-hidden="true" /> حذف</Button>}
          </div>
          {!recordingSupported && <p className="text-sm text-brand-gold/80">المتصفح الحالي لا يدعم التسجيل الصوتي. جرّب متصفحًا حديثًا يدعم الميكروفون.</p>}
          {recordingMessage && <p className="rounded-xl bg-black/20 p-3 text-sm leading-relaxed text-brand-cream/75" role="status">{recordingMessage}</p>}
          {recordingUrl && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-emerald/20 bg-black/15 p-3">
              <audio controls src={recordingUrl} className="max-w-full" aria-label="التسجيل الصوتي الشخصي" />
              <a href={recordingUrl} download="zikr-kids-dhikr.webm" className="inline-flex items-center gap-2 rounded-lg border border-brand-gold/30 px-3 py-2 text-sm font-bold text-brand-gold hover:bg-brand-gold/10"><Download className="h-4 w-4" aria-hidden="true" /> تنزيل</a>
            </div>
          )}
        </Card>
        <Card className="space-y-4 border-brand-gold/20 bg-black/15 p-6">
          <div className="flex items-center gap-3 text-brand-gold"><ShieldCheck className="h-6 w-6" aria-hidden="true" /><h2 className="text-xl font-bold">قواعد الصوت الآمن</h2></div>
          <ul className="space-y-3 text-sm leading-relaxed text-brand-cream/70">
            <li>التسجيل محلي على جهازك، ولا يرفع إلى Supabase أو أي خادم.</li>
            <li>لا تسجل اسم الطفل أو عنوانه أو أي معلومات شخصية.</li>
            <li>اطلب إذن ولي الأمر قبل تشغيل الميكروفون، ويمكن حذف التسجيل في أي وقت.</li>
            <li>النجوم تشجع التعلم ولا تقارن أصوات الأطفال ببعضهم.</li>
          </ul>
        </Card>
      </section>
    </Container>
  );
}
