import { BookOpen, ChevronLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getLastReadPosition } from '@/app/quran/actions';

export async function ContinueReadingBanner() {
  const progress = await getLastReadPosition();
  if (!progress) return null;

  const surahName = progress.surah_name ?? `سورة ${progress.surah_id}`;

  return (
    <Card className="p-4 border-amber-500/30 bg-amber-500/5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-400">تابع من حيث توقفت</p>
          <p className="text-xs text-muted-foreground">
            {surahName} — الآية {progress.ayah_number}
          </p>
        </div>
      </div>
      <Button
        href={`/quran/${progress.surah_id}#ayah-${progress.ayah_number}`}
        size="sm"
        variant="outline"
        className="shrink-0 gap-1 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
      >
        استكمال
        <ChevronLeft className="w-4 h-4" />
      </Button>
    </Card>
  );
}
