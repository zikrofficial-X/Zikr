import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { getKidsGeneratedVideoBySlug } from "@/features/videos/services/videos";
import { pageMetadata } from "@/lib/site";
import { resolveVideoMediaUrl } from "@/features/videos/services/video-media-contract";

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
  const storyText = typeof metadata.storyText === "string" ? metadata.storyText : "";
  const socialCaption = typeof metadata.socialCaption === "string" ? metadata.socialCaption : "";
  const socialPublication = metadata.socialPublication && typeof metadata.socialPublication === "object" && !Array.isArray(metadata.socialPublication)
    ? metadata.socialPublication as { status?: unknown; platforms?: unknown }
    : null;
  const publishedPlatforms = Array.isArray(socialPublication?.platforms)
    ? socialPublication.platforms.filter((platform): platform is string => typeof platform === "string")
    : [];
  const mediaUrl = resolveVideoMediaUrl({
    youtube_id: video.youtubeId,
    metadata,
  });

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
        {storyText ? (
          <Card className="space-y-3 border-brand-gold/20 bg-brand-gold/[.04] p-6">
            <h2 className="text-xl font-black text-brand-gold">الحكاية كاملة</h2>
            <p className="whitespace-pre-wrap text-base leading-8 text-brand-cream/85">{storyText}</p>
          </Card>
        ) : null}
        {socialCaption ? (
          <Card className="space-y-3 border-brand-emerald/20 bg-brand-emerald/[.04] p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-black text-brand-gold">منشور السوشيال ميديا</h2>
              {publishedPlatforms.length > 0 && (
                <span className="text-xs font-bold text-brand-emerald">
                  {socialPublication?.status === "published" ? "نُشر على " : "نُشر جزئيًا على "}
                  {publishedPlatforms.map((platform) => platform === "facebook_reels" ? "ريلز فيسبوك" : platform === "facebook" ? "فيسبوك" : platform === "youtube" ? "يوتيوب" : platform).join("، ")}
                </span>
              )}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-7 text-brand-cream/80">{socialCaption}</p>
          </Card>
        ) : null}
      </Container>
    </main>
  );
}
