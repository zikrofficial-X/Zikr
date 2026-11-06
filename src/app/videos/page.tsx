import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { getInternalGeneratedVideos } from "@/features/videos/services/videos";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "مكتبة فيديوهات ذِكر",
  description: "مكتبة الفيديوهات التي ينتجها فريق ذِكر آليًا وتُنشر داخل الموقع بعد اجتياز فحوص الجودة.",
  path: "/videos",
});

export const dynamic = "force-dynamic";

function formatDate(value?: string): string {
  if (!value) return "";
  try { return new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(new Date(value)); }
  catch { return ""; }
}

export default async function VideosPage() {
  const videos = await getInternalGeneratedVideos(60);
  return (
    <Container className="space-y-10 py-10">
      <header className="space-y-4 text-center">
        <Badge variant="outline" className="mx-auto">إنتاج داخلي</Badge>
        <h1 className="text-4xl font-bold text-brand-gold text-balance">مكتبة فيديوهات ذِكر</h1>
        <p className="mx-auto max-w-3xl text-lg leading-8 arabic-muted">
          فيديوهات تُولّد وتُراجع وتُحفظ داخل منصة ذِكر، ثم تُنشر تلقائيًا في هذه المكتبة. لا تعتمد المكتبة على حسابات أو منصات تواصل خارجية.
        </p>
      </header>

      {videos.length ? (
        <section className="space-y-6">
          <SectionHeader title="أحدث الفيديوهات" subtitle={`عدد الفيديوهات المنشورة داخل ذِكر: ${videos.length}`} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <Link href={`/videos/${video.slug}`} key={video.id} className="block h-full">
                <Card className="h-full overflow-hidden transition hover:border-brand-gold/40">
                  <div className="relative aspect-video bg-black/40">
                    {video.thumbnailUrl ? (
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title}
                        fill
                        unoptimized
                        sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl text-brand-gold/40">▶</div>
                    )}
                    <span className="absolute bottom-3 left-3 rounded-full bg-black/75 px-3 py-1 text-xs text-brand-gold">داخل ذِكر</span>
                  </div>
                  <div className="space-y-2 p-4">
                    <h2 className="line-clamp-2 font-semibold text-brand-cream">{video.title}</h2>
                    {video.description ? <p className="line-clamp-2 text-sm leading-6 text-brand-cream/55">{video.description}</p> : null}
                    <div className="flex items-center justify-between gap-3 text-xs text-brand-cream/40">
                      <span>{formatDate(video.createdAt)}</span>
                      {video.duration ? <span>{Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, "0")}</span> : null}
                    </div>
                    <Button variant="ghost" size="sm" className="px-0 text-brand-gold">شاهد الفيديو</Button>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <Card className="space-y-4 p-8 text-center">
          <h2 className="text-2xl font-bold text-brand-gold">لا توجد فيديوهات منشورة حاليًا</h2>
          <p className="mx-auto max-w-2xl leading-8 text-brand-cream/65">
            يعمل مولّد الفيديوهات تلقائيًا وفق الجدول المحدد. بعد اكتمال التوليد وفحوص الجودة، ستظهر الفيديوهات هنا دون رفعها إلى أي منصة خارجية.
          </p>
        </Card>
      )}
    </Container>
  );
}
