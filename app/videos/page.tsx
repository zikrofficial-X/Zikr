import Image from 'next/image';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { Badge } from '@/components/ui/badge';
import { getYoutubeChannelFeed } from '@/lib/services/youtube';

export const metadata: Metadata = pageMetadata({
  title: 'الفيديوهات الإسلامية',
  description: 'شاهد أحدث الفيديوهات والمحتوى الإسلامي من قناة ذِكر على يوتيوب.',
  path: '/videos',
});

export const revalidate = 1800;

function formatDate(value: string | null): string {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('ar', { dateStyle: 'medium' }).format(new Date(value));
  } catch {
    return '';
  }
}

const localVideos = [
  {
    id: 'dQw4w9WgXcQ',
    title: 'شرح سورة الفاتحة',
    description: 'شرح تفصيلي لأم القرآن الكريم',
    category: 'تفسير',
    thumbnailUrl: null as string | null,
    publishedAt: null as string | null,
  },
  {
    id: 'abc123',
    title: 'أحكام الصلاة',
    description: 'شرح أركان الصلاة وشروطها وواجباتها',
    category: 'فقه',
    thumbnailUrl: null as string | null,
    publishedAt: null as string | null,
  },
  {
    id: 'def456',
    title: 'قصة النبي يوسف عليه السلام',
    description: 'رحلة إيمانية مع أحسن القصص في القرآن الكريم',
    category: 'قصص الأنبياء',
    thumbnailUrl: null as string | null,
    publishedAt: null as string | null,
  },
  {
    id: 'ghi789',
    title: 'آداب طالب العلم',
    description: 'كيف يتأدب طالب العلم في طلبه ومجالسته للعلماء',
    category: 'تعليمي',
    thumbnailUrl: null as string | null,
    publishedAt: null as string | null,
  },
];

