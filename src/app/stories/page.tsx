import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/ui/section-header';
import { getStories } from '@/features/stories/services/stories';
import { getYoutubeChannelFeed } from '@/lib/services/youtube';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';
import { PUBLIC_CONTENT_THRESHOLDS } from '@/lib/content-quality';

export const revalidate = 1800;

const MIN_PUBLIC_STORY_CHARS = PUBLIC_CONTENT_THRESHOLDS.story;

function hasSubstantialStoryContent(story: { content?: string }): boolean {
  return (story.content?.trim().length ?? 0) >= MIN_PUBLIC_STORY_CHARS;
}

export async function generateMetadata(): Promise<Metadata> {
  const stories = await getStories();
  const hasPublicStories = stories.some(hasSubstantialStoryContent);

  return pageMetadata({
    title: 'القصص الإسلامية',
    description: 'قصص الأنبياء والصحابة ووثائقيات التاريخ الإسلامي في مكتبة مرئية ومقروءة شاملة.',
    path: '/stories',
    noindex: !hasPublicStories,
  });
}

export default async function StoriesPage() {
  const [storiesResult, feed] = await Promise.all([
    getStories(),
    getYoutubeChannelFeed(12),
  ]);

  const stories = storiesResult.filter(hasSubstantialStoryContent);

  const categories = [
    { id: 'prophets', label: 'قصص الأنبياء', description: 'رحلات إيمانية ملهمة من حياة الأنبياء' },
    { id: 'sahaba', label: 'الصحابة', description: 'قصص التضحية والإيمان من حياة الصحابة' },
    { id: 'documentaries', label: 'وثائقيات', description: 'أفلام وثائقية عن الحضارة الإسلامية' },
    { id: 'history', label: 'تاريخ إسلامي', description: 'أحداث تاريخية مهمة في تاريخ الإسلام' },
  ];

  return (
    <Container className="space-y-12 py-10 text-right">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold">القصص والمحتوى المرئي</h1>
        <p className="max-w-3xl text-lg leading-8 arabic-muted">
          استكشف قصصاً أصلية ومكتملة من التاريخ الإسلامي، مع مراجع للتحقق ومحتوى مرئي داعم. لا تُعرض القصص للجمهور حتى تكتمل مادتها التحريرية.
        </p>
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="تصنيفات القصص"
          subtitle="اختر التصنيف الذي يناسب اهتمامك"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <Card key={cat.id} className="space-y-2 hover:border-brand-gold/50 transition-colors">
              <h2 className="text-lg font-semibold text-brand-gold">{cat.label}</h2>
              <p className="text-sm leading-6 arabic-muted">{cat.description}</p>
              <Badge variant="secondary">{stories.filter(s => s.category === cat.id).length} قصة</Badge>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="جميع القصص"
          subtitle="قصص مكتملة المراجعة التحريرية"
        />

        {stories.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="arabic-muted">لا توجد قصص منشورة مكتملة حالياً. تُنشر القصة بعد اكتمال المحتوى والمصادر.</p>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <Link href={`/stories/${story.slug}`} key={story.id}>
                <Card className="h-full space-y-4 hover:shadow-lg hover:border-brand-gold/40 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="secondary">
                      {categories.find(c => c.id === story.category)?.label || story.category}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-semibold text-brand-cream leading-8">
                    {story.title}
                  </h3>
                  {story.summary && (
                    <p className="line-clamp-3 text-sm leading-7 arabic-muted">
                      {story.summary}
                    </p>
                  )}
                  <Button variant="ghost" className="w-full">
                    قراءة القصة
                  </Button>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {feed.videos.length > 0 && (
        <section className="space-y-6">
          <SectionHeader
            title="فيديوهات مرتبطة"
            subtitle="محتوى مرئي من قناة اليوتيوب"
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {feed.videos.slice(0, 6).map((video) => (
              <Card key={video.id} className="space-y-3 overflow-hidden">
                <a
                  href={`https://www.youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  {video.thumbnailUrl ? (
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      width={640}
                      height={360}
                      className="aspect-video w-full rounded-xl object-cover hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="aspect-video rounded-xl bg-black/30 flex items-center justify-center">
                      <span className="arabic-muted">لا توجد صورة</span>
                    </div>
                  )}
                </a>
                <h3 className="font-semibold leading-7 text-brand-cream line-clamp-2">
                  {video.title}
                </h3>
                <p className="line-clamp-2 text-sm leading-6 arabic-muted">
                  {video.description}
                </p>
                <Button
                  href={`https://www.youtube.com/watch?v=${video.id}`}
                  variant="ghost"
                >
                  مشاهدة
                </Button>
              </Card>
            ))}
          </div>

          {feed.channelId && (
            <div className="text-center">
              <Button href={`https://www.youtube.com/channel/${feed.channelId}`} variant="secondary">
                زيارة قناة اليوتيوب
              </Button>
            </div>
          )}
        </section>
      )}

      {feed.playlists.length > 0 && (
        <section className="space-y-6">
          <SectionHeader
            title="قوائم التشغيل"
            subtitle="سلاسل متكاملة من المحتوى المرئي"
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {feed.playlists.slice(0, 6).map((playlist) => (
              <Card key={playlist.id} className="space-y-3">
                <a
                  href={`https://www.youtube.com/playlist?list=${playlist.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  {playlist.thumbnailUrl ? (
                    <Image
                      src={playlist.thumbnailUrl}
                      alt={playlist.title}
                      width={640}
                      height={360}
                      className="aspect-video w-full rounded-xl object-cover hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="aspect-video rounded-xl bg-black/30 flex items-center justify-center">
                      <span className="arabic-muted">لا توجد صورة</span>
                    </div>
                  )}
                </a>
                <h3 className="font-semibold leading-7 text-brand-cream">
                  {playlist.title}
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{playlist.itemCount ?? 0} فيديو</Badge>
                </div>
                <p className="line-clamp-2 text-sm leading-6 arabic-muted">
                  {playlist.description}
                </p>
                <Button
                  href={`https://www.youtube.com/playlist?list=${playlist.id}`}
                  variant="ghost"
                >
                  فتح القائمة
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="text-center space-y-4">
        <Card className="py-8 space-y-4">
          <h2 className="text-2xl text-brand-gold">مصادر القصص ومنهجية المراجعة</h2>
          <p className="arabic-muted max-w-2xl mx-auto leading-7">
            تُنشر القصة بعد اكتمال مادتها وبيان مصادرها الأصلية. يمكن مراجعة الروابط المرفقة داخل كل قصة والاطلاع على معايير التحرير والمصادر الخاصة بالمنصة.
          </p>
          <Button href="/editorial-policy" variant="secondary">
            معايير التحرير والمصادر
          </Button>
        </Card>
      </section>
    </Container>
  );
}
