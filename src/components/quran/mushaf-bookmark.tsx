'use client';

import { useState, useTransition } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { toast } from 'sonner';
import { saveReadingProgress, clearReadingProgress } from '@/app/quran/actions';

interface MushafBookmarkProps {
  surahId: number;
  ayahNumber: number;
  surahName: string;
  /** Whether this ayah is the currently saved bookmark */
  isCurrentBookmark: boolean;
  onBookmarkChange?: (ayahNumber: number | null) => void;
}

export function MushafBookmark({
  surahId,
  ayahNumber,
  surahName,
  isCurrentBookmark,
  onBookmarkChange,
}: MushafBookmarkProps) {
  const [pending, startTransition] = useTransition();
  const [localBookmark, setLocalBookmark] = useState(isCurrentBookmark);

  const handleClick = () => {
    startTransition(async () => {
      if (localBookmark) {
        // Remove bookmark
        const res = await clearReadingProgress(surahId);
        if (res.success) {
          setLocalBookmark(false);
          onBookmarkChange?.(null);
          toast.success('تم حذف علامة القراءة');
        } else {
          toast.error('تعذَّر حذف العلامة');
        }
      } else {
        // Set bookmark
        const res = await saveReadingProgress(surahId, ayahNumber, surahName);
        if (res.success) {
          setLocalBookmark(true);
          onBookmarkChange?.(ayahNumber);
          toast.success(`تم حفظ موضع القراءة عند الآية ${ayahNumber}`);
        } else if (res.error === 'يجب تسجيل الدخول أولاً') {
          toast.error('سجِّل دخولك لحفظ موضع القراءة');
        } else {
          toast.error('تعذَّر حفظ الموضع');
        }
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      title={localBookmark ? 'إزالة علامة القراءة' : 'ضع علامة قراءة هنا'}
      aria-label={localBookmark ? 'إزالة علامة القراءة' : 'ضع علامة قراءة هنا'}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all disabled:opacity-50 ${
        localBookmark
          ? 'text-amber-400 bg-amber-400/15 hover:bg-amber-400/25'
          : 'text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10'
      }`}
    >
      {localBookmark ? (
        <BookmarkCheck className="w-4 h-4" />
      ) : (
        <Bookmark className="w-4 h-4" />
      )}
      <span>{localBookmark ? 'علامتي' : 'ضع علامة'}</span>
    </button>
  );
}
