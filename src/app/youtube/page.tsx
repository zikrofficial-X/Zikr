import Image from 'next/image';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { getYoutubeChannelFeed, getYoutubeSyncHealth } from '@/features/videos/integrations/youtube';

export const metadata: Metadata = pageMetadata({
  title: 'قناة يوتيوب | ذِكر',
  description: 'تابع أحدث المقاطع والقوائم على قناة ذِكر الرسمية على يوتيوب.',
  path: '/youtube',
});

export const revalidate = 300;

function formatDate(value: string | null): string {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('ar', { dateStyle: 'medium' }).format(new Date(value));
  } catch {
    return '';
  }
}

export default async function YoutubePage() {
  const [feed, health] = await Promise.all([
    getYoutubeChannelFeed(24),
    getYoutubeSyncHealth(),
  ]);
  const channelUrl = feed.channelId
    ? `https://www.youtube.com/channel/${feed.channelId}`
    : 'https://www.youtube.com/@zikr';

  return (
    <Container className="py-12 space-y-10">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold text-balance">قناتنا على يوتيوب</h1>
        <p className="max-w-2xl mx-auto text-lg leading-8 arabic-muted text-pretty">
          اشترك في قناة ذِكر لمتابعة أحدث المحتوى الإسلامي من تلاوات ومقاطع تعليمية
        </p>
        <div className="flex justify-center">
          <Button href={channelUrl} variant="primary" target="_blank" rel="noopener noreferrer">
            الاشتراك في القناة
          </Button>
        </div>
      </section>

      {!feed.configured && (
        <Card className="p-6 text-center">
          <p className="text-brand-cream/70">
            لم يتم ضبط مفاتيح يوتيوب بعد. أضف YOUTUBE_API_KEY و YOUTUBE_CHANNEL_ID لعرض المقاطع تلقائيًا.
          </p>
        </Card>
      )}

      {feed.configured && feed.error && feed.videos.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-brand-cream/70">تعذّر تحميل المقاطع المخزنة حاليًا. حاول مرة أخرى لاحقًا.</p>
        </Card>
      )}

      {feed.configured && health.status === 'quota_exceeded' && (
        <Card className="p-4 text-center border-amber-500/20 bg-amber-500/5">
          <p className="text-sm text-amber-200/80">تعذر التحديث المباشر من يوتيوب مؤقتًا، ويتم عرض آخر محتوى تمت مزامنته.</p>
        </Card>
      )}

      {feed.videos.length > 0 && (
        <section className="space-y-6">
          <SectionHeader title="أحدث الفيديوهات" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {feed.videos.map((video) => (
              <a key={video.id} href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="group">
                <Card className="overflow-hidden h-full flex flex-col hover:border-brand-gold/50 transition-all">
                  <div className="relative aspect-video bg-black/40">
                    {video.thumbnailUrl ? <Image src={video.thumbnailUrl} alt={video.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /> : null}
                  </div>
                  <div className="p-4 space-y-2 flex-1">
                    <h3 className="text-sm font-semibold text-brand-cream line-clamp-2 group-hover:text-brand-gold transition-colors">{video.title}</h3>
                    {video.publishedAt && <p className="text-xs text-brand-cream/50">{formatDate(video.publishedAt)}</p>}
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </section>
      )}

      {feed.configured && feed.videos.length === 0 && !feed.error && (
        <Card className="p-6 text-center">
          <p className="text-brand-cream/70">لا توجد مقاطع منشورة حاليًا على القناة أو لم تتم أول مزامنة بعد.</p>
        </Card>
      )}
    </Container>
  );
}