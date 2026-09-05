'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { evaluateMemorizationAction } from './actions';

function getSupportedAudioMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null;

  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];

  for (const mimeType of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(mimeType)) return mimeType;
    } catch {
      // Some WebViews expose MediaRecorder but throw from isTypeSupported.
    }
  }

  return null;
}

export function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [result, setResult] = useState<string>('');
  const [expanded, setExpanded] = useState(false);
  const [micError, setMicError] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function startRecording() {
    setMicError('');
    setAudioBlob(null);

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMicError('تسجيل الصوت غير متاح في هذه البيئة. افتح ZIKR من اتصال آمن أو استخدم أحدث نسخة من التطبيق.');
      return;
    }

    if (typeof MediaRecorder === 'undefined') {
      setMicError('جهازك أو بيئة التطبيق لا تدعم تسجيل الصوت. حدّث التطبيق إلى أحدث إصدار.');
      return;
    }

    const mimeType = getSupportedAudioMimeType();
    if (!mimeType) {
      setMicError('لم يتم العثور على صيغة تسجيل صوتي مدعومة على جهازك. حدّث التطبيق أو جرّب متصفح Chrome حديث.');
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') {
        setMicError('تم رفض إذن الميكروفون. اسمح لـ ZIKR باستخدام الميكروفون من إعدادات التطبيق ثم حاول مرة أخرى.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setMicError('لم يتم العثور على ميكروفون في جهازك.');
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setMicError('الميكروفون مستخدم حاليًا بواسطة تطبيق آخر. أغلق أي تطبيق يستخدم الميكروفون ثم حاول مرة أخرى.');
      } else {
        setMicError('تعذر الوصول إلى الميكروفون. تأكد من صلاحيات التطبيق وحاول مرة أخرى.');
      }
      stopStream();
      return;
    }

    try {
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onerror = () => {
        setMicError('حدث خطأ أثناء تسجيل الصوت. حاول مرة أخرى.');
        setIsRecording(false);
        recorderRef.current = null;
        stopStream();
      };

      recorder.onstop = () => {
        const finalType = recorder.mimeType || mimeType;
        const blob = new Blob(chunksRef.current, { type: finalType });
        if (blob.size > 0) {
          setAudioBlob(blob);
        } else {
          setMicError('لم يتم التقاط صوت. تأكد من السماح بالميكروفون وحاول مرة أخرى.');
        }
        recorderRef.current = null;
        stopStream();
      };

      recorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
    } catch (err) {
      console.error('[memorization] Failed to start MediaRecorder:', err);
      recorderRef.current = null;
      stopStream();
      setMicError('تعذر بدء التسجيل على هذا الجهاز. تم إيقاف التسجيل بأمان.');
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder) return;

    try {
      if (recorder.state !== 'inactive') recorder.stop();
    } catch {
      recorderRef.current = null;
      stopStream();
    } finally {
      setIsRecording(false);
    }
  }

  function submitEvaluation(formData: FormData) {
    if (audioBlob) {
      const extension = audioBlob.type.includes('mp4')
        ? 'm4a'
        : audioBlob.type.includes('ogg')
          ? 'ogg'
          : 'webm';
      formData.set(
        'audio',
        new File([audioBlob], `tasmee.${extension}`, {
          type: audioBlob.type || 'audio/webm',
        }),
      );
    }

    startTransition(async () => {
      const evaluation = await evaluateMemorizationAction(formData);
      setResult(evaluation);
    });
  }

  return <form action={submitEvaluation} className='space-y-4'>
    <div className='grid gap-3 md:grid-cols-2'>
      <label className='space-y-1 text-sm arabic-muted'>
        <span>المقرر</span>
        <input name='target' placeholder='مثال: سورة الملك 1-10' className='w-full rounded-lg bg-black/20 p-2 text-brand-cream' />
      </label>
      <label className='space-y-1 text-sm arabic-muted'>
        <span>سؤال أكمل / النص المتوقع</span>
        <input name='expectedText' placeholder='اكتب بداية الآية أو الورد المطلوب' className='w-full rounded-lg bg-black/20 p-2 text-brand-cream' />
      </label>
    </div>

    <div className='flex flex-wrap items-center gap-3'>
      <Button type='button' onClick={isRecording ? stopRecording : startRecording} variant={isRecording ? 'secondary' : 'primary'}>
        {isRecording ? 'إيقاف التسجيل' : 'ابدأ تسجيل التسميع'}
      </Button>
      <Button type='submit' disabled={!audioBlob || isPending}>تقييم الحفظ والتجويد</Button>
      {audioBlob ? <span className='text-sm text-emerald-300'>تم تسجيل الصوت وجاهز للتقييم.</span> : <span className='text-sm arabic-muted'>لن يُطلب إذن الميكروفون إلا عند الضغط على بدء التسجيل.</span>}
    </div>

    {micError ? (
      <p className='rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300' role='alert'>{micError}</p>
    ) : null}

    {result ? (
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-bold text-brand-gold'>نتائج التقييم:</h3>
          <div className='flex gap-2'>
            <Button
              type='button'
              variant='secondary'
              size='sm'
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(result);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  setMicError('تعذر النسخ إلى الحافظة.');
                }
              }}
            >
              {copied ? 'تم النسخ' : 'نسخ التقييم'}
            </Button>
            <Button
              type='button'
              variant='secondary'
              size='sm'
              onClick={() => setResult('')}
            >
              مسح
            </Button>
          </div>
        </div>
        <div className='relative group'>
          <div className={`rounded-xl border border-brand-gold/25 bg-black/20 p-4 leading-8 whitespace-pre-wrap transition-all duration-300 ${!expanded && result.length > 300 ? 'max-h-48 overflow-hidden' : ''}`}>
            {result}
            {!expanded && result.length > 300 && (
              <div className='absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center pb-2'>
                <Button type='button' variant='secondary' size='sm' onClick={() => setExpanded(true)}>عرض المزيد</Button>
              </div>
            )}
          </div>
          {expanded && result.length > 300 && (
            <div className='mt-2 text-center'>
              <Button type='button' variant='secondary' size='sm' onClick={() => setExpanded(false)}>عرض أقل</Button>
            </div>
          )}
        </div>
      </div>
    ) : null}
  </form>;
}
