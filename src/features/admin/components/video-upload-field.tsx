'use client';

import { useRef, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

const MAX_VIDEO_BYTES = 512 * 1024 * 1024;
const ACCEPTED_TYPES = 'video/mp4,video/webm,video/quicktime,video/x-m4v';

export function VideoUploadField() {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'ready' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [fileName, setFileName] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [storageKey, setStorageKey] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setMessage('');
    setFileName(file.name);
    setVideoUrl('');
    setStorageKey('');

    if (file.size <= 0 || file.size > MAX_VIDEO_BYTES) {
      setStatus('error');
      setMessage('حجم الفيديو يجب أن يكون أكبر من صفر وألا يتجاوز 512 ميجابايت.');
      return;
    }
    if (!['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'].includes(file.type)) {
      setStatus('error');
      setMessage('الصيغة المدعومة: MP4 أو WebM أو MOV.');
      return;
    }

    try {
      setStatus('uploading');
      const presignResponse = await fetch('/api/admin/videos/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          contentLength: file.size,
        }),
      });
      const presignData = await presignResponse.json().catch(() => ({}));
      if (!presignResponse.ok) {
        throw new Error(presignData.error || 'تعذر تجهيز رفع الفيديو.');
      }

      if (typeof presignData.bucket !== 'string' || typeof presignData.path !== 'string' || typeof presignData.token !== 'string') {
        throw new Error('استجابة التخزين الموقّعة غير مكتملة.');
      }
      const supabase = createBrowserSupabaseClient();
      const { error: uploadError } = await supabase.storage
        .from(presignData.bucket)
        .uploadToSignedUrl(presignData.path, presignData.token, file, {
          contentType: file.type,
          upsert: false,
        });
      if (uploadError) throw new Error(`فشل رفع الملف إلى التخزين: ${uploadError.message}`);
      if (typeof presignData.publicUrl !== 'string' || !presignData.publicUrl) {
        throw new Error('لم يرجع التخزين رابط الفيديو العام.');
      }

      setVideoUrl(presignData.publicUrl);
      setStorageKey(typeof presignData.key === 'string' ? presignData.key : '');
      setStatus('ready');
      setMessage('تم رفع الملف بنجاح وسيُستخدم تلقائيًا عند الحفظ والنشر.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'تعذر رفع الفيديو.');
    }
  }

  return (
    <div className="grid gap-2 text-sm text-brand-cream/65">
      <span>رفع ملف فيديو إلى الموقع (اختياري)</span>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={event => {
          const file = event.target.files?.[0];
          if (file) void uploadFile(file);
        }}
        disabled={status === 'uploading'}
        className="block w-full rounded-lg border border-brand-gold/30 bg-black/30 px-3 py-2 text-brand-cream file:mr-3 file:rounded-md file:border-0 file:bg-brand-gold file:px-3 file:py-2 file:font-semibold file:text-black"
      />
      <input type="hidden" name="uploadedVideoUrl" value={videoUrl} />
      <input type="hidden" name="videoStorageKey" value={storageKey} />
      {fileName ? <span className="text-xs text-brand-cream/50">الملف: {fileName}</span> : null}
      {status === 'uploading' ? <span className="text-xs text-brand-gold">جاري رفع ملف الفيديو إلى التخزين الآمن...</span> : null}
      {message ? (
        <span className={`text-xs ${status === 'error' ? 'text-red-300' : 'text-emerald-300'}`} role={status === 'error' ? 'alert' : 'status'}>
          {message}
        </span>
      ) : null}
      <span className="text-xs text-brand-cream/45">الصيغ المدعومة MP4 وWebM وMOV، والحد الأقصى 512 ميجابايت.</span>
    </div>
  );
}
