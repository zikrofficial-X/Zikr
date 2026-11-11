'use client';

import Image from 'next/image';
import { useState } from 'react';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
const MAX_BYTES = 3 * 1024 * 1024;

type UploadStatus = 'idle' | 'selected' | 'error';

export function CloudinaryImageUploadField({
  name,
  fileName,
  label,
  folder,
  defaultValue = '',
  hint = 'JPG أو PNG أو WEBP أو GIF — حتى 3MB',
}: {
  name: string;
  fileName: string;
  label: string;
  folder: 'homepage' | 'stories' | 'articles' | 'videos' | 'competitions' | 'branding' | 'kids';
  defaultValue?: string;
  hint?: string;
}) {
  const [selectedFileName, setSelectedFileName] = useState('');
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [message, setMessage] = useState('');

  return (
    <div className="grid gap-2 rounded-xl border border-brand-gold/10 bg-black/10 p-3">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`cloudinary-${name}`} className="text-sm font-medium text-brand-cream/80">{label}</label>
        <span className="text-[11px] text-brand-cream/40">Cloudinary · {folder}</span>
      </div>
      <input type="hidden" name={name} value={defaultValue} />
      <input
        id={`cloudinary-${name}`}
        name={fileName}
        type="file"
        accept={ACCEPT}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          setMessage('');
          if (!file) {
            setSelectedFileName('');
            setStatus('idle');
            return;
          }
          if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
            event.currentTarget.value = '';
            setSelectedFileName('');
            setStatus('error');
            setMessage('الصيغة غير مدعومة. اختر JPG أو PNG أو WEBP أو GIF.');
            return;
          }
          if (file.size <= 0 || file.size > MAX_BYTES) {
            event.currentTarget.value = '';
            setSelectedFileName('');
            setStatus('error');
            setMessage('حجم الصورة يجب ألا يتجاوز 3 ميجابايت.');
            return;
          }
          setSelectedFileName(file.name);
          setStatus('selected');
          setMessage('سيتم رفع الصورة بعد التحقق من الرابط المختصر عند حفظ النموذج.');
        }}
        className="block w-full rounded-lg border border-brand-gold/20 bg-black/30 px-3 py-2 text-xs text-brand-cream file:mr-3 file:rounded-md file:border-0 file:bg-brand-gold file:px-3 file:py-2 file:font-semibold file:text-black"
      />
      {defaultValue ? (
        <div className="flex items-center gap-3">
          <Image
            src={defaultValue}
            alt="معاينة الصورة الحالية"
            width={80}
            height={56}
            sizes="80px"
            className="h-14 w-20 rounded-lg object-cover ring-1 ring-brand-gold/20"
          />
          <span className="min-w-0 break-all text-[11px] text-brand-cream/45">{defaultValue}</span>
        </div>
      ) : null}
      {selectedFileName ? <p className="text-xs text-brand-cream/60">{selectedFileName}</p> : null}
      {message ? <p role={status === 'error' ? 'alert' : 'status'} className={`text-xs ${status === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>{message}</p> : null}
      <p className="text-[11px] text-brand-cream/40">{hint}</p>
    </div>
  );
}
