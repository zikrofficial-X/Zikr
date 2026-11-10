import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { getKidsGeneratedVideoBySlug } from "@/features/videos/services/videos";
import { pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";
const loadVideo = cache((slug: string) => getKidsGeneratedVideoBySlug(slug));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const video = await loadVideo(slug);
  return pageMetadata({
    title: video?.title ?? "فيديو أطفال غير موجود",
    description: video?.description ?? "فيديو من مكتبة الأطفال في ذِكر.",
    path: "/kids/videos/" + slug,
    noindex: true,
    images: video?.thumbnailUrl ? [video.thumbnailUrl] : undefined,
  });
}

export default async function KidsVideoDetailPage({ params }: Props) {
  const { slug } = await params;
  const video = await loadVideo(slug);
  if (!video) {
    return (
      <Container className="py-14">
        <Card className="space-y-4 p-8 text-center">
          <h1 className="text-xl font-bold text-brand-gold">الفيديو غير متاح</h1>
          <Link href="/kids/videos" className="font-bold text-brand-cream">العودة إلى مكتبة الأطفال</Link>
        </Card>
      </Container>
    );
  }

  const metadata = video.metadata ?? {};
  const candidate = [metadata.generatedVideoUrl, metadata.videoUrl, metadata.video_url, metadata.sourceVideoUrl]
    .find((value): value is string => typeof value === "string" && value.trim().length > 0);
  let mediaUrl: string | null = null;
  if (candidate) {
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === "https:" && parsed.hostname === "res.cloudinary.com" && parsed.pathname.includes("/video/upload/")) {
        mediaUrl = parsed.toString();
      }
    } catch {
      mediaUrl = null;
    }
  }

  return (
    <main>
      <Container className="max-w-4xl space-y-7 py-10">
        <Link href="/kids/videos" className="text-sm font-bold text-brand-gold">العودة إلى قصص الأطفال</Link>
        <h1 className="text-3xl font-black leading-relaxed text-brand-gold">{video.title}</h1>
        {video.youtubeId ? (
          <div className="aspect-video overflow-hidden rounded-2xl bg-black">
            <iframe
              className="h-full w-full"
              src={"https://www.youtube-nocookie.com/embed/" + encodeURIComponent(video.youtubeId)}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : mediaUrl ? (
          <div className="overflow-hidden rounded-2xl bg-black">
            <video className="aspect-video w-full object-contain" controls playsInline preload="metadata" poster={video.thumbnailUrl} src={mediaUrl}>
              متصفحك لا يدعم تشغيل الفيديو.
            </video>
          </div>
        ) : (
          <Card className="p-6 text-center text-brand-cream/70">ملف الفيديو غير متاح حاليًا.</Card>
        )}
        {video.description ? <Card className="p-6 leading-8 text-brand-cream/85">{video.description}</Card> : null}
      </Container>
    </main>
  );
}
