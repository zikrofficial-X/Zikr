import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { pageMetadata } from "@/lib/site";
import { getVideos } from "@/features/videos/services/videos";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "مكتبة فيديوهات ذِكر",
  description: "مكتبة الفيديوهات المنتجة والمحفوظة داخل منصة ذِكر.",
  path: "/videos",
});

function mediaUrl(metadata: Record<string, unknown> | undefined): string | null {
  const value = metadata?.generatedVideoUrl;
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(date);
}

export default async function VideosPage() {
  const stored = await getVideos(undefined, 100);
  const videos = stored.filter((video) =>
    video.metadata?.generator === "zikr_internal_video_factory" &&
    !video.youtubeId &&
    Boolean(mediaUrl(video.metadata)),
  );

  return (
    <Container className="space-y-8 py-10">
      <header className="space-y-4 text-center">
        <Badge variant="outline" className="mx-auto">المكتبة الداخلية</Badge>
        <h1 className="text-4xl font-bold text-brand-gold">فيديوهات ذِكر</h1>
        <p className="mx-auto max-w-3xl text-base leading-8 text-brand-cream/65">
          الفيديوهات التي ينتجها محرك ذِكر وتُحفظ داخل المنصة. لا تعتمد هذه المكتبة على مزامنة حسابات خارجية.
        </p>
      </header>

      {videos.length ? (
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => {
            const source = mediaUrl(video.metadata);
            if (!source) return null;
            return (
              <Card key={video.id} className="overflow-hidden">
                <div className="aspect-video bg-black">
                  <video
                    className="h-full w-full object-contain"
                    controls
                    playsInline
                    preload="none"
                    src={source}
                    aria-label={video.title}
                  >
                    متصفحك لا يدعم تشغيل الفيديو.
                  </video>
                </div>
                <div className="space-y-3 p-4">
                  <h2 className="line-clamp-2 font-semibold text-brand-cream">{video.title}</h2>
                  {video.description ? (
                    <p className="line-clamp-3 text-sm leading-6 text-brand-cream/55">{video.description}</p>
                  ) : null}
                  <div className="flex items-center justify-between gap-3 text-xs text-brand-cream/45">
                    <span>{formatDate(video.createdAt)}</span>
                    <span>{video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, "0")}` : ""}</span>
                  </div>
                  <Link href={`/videos/${video.slug}`} className="inline-flex text-sm text-brand-gold underline-offset-4 hover:underline">
                    صفحة الفيديو
                  </Link>
                </div>
              </Card>
            );
          })}
        </section>
      ) : (
        <Card className="space-y-3 p-8 text-center">
          <h2 className="text-xl font-semibold text-brand-gold">لا توجد فيديوهات داخلية منشورة بعد</h2>
          <p className="mx-auto max-w-2xl leading-7 text-brand-cream/60">
            عند اكتمال التوليد واجتياز فحوص الجودة، سيظهر الفيديو هنا تلقائيًا بعد تسجيله ونشره داخل ZIKR.
          </p>
        </Card>
      )}
    </Container>
  );
}
