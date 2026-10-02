import Image from 'next/image';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { Badge } from '@/components/ui/badge';
import { getYoutubeChannelFeed } from '@/features/videos/integrations/youtube';
import { YoutubeFeedCard } from '@/features/videos/components/youtube-feed-card';
import { getFacebookPageProfile } from '@/features/social/integrations/facebook';

export const metadata: Metadata = pageMetadata({
  title: 'فيديوهات ذِكر | يوتيوب وفيسبوك',
  description: 'صفحة الفيديوهات الموحدة في ذِكر: أحدث فيديوهات قناة يوتيوب الرسمية مع روابط ومعلومات الحسابات الاجتماعية المتزامنة.',
  path: '/videos',
});

export const revalidate = 900;

function formatDate(value: string | null): string {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('ar', { dateStyle: 'medium' }).format(new Date(value));
  } catch {
    return '';
  }
}

function formatCount(value: number | null): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  return new Intl.NumberFormat('ar', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export default async function VideosPage() {
  const [feed, facebook] = await Promise.all([
    getYoutubeChannelFeed(24),
    getFacebookPageProfile(),
  ]);

  const channel = feed.channel;
  const youtubeUrl = channel?.pageUrl
    ?? (feed.channelId ? `https://www.youtube.com/channel/${feed.channelId}` : 'https://www.youtube.com/@ZikrMediaOfficial');

  return (
    <Container className="py-10 space-y-10">
      <section className="space-y-4 text-center">
        <Badge variant="outline" className="mx-auto">المحتوى المرئي الموحد</Badge>
        <h1 className="text-4xl font-bold text-brand-gold text-balance">فيديوهات ذِكر</h1>
        <p className="mx-auto max-w-3xl text-lg leading-8 arabic-muted text-pretty">
          هذه هي صفحة الفيديوهات الأساسية في ذِكر. المحتوى المعروض هو أحدث ما نُشر على قناة يوتيوب الرسمية،
          وتتم مزامنته دوريًا مع بنية النشر الاجتماعي حتى لا يكون لدينا أكثر من مكتبة فيديو متكررة.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {channel && (
          <Card className="overflow-hidden border-brand-gold/20 bg-brand-gold/5">
            {channel.avatarUrl ? (
              <div className="relative h-44 bg-black/20">
                <Image
                  src={channel.avatarUrl}
                  alt={channel.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain p-8"
                />
              </div>
            ) : null}
            <div className="space-y-4 p-6">
              <div>
                <p className="text-sm text-brand-cream/45">قناة يوتيوب الرسمية</p>
                <h2 className="mt-1 text-2xl font-bold text-brand-gold">{channel.name}</h2>
              </div>
              {channel.description ? <p className="leading-7 text-brand-cream/70 line-clamp-4">{channel.description}</p> : null}
              <div className="flex flex-wrap gap-2 text-xs text-brand-cream/60">
                {formatCount(channel.subscriberCount) ? <Badge variant="secondary">{formatCount(channel.subscriberCount)} مشترك</Badge> : null}
                {formatCount(channel.videoCount) ? <Badge variant="secondary">{formatCount(channel.videoCount)} فيديو</Badge> : null}
                {formatCount(channel.viewCount) ? <Badge variant="secondary">{formatCount(channel.viewCount)} مشاهدة</Badge> : null}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button href={youtubeUrl} variant="primary" target="_blank" rel="noopener noreferrer">اشترك في القناة</Button>
                <Button href={youtubeUrl} variant="secondary" target="_blank" rel="noopener noreferrer">فتح يوتيوب</Button>
              </div>
            </div>
          </Card>
        )}

        {facebook && (
          <Card className="overflow-hidden border-blue-500/20 bg-blue-500/5">
            {facebook.avatarUrl ? (
              <div className="relative h-44 bg-black/20">
                <Image
                  src={facebook.avatarUrl}
                  alt={facebook.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain p-8"
                />
              </div>
            ) : null}
            <div className="space-y-4 p-6">
              <div>
                <p className="text-sm text-brand-cream/45">صفحة فيسبوك الرسمية</p>
                <h2 className="mt-1 text-2xl font-bold text-brand-gold">{facebook.name}</h2>
              </div>
              <p className="leading-7 text-brand-cream/70 line-clamp-4">{facebook.description}</p>
              <div className="flex flex-wrap gap-2 text-xs text-brand-cream/60">
                {formatCount(facebook.likesCount) ? <Badge variant="secondary">{formatCount(facebook.likesCount)} إعجاب</Badge> : null}
                {formatCount(facebook.followersCount) ? <Badge variant="secondary">{formatCount(facebook.followersCount)} متابع</Badge> : null}
                {facebook.category ? <Badge variant="outline">{facebook.category}</Badge> : null}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button href={facebook.pageUrl} variant="primary" target="_blank" rel="noopener noreferrer">أعجب بالصفحة</Button>
                <Button href={facebook.pageUrl} variant="secondary" target="_blank" rel="noopener noreferrer">تابع الصفحة</Button>
              </div>
              {facebook.stale && facebook.error ? <p className="text-xs text-amber-200/60">{facebook.error}</p> : null}
            </div>
          </Card>
        )}
      </section>

      {feed.videos.length > 0 ? (
        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeader
              title="أحدث فيديوهات القناة"
              subtitle={feed.stale ? 'يتم عرض آخر نسخة مخزنة إلى أن يكتمل التحديث التالي.' : 'هذه المكتبة هي المصدر الوحيد للفيديوهات داخل ذِكر.'}
            />
            <Button href={youtubeUrl} variant="ghost" target="_blank" rel="noopener noreferrer">المشاهدة على يوتيوب</Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {feed.videos.map((video) => (
              <YoutubeFeedCard
                key={video.id}
                videoId={video.id}
                title={video.title}
                thumbnailUrl={video.thumbnailUrl}
                publishedLabel={formatDate(video.publishedAt)}
              />
            ))}
          </div>
        </section>
      ) : (
        <Card className="p-8 text-center border-brand-gold/20 bg-brand-gold/5">
          <h2 className="text-2xl font-bold text-brand-gold">لم تتوفر فيديوهات القناة بعد</h2>
          <p className="mx-auto mt-3 max-w-2xl leading-8 arabic-muted">
            عند اكتمال إعداد مزامنة يوتيوب ستظهر أحدث الفيديوهات هنا تلقائيًا. لا يتم إنشاء مكتبة فيديو بديلة أو تكرار المحتوى.
          </p>
          <div className="mt-5 flex justify-center">
            <Button href={youtubeUrl} variant="secondary" target="_blank" rel="noopener noreferrer">زيارة القناة الرسمية</Button>
          </div>
        </Card>
      )}

      <Card className="p-6 border-brand-gold/15 bg-black/15">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-brand-gold">المصدر والمزامنة</h2>
            <p className="mt-1 text-sm leading-7 text-brand-cream/60">
              الفيديوهات المعروضة مصدرها قناة يوتيوب الرسمية، بينما روابط يوتيوب وفيسبوك تقود إلى الحسابات الأصلية مباشرة.
              المزامنة الخلفية تعمل دوريًا لتجلب الجديد دون إنشاء نسخة محتوى منفصلة داخل الموقع.
            </p>
          </div>
          <Badge variant="outline">{feed.stale ? 'آخر نسخة مخزنة' : 'مزامنة نشطة'}</Badge>
        </div>
      </Card>
    </Container>
  );
}
