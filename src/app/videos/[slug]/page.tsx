import type { Metadata } from 'next';
import { cache } from 'react';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getVideoBySlug } from '@/features/videos/services/videos';
import { pageMetadata } from '@/lib/site';

export const dynamic = 'force-dynamic';

const loadVideo = cache((slug: string) => getVideoBySlug(slug));

type VideoDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: VideoDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const video = await loadVideo(slug);
  if (!video) {
    return pageMetadata({
      title: 'الفيديو غير موجود',
      description: 'الفيديو المطلوب غير موجود.',
      path: `/videos/${slug}`,
      noindex: true,
    });
  }

  return pageMetadata({
    title: video.title,
    description: video.description ?? 'فيديو إسلامي من منصة ذِكر.',
    path: `/videos/${video.slug}`,
    // Embedded/republished video detail screens are not used as primary SEO
    // landing pages unless they contain substantial original editorial text.
    // The videos hub remains public while these detail URLs stay out of the
    // monetized search inventory.
    noindex: true,
    images: video.thumbnailUrl ? [video.thumbnailUrl] : undefined,
  });
}

export default async function VideoDetailPage({ params }: VideoDetailPageProps) {
  const { slug } = await params;
  const video = await loadVideo(slug);
  if (!video) {
    return (
      <Container className="py-16 max-w-3xl">
        <Card className="space-y-4 p-8 text-center">
          <h1 className="text-2xl font-bold text-brand-gold">الفيديو غير موجود</h1>
          <p className="leading-7 text-brand-cream/70">
            ربما حُذف الفيديو أو لم يعد متاحًا للعامة. يمكنك العودة إلى مكتبة الفيديوهات.
          </p>
          <div className="flex justify-center">
            <Button href="/videos" variant="secondary">العودة إلى الفيديوهات</Button>
          </div>
        </Card>
      </Container>
    );
  }

  const directVideoUrl =
    typeof video.metadata?.sourceVideoUrl === 'string'
      ? video.metadata.sourceVideoUrl
      : typeof video.metadata?.generatedVideoUrl === 'string'
        ? video.metadata.generatedVideoUrl
        : null;
  const publicCaption = typeof video.metadata?.caption === 'string' ? video.metadata.caption : null;

  return (
    <Container className="py-12 space-y-8 max-w-4xl">
      <Button href="/videos" variant="ghost">العودة إلى الفيديوهات</Button>

      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold">{video.title}</h1>
      </div>

      {video.youtubeId ? (
        <div className="w-full aspect-video rounded-lg overflow-hidden bg-black">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${video.youtubeId}`}
            title={video.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : directVideoUrl ? (
        <div className="w-full aspect-video rounded-lg overflow-hidden bg-black">
          <video
            className="h-full w-full object-contain"
            controls
            playsInline
            preload="metadata"
            poster={video.thumbnailUrl || undefined}
            src={directVideoUrl}
          >
            متصفحك لا يدعم تشغيل الفيديو.
          </video>
        </div>
      ) : null}

      <Card className="p-6 space-y-4 bg-black/30 border-brand-gold/30">
        <div className="flex justify-between items-center text-sm text-brand-cream/70">
          <span>{video.views} مشاهدة</span>
          {video.duration ? (
            <span>
              {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
            </span>
          ) : null}
        </div>
        {video.description ? (
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-brand-gold">الوصف</h3>
            <p className="text-brand-cream/90 leading-relaxed">{video.description}</p>
          </div>
        ) : null}
        {publicCaption && publicCaption !== video.description ? (
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-brand-gold">الكابشن</h3>
            <p className="text-brand-cream/90 leading-relaxed">{publicCaption}</p>
          </div>
        ) : null}
      </Card>
    </Container>
  );
}
