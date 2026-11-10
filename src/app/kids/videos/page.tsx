import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { getKidsGeneratedVideos } from "@/features/videos/services/videos";
import { pageMetadata } from "@/lib/site";
import { getRequestLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "فيديوهات ذِكر للأطفال",
    description: "قصص فيديو تعليمية آمنة ومخصصة للأطفال في عالم ذِكر.",
    path: "/kids/videos",
    noindex: true,
  });
}

export default async function KidsVideosPage() {
  const [videos, locale] = await Promise.all([getKidsGeneratedVideos(60), getRequestLocale()]);
  const isEnglish = locale === "en";

  return (
    <main dir={isEnglish ? "ltr" : "rtl"}>
      <Container className="space-y-8 py-10">
        <Link href="/kids" className="text-sm font-bold text-brand-gold">
          {isEnglish ? "← Back to ZIKR Kids" : "العودة إلى عالم الأطفال"}
        </Link>
        <header className="space-y-3">
          <p className="text-sm font-bold text-brand-emerald">{isEnglish ? "ZIKR Kids Library" : "مكتبة الأطفال"}</p>
          <h1 className="text-3xl font-black text-brand-gold sm:text-4xl">
            {isEnglish ? "Stories made for young viewers" : "قصص فيديو مخصصة للأطفال"}
          </h1>
          <p className="max-w-2xl leading-8 text-brand-cream/70">
            {isEnglish
              ? "A separate child-friendly library. These videos are kept out of the general video feed."
              : "مكتبة مستقلة لمحتوى الأطفال، منفصلة عن مكتبة الفيديوهات العامة."}
          </p>
        </header>

        {videos.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <Link key={video.id} href={"/kids/videos/" + encodeURIComponent(video.slug)} className="block h-full">
                <Card className="h-full overflow-hidden transition hover:border-brand-gold/50">
                  <div className="relative aspect-video bg-black/40">
                    <Image
                      src={video.thumbnailUrl || "/branding/og-image.jpg"}
                      alt={video.title}
                      fill
                      unoptimized
                      sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                      className="object-cover"
                    />
                    <span className="absolute bottom-3 start-3 rounded-full bg-black/75 px-3 py-1 text-xs font-bold text-brand-gold">
                      {isEnglish ? "Kids" : "للأطفال"}
                    </span>
                  </div>
                  <div className="space-y-2 p-4">
                    <h2 className="line-clamp-2 font-bold text-brand-cream">{video.title}</h2>
                    {video.description ? <p className="line-clamp-2 text-sm leading-6 text-brand-cream/60">{video.description}</p> : null}
                    <span className="inline-block pt-2 text-sm font-bold text-brand-gold">
                      {isEnglish ? "Watch story" : "شاهد القصة"}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <h2 className="text-xl font-bold text-brand-gold">{isEnglish ? "No videos are available yet" : "لا توجد فيديوهات متاحة حاليًا"}</h2>
            <p className="mt-3 leading-7 text-brand-cream/65">{isEnglish ? "New stories will appear here after they pass the quality checks." : "ستظهر القصص الجديدة هنا بعد اجتياز فحوص الجودة."}</p>
          </Card>
        )}
      </Container>
    </main>
  );
}
