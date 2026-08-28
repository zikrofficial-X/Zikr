'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { uploadAvatarAction } from '@/app/profile/avatar-actions';

const ALLOWED_AVATAR_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  displayName: string | null;
  email: string | null;
}

export function AvatarUpload({ currentAvatarUrl, displayName, email }: AvatarUploadProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setPreview(currentAvatarUrl);
  }, [currentAvatarUrl]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('حجم الصورة يجب أن يكون أقل من 2MB');
      return;
    }
    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      setError('يرجى اختيار صورة بصيغة JPG أو PNG أو WEBP أو GIF');
      return;
    }

    setError(null);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    const formData = new FormData();
    formData.append('avatarFile', file);
    startTransition(async () => {
      try {
        await uploadAvatarAction(formData);
        router.refresh();
      } catch {
        setPreview(currentAvatarUrl);
        setError('فشل رفع الصورة، حاول مرة أخرى');
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    });
  }

  const initial = (displayName?.[0] ?? email?.[0] ?? 'م').toUpperCase();

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={isPending}
        aria-label="تغيير الصورة الشخصية"
        className="relative group h-24 w-24 rounded-full overflow-hidden ring-2 ring-brand-gold/30 focus:outline-none focus:ring-brand-gold transition-all"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="صورة المستخدم" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-black/20 text-3xl text-brand-gold/50">
            {initial}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-white font-medium">تغيير</span>
        </div>
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="h-5 w-5 rounded-full border-2 border-brand-gold border-t-transparent animate-spin" />
          </div>
        )}
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={isPending}
        className="text-xs text-brand-gold/70 hover:text-brand-gold underline underline-offset-2 transition-colors"
      >
        {isPending ? 'جاري الرفع...' : 'اختر صورة'}
      </button>
      <p className="text-xs text-brand-cream/40">JPG, PNG, GIF — حتى 2MB</p>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
