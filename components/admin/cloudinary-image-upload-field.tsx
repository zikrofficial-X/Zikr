'use client';

import { useEffect, useRef, useState } from 'react';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
const MAX_BYTES = 8 * 1024 * 1024;

type UploadStatus = 'idle' | 'uploading' | 'ready' | 'error';

export function CloudinaryImageUploadField({
  name,
  label,
  folder,
  defaultValue = '',
  hint = 'JPG أو PNG أو WEBP أو GIF — حتى 8MB',
}: {
  name: string;
  label: string;
  folder: 'homepage' | 'stories' | 'articles' | 'videos' | 'competitions' | 'branding' | 'kids';
  defaultValue?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultValue);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => setUrl(defaultValue), [defaultValue]);

  async function upload(file: File) {
    setMessage('');
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setStatus('error');
      setMessage('الصيغة غير مدعومة. اختر JPG أو PNG أو WEBP أو GIF.');
      return;
    }
    if (file.size <= 0 || file.size > MAX_BYTES) {
      setStatus('error');
      setMessage('حجم الصورة يجب ألا يتجاوز 8 ميجابايت.');
      return;
    }

    const data = new FormData();
    data.set('file', file);
    data.set('folder', folder);
    setStatus('uploading');
    try {
      const response = await fetch('/api/admin/cloudinary/image', { method: 'POST', body: data });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || typeof payload.secureUrl !== 'string') {
        throw new Error(payload.error || 'تعذر رفع الصورة.');
      }
      setUrl(payload.secureUrl);
      setStatus('ready');
      setMessage('تم رفع الصورة، وستُحفظ مع النموذج عند الإرسال.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'تعذر رفع الصورة.');
    }
  }

  return (
    <div className="grid gap-2 rounded-xl border border-brand-gold/10 bg-black/10 p-3">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`cloudinary-${name}`} className="text-sm font-medium text-brand-cream/80">{label}</label>
        <span className="text-[11px] text-brand-cream/40">Cloudinary</span>
      </div>
      <input type="hidden" name={name} value={url} />
      <input
        id={`cloudinary-${name}`}
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        disabled={status === 'uploading'}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
        className="block w-full rounded-lg border border-brand-gold/20 bg-black/30 px-3 py-2 text-xs text-brand-cream file:mr-3 file:rounded-md file:border-0 file:bg-brand-gold file:px-3 file:py-2 file:font-semibold file:text-black"
      />
      {url ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="معاينة الصورة المرفوعة" className="h-14 w-20 rounded-lg object-cover ring-1 ring-brand-gold/20" />
          <span className="min-w-0 break-all text-[11px] text-brand-cream/45">{url}</span>
        </div>
      ) : null}
      {message ? <p role={status === 'error' ? 'alert' : 'status'} className={`text-xs ${status === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>{message}</p> : null}
      <p className="text-[11px] text-brand-cream/40">{hint}</p>
    </div>
  );
}
