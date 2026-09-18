import Image from 'next/image';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { Badge } from '@/components/ui/badge';
import { getYoutubeChannelFeed } from '@/features/videos/integrations/youtube';
import { FALLBACK_VIDEOS } from '@/lib/data/fallback-library';

export const metadata: Metadata = pageMetadata({
  title: 'الفيديوهات الإسلامية',
  description: 'شاهد أحدث الفيديوهات والمحتوى الإسلامي من قناة ذِكر على يوتيوب، أو استكشف المكتبة التعليمية المساندة.',
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

const fallbackGuideLinks: Record<string, string> = {
  fv1: '/quran', fv2: '/memorization', fv3: '/adhkar', fv4: '/stories/story-of-yusuf',
  fv5: '/hadith', fv6: '/prayer-times', fv7: '/articles', fv8: '/conquests', fv9: '/kids', fv10: '/dua',
};

export default async function VideosPage() {
  const feed = await getYoutubeChannelFeed(24);
  const channelUrl = feed.channelId
    ? `https://www.youtube.com/channel/${feed.channelId}`
    : 'https://www.youtube.com/@ZikrMediaOfficial';
  const hasYoutubeVideos = feed.configured && !feed.error && feed.videos.length > 0;
  const hasYoutubePlaylists = feed.configured && !feed.error && feed.playlists.length > 0;

  return (
    <Container className="py-12 space-y-12">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold text-balance">الفيديوهات الإسلامية</h1>
        <p className="max-w-2xl mx-auto text-lg leading-8 arabic-muted text-pretty">
          شاهد المحتوى الإسلامي التعليمي والروحاني من قناة ذِكر على يوتيوب، ومع عدم توفر البث المباشر نضع أمامك مواد تعليمية مرتبطة يمكن قراءتها فورًا دون اختلاق روابط فيديو.
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          <Button href={channelUrl} variant="primary" target="_blank" rel="noopener noreferrer">زيارة قناة يوتيوب</Button>
          <Button href="/youtube" variant="secondary">تصفح القناة</Button>
        </div>
      </section>

      {hasYoutubeVideos && (
        <section className="space-y-6">
          <SectionHeader title="أحدث الفيديوهات" subtitle="مباشرة من قناة ذِكر على يوتيوب" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {feed.videos.slice(0, 12).map((video) => (
              <a key={video.id} href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="group">
                <Card className="overflow-hidden h-full flex flex-col hover:border-brand-gold/50 transition-all">
                  <div className="relative aspect-video bg-black/40">
                    {video.thumbnailUrl ? <Image src={video.thumbnailUrl} alt={video.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-brand-gold/10" aria-hidden="true">▶</div>}
                  </div>
                  <div className="p-4 space-y-2 flex-1"><h3 className="text-sm font-semibold text-brand-cream line-clamp-2 group-hover:text-brand-gold transition-colors">{video.title}</h3>{video.publishedAt && <p className="text-xs text-brand-cream/50">{formatDate(video.publishedAt)}</p>}</div>
                </Card>
              </a>
            ))}
          </div>
        </section>
      )}

      {hasYoutubePlaylists && (
        <section className="space-y-6">
          <SectionHeader title="قوائم التشغيل" subtitle="سلاسل متكاملة من المحتوى الإسلامي" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {feed.playlists.slice(0, 6).map((playlist) => (
              <a key={playlist.id} href={`https://www.youtube.com/playlist?list=${playlist.id}`} target="_blank" rel="noopener noreferrer" className="group">
                <Card className="overflow-hidden h-full flex flex-col hover:border-brand-gold/50 transition-all">
                  <div className="relative aspect-video bg-black/40">
                    {playlist.thumbnailUrl ? <Image src={playlist.thumbnailUrl} alt={playlist.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-brand-gold/10" aria-hidden="true">☰</div>}
                  </div>
                  <div className="p-4 space-y-2 flex-1"><h3 className="text-sm font-semibold text-brand-cream line-clamp-2 group-hover:text-brand-gold transition-colors">{playlist.title}</h3>{playlist.itemCount != null && <Badge variant="secondary">{playlist.itemCount} مقطع</Badge>}</div>
                </Card>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-6">
        <SectionHeader title="المكتبة التعليمية المصاحبة" subtitle="10 مواد مرتبة للقراءة والتعلم إلى أن تتوفر فيديوهات القناة من المصدر الرسمي" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FALLBACK_VIDEOS.map((item) => (
            <Link key={item.id} href={fallbackGuideLinks[item.id] ?? '/search'} className="group">
              <Card className="h-full flex flex-col hover:border-brand-gold/50 transition-all">
                <div className="h-32 flex items-center justify-center bg-gradient-to-br from-brand-gold/10 to-brand-emerald/10 text-5xl" aria-hidden="true">▶</div>
                <div className="p-5 space-y-3 flex-1"><Badge variant="outline">مادة تعليمية</Badge><h2 className="text-lg font-bold text-brand-gold leading-snug group-hover:text-brand-goldSoft">{item.title}</h2><p className="text-sm leading-7 arabic-muted">{item.description}</p><span className="inline-flex text-sm text-brand-cream/80 group-hover:text-brand-gold">فتح المادة ←</span></div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader title="تصنيفات المحتوى المرئي" subtitle="تصفح المحتوى حسب الموضوع" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'تفسير القرآن', count: 'شرح وتفسير الآيات الكريمة', href: '/quran', color: 'from-emerald-900/60' },
            { label: 'قصص الأنبياء', count: 'سير الأنبياء والرسل عليهم السلام', href: '/prophets', color: 'from-sky-900/60' },
            { label: 'الأحاديث', count: 'شرح الأحاديث النبوية الشريفة', href: '/hadith', color: 'from-amber-900/60' },
            { label: 'التربية والسلوك', count: 'الأخلاق وتزكية النفس', href: '/adhkar', color: 'from-violet-900/60' },
          ].map((cat) => <Link key={cat.label} href={cat.href}><Card className={`bg-gradient-to-br ${cat.color} to-black/40 hover:border-brand-gold/50 transition-all cursor-pointer h-full space-y-3`}><h3 className="text-lg font-bold text-brand-gold">{cat.label}</h3><p className="text-sm text-brand-cream/60 leading-relaxed">{cat.count}</p></Card></Link>)}
        </div>
      </section>

      {!hasYoutubeVideos && !hasYoutubePlaylists && (
        <Card className="p-8 text-center border-brand-gold/20 bg-brand-gold/5">
          <h2 className="text-2xl font-bold text-brand-gold">فيديوهات القناة الرسمية</h2>
          <p className="max-w-2xl mx-auto mt-3 leading-8 arabic-muted">عند توفر بيانات قناة يوتيوب الرسمية، ستظهر الفيديوهات وقوائم التشغيل تلقائيًا من المصدر. حتى ذلك الحين لا نضع روابط فيديو مختلقة، والمكتبة التعليمية أعلاه تظل متاحة للمستخدم مباشرة.</p>
          <div className="mt-5 flex justify-center gap-3 flex-wrap"><Button href={channelUrl} variant="secondary" target="_blank" rel="noopener noreferrer">فتح القناة الرسمية</Button><Button href="/contact" variant="ghost">التواصل مع فريق ذِكر</Button></div>
        </Card>
      )}

      <section><Card className="p-8 text-center space-y-4 bg-brand-gold/5 border-brand-gold/20"><h2 className="text-2xl font-bold text-brand-gold">تابع قناة ذِكر</h2><p className="max-w-xl mx-auto arabic-muted leading-7">تابع أحدث الفيديوهات والمحتوى الإسلامي على قناتنا الرسمية على يوتيوب.</p><div className="flex justify-center gap-3 flex-wrap"><Button href={channelUrl} variant="primary" target="_blank" rel="noopener noreferrer">الاشتراك في القناة</Button><Button href="/youtube" variant="secondary">عرض جميع الفيديوهات</Button></div></Card></section>
    </Container>
  );
}