export default async function VideosPage() {
  const feed = await getYoutubeChannelFeed(24);
  const channelUrl = feed.channelId
    ? `https://www.youtube.com/channel/${feed.channelId}`
    : 'https://www.youtube.com/@zikr';

  const hasYoutubeVideos = feed.configured && !feed.error && feed.videos.length > 0;

  return (
    <Container className="py-12 space-y-12">
      {/* Hero */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold text-balance">الفيديوهات الإسلامية</h1>
        <p className="max-w-2xl mx-auto text-lg leading-8 arabic-muted text-pretty">
          شاهد أفضل المحتوى الإسلامي التعليمي والروحاني من قناة ذِكر على يوتيوب
        </p>
        <div className="flex justify-center gap-3">
          <Button href={channelUrl} variant="primary" target="_blank" rel="noopener noreferrer">
            زيارة قناة يوتيوب
          </Button>
          <Button href="/youtube" variant="secondary">
            تصفح القناة
          </Button>
        </div>
      </section>

      {/* YouTube Videos (if configured) */}
      {hasYoutubeVideos && (
        <section className="space-y-6">
          <SectionHeader title="أحدث الفيديوهات" subtitle="مباشرة من قناة ذِكر على يوتيوب" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {feed.videos.slice(0, 12).map((video) => (
              <a
                key={video.id}
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card className="overflow-hidden h-full flex flex-col hover:border-brand-gold/50 transition-all">
                  <div className="relative aspect-video bg-black/40">
                    {video.thumbnailUrl ? (
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-brand-gold/10">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-brand-gold/30">
                          <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2 flex-1">
                    <h3 className="text-sm font-semibold text-brand-cream line-clamp-2 group-hover:text-brand-gold transition-colors">
                      {video.title}
                    </h3>
                    {video.publishedAt && (
                      <p className="text-xs text-brand-cream/50">{formatDate(video.publishedAt)}</p>
                    )}
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* YouTube Playlists */}
      {feed.configured && !feed.error && feed.playlists.length > 0 && (
        <section className="space-y-6">
          <SectionHeader title="قوائم التشغيل" subtitle="سلاسل متكاملة من المحتوى الإسلامي" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {feed.playlists.slice(0, 6).map((playlist) => (
              <a
                key={playlist.id}
                href={`https://www.youtube.com/playlist?list=${playlist.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card className="overflow-hidden h-full flex flex-col hover:border-brand-gold/50 transition-all">
                  <div className="relative aspect-video bg-black/40">
                    {playlist.thumbnailUrl ? (
                      <Image
                        src={playlist.thumbnailUrl}
                        alt={playlist.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-brand-gold/10">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-brand-gold/30">
                          <path fillRule="evenodd" d="M2.625 6.75a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875 0A.75.75 0 0 1 8.25 6h12a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1-.75-.75ZM2.625 12a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0ZM7.5 12a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-12A.75.75 0 0 1 7.5 12Zm-4.875 5.25a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875 0a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2 flex-1">
                    <h3 className="text-sm font-semibold text-brand-cream line-clamp-2 group-hover:text-brand-gold transition-colors">
                      {playlist.title}
                    </h3>
                    {playlist.itemCount != null && (
                      <Badge variant="secondary">{playlist.itemCount} مقطع</Badge>
                    )}
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Featured Categories */}
      <section className="space-y-6">
        <SectionHeader title="تصنيفات الفيديوهات" subtitle="تصفح المحتوى حسب الموضوع" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'تفسير القرآن', count: 'شرح وتفسير الآيات الكريمة', href: '/quran', color: 'from-emerald-900/60' },
            { label: 'قصص الأنبياء', count: 'سير الأنبياء والرسل عليهم السلام', href: '/prophets', color: 'from-sky-900/60' },
            { label: 'الأحاديث', count: 'شرح الأحاديث النبوية الشريفة', href: '/hadith', color: 'from-amber-900/60' },
            { label: 'التربية والسلوك', count: 'الأخلاق وتزكية النفس', href: '/adhkar', color: 'from-violet-900/60' },
          ].map((cat) => (
            <Link key={cat.label} href={cat.href}>
              <Card className={`bg-gradient-to-br ${cat.color} to-black/40 hover:border-brand-gold/50 transition-all cursor-pointer h-full space-y-3`}>
                <h3 className="text-lg font-bold text-brand-gold">{cat.label}</h3>
                <p className="text-sm text-brand-cream/60 leading-relaxed">{cat.count}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Local Fallback Videos (shown when YouTube not configured) */}
      {!hasYoutubeVideos && (
        <section className="space-y-6">
          <SectionHeader title="محتوى مميز" subtitle="فيديوهات إسلامية مختارة" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {localVideos.map((video) => (
              <a
                key={video.id}
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card className="overflow-hidden h-full flex flex-col hover:border-brand-gold/50 transition-all">
                  <div className="aspect-video bg-brand-gold/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-brand-gold/40 group-hover:text-brand-gold/70 transition-colors">
                      <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z" />
                    </svg>
                  </div>
                  <div className="p-4 space-y-2 flex-1">
                    <Badge variant="outline" className="text-xs">{video.category}</Badge>
                    <h3 className="text-sm font-semibold text-brand-cream line-clamp-2 group-hover:text-brand-gold transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-xs text-brand-cream/50 line-clamp-2">{video.description}</p>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* YouTube Channel CTA */}
      <section>
        <Card className="p-8 text-center space-y-4 bg-brand-gold/5 border-brand-gold/20">
          <h2 className="text-2xl font-bold text-brand-gold">اشترك في قناة ذِكر</h2>
          <p className="max-w-xl mx-auto arabic-muted leading-7">
            تابع أحدث الفيديوهات والمحتوى الإسلامي على قناتنا الرسمية على يوتيوب
          </p>
          <div className="flex justify-center gap-3">
            <Button href={channelUrl} variant="primary" target="_blank" rel="noopener noreferrer">
              الاشتراك في القناة
            </Button>
            <Button href="/youtube" variant="secondary">
              عرض جميع الفيديوهات
            </Button>
          </div>
        </Card>
      </section>
    </Container>
  );
}
