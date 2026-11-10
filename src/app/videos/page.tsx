import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { getInternalGeneratedVideos } from "@/features/videos/services/videos";
import { getYoutubeChannelFeed } from "@/features/videos/integrations/youtube";
import { YoutubeFeedCard } from "@/features/videos/components/youtube-feed-card";
import { getFacebookPublicProfile } from "@/features/social/services/facebook-credentials";
import { getFacebookPublishedPosts } from "@/features/social/services/facebook-public-posts";
import { getServerEnv } from "@/lib/env";
import { pageMetadata } from "@/lib/site";
import { getRequestLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const isEnglish = locale === "en";
  return pageMetadata({
    title: isEnglish ? "ZIKR Videos & Social Channels" : "فيديوهات ذِكر وقنوات التواصل",
    description: isEnglish
      ? "Watch ZIKR videos and the latest videos from its official YouTube channel, and follow the official social pages."
      : "شاهد فيديوهات ذِكر والفيديوهات الحديثة من قناة YouTube الرسمية، وتابع صفحات ذِكر على منصات التواصل.",
    path: "/videos",
  });
}

export const dynamic = "force-dynamic";

function formatDate(value?: string | null): string {
  if (!value) return "";
  try { return new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(new Date(value)); }
  catch { return ""; }
}

function resolveFacebookPageUrl(profileUrl: string | null, pageIdValue: string | undefined): string | null {
  if (profileUrl) {
    try {
      const parsed = new URL(profileUrl);
      const host = parsed.hostname.toLowerCase();
      if (
        parsed.protocol === "https:" &&
        (host === "facebook.com" || host.endsWith(".facebook.com")) &&
        !parsed.username &&
        !parsed.password
      ) {
        return parsed.toString();
      }
    } catch {
      // Fall back to the separately configured Page identifier.
    }
  }
  const pageId = pageIdValue?.trim() ?? "";
  return /^[A-Za-z0-9._-]{5,128}$/.test(pageId)
    ? "https://www.facebook.com/" + encodeURIComponent(pageId)
    : null;
}

export default async function VideosPage() {
  const locale = await getRequestLocale();
  const isEnglish = locale === "en";
  const [videos, youtubeFeed, facebookProfile, facebookPosts] = await Promise.all([
    getInternalGeneratedVideos(60),
    getYoutubeChannelFeed(24),
    getFacebookPublicProfile(),
    getFacebookPublishedPosts(6),
  ]);
  const facebookPageUrl = resolveFacebookPageUrl(facebookProfile?.pageUrl ?? null, getServerEnv().FACEBOOK_PAGE_ID);
  const youtubeChannelUrl = youtubeFeed.channel?.pageUrl
    ?? (youtubeFeed.channelId ? "https://www.youtube.com/channel/" + encodeURIComponent(youtubeFeed.channelId) : null);

  return (
    <Container className="space-y-10 py-10">
      <header className="space-y-4 text-center">
        <Badge variant="outline" className="mx-auto">{isEnglish ? "ZIKR Media Hub" : "مركز ذِكر المرئي"}</Badge>
        <h1 className="text-4xl font-bold text-brand-gold text-balance">{isEnglish ? "ZIKR Videos & Social Channels" : "فيديوهات ذِكر وقنوات التواصل"}</h1>
        <p className="mx-auto max-w-3xl text-lg leading-8 arabic-muted">
          {isEnglish
            ? "Watch original ZIKR videos and the latest public videos from our official YouTube channel. Follow our social pages and open each platform to like, subscribe, and interact with your own account."
            : "شاهد إنتاج ذِكر الأصلي وأحدث فيديوهات قناة YouTube الرسمية من داخل الموقع. تابع صفحاتنا، وافتح المنصة لتسجيل الإعجاب والاشتراك بحسابك الشخصي."}
        </p>
      </header>

      {(youtubeChannelUrl || facebookPageUrl) ? (
        <section className="space-y-5" aria-label={isEnglish ? "Official social channels" : "قنوات ذِكر الرسمية"}>
          <SectionHeader
            title={isEnglish ? "Follow ZIKR" : "تابع ذِكر على منصات التواصل"}
            subtitle={isEnglish ? "Official channels connected to this video library" : "القنوات الرسمية المرتبطة بمكتبة الفيديوهات"}
          />
          <div className="grid gap-5 md:grid-cols-2">
            {youtubeChannelUrl ? (
              <Card className="space-y-3 p-5">
                <div className="flex items-center gap-3">
                  {youtubeFeed.channel?.avatarUrl ? (
                    <Image src={youtubeFeed.channel.avatarUrl} alt={youtubeFeed.channel.name} width={56} height={56} className="rounded-full" unoptimized />
                  ) : <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-2xl text-red-400">▶</span>}
                  <div className="min-w-0">
                    <h2 className="font-bold text-brand-cream">{youtubeFeed.channel?.name || (isEnglish ? "Official YouTube channel" : "قناة ذِكر الرسمية على YouTube")}</h2>
                    <p className="text-xs text-brand-cream/50">
                      {youtubeFeed.channel?.subscriberCount != null
                        ? youtubeFeed.channel.subscriberCount.toLocaleString(isEnglish ? "en" : "ar") + (isEnglish ? " subscribers" : " مشترك")
                        : (isEnglish ? "Official channel" : "القناة الرسمية")}
                    </p>
                  </div>
                </div>
                {youtubeFeed.channel?.description ? <p className="line-clamp-3 text-sm leading-6 text-brand-cream/60">{youtubeFeed.channel.description}</p> : null}
                <a href={youtubeChannelUrl + (youtubeChannelUrl.includes("?") ? "&" : "?") + "sub_confirmation=1"} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-lg border border-brand-gold/40 px-4 py-2 text-sm font-semibold text-brand-gold hover:bg-brand-gold/10">
                  {isEnglish ? "Subscribe to YouTube" : "اشترك في قناة YouTube"}
                </a>
              </Card>
            ) : null}
            {facebookPageUrl ? (
              <Card className="space-y-3 p-5">
                <div className="flex items-center gap-3">
                  {facebookProfile?.avatarUrl ? (
                    <Image src={facebookProfile.avatarUrl} alt={facebookProfile.name} width={56} height={56} className="rounded-full" unoptimized />
                  ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/15 text-2xl font-bold text-blue-400">f</span>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-bold text-brand-cream">{facebookProfile?.name || (isEnglish ? "ZIKR on Facebook" : "صفحة ذِكر على Facebook")}</h2>
                    <p className="text-xs text-brand-cream/50">
                      {facebookProfile?.followersCount != null
                        ? facebookProfile.followersCount.toLocaleString(isEnglish ? "en" : "ar") + (isEnglish ? " followers" : " متابع")
                        : (isEnglish ? "Official Facebook Page" : "الصفحة الرسمية لذِكر")}
                    </p>
                  </div>
                </div>
                <a href={facebookPageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-lg border border-brand-gold/40 px-4 py-2 text-sm font-semibold text-brand-gold hover:bg-brand-gold/10">
                  {isEnglish ? "Follow / Like Facebook Page" : "تابع وأعجب بصفحة Facebook"}
                </a>
              </Card>
            ) : null}
          </div>
          <Card className="space-y-4 p-4">
            <h2 className="font-semibold text-brand-cream">{isEnglish ? "Latest Facebook Page posts" : "أحدث منشورات صفحة ذِكر على Facebook"}</h2>
            {facebookPosts.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {facebookPosts.map((post) => (
                  <article key={post.id} className="overflow-hidden rounded-xl border border-brand-gold/10 bg-black/20">
                    {post.imageUrl ? (
                      <div className="relative aspect-video bg-black/30">
                        <Image src={post.imageUrl} alt={post.title} fill unoptimized sizes="(max-width: 767px) 100vw, 50vw" className="object-cover" />
                      </div>
                    ) : null}
                    <div className="space-y-3 p-4">
                      <h3 className="font-semibold leading-7 text-brand-gold">{post.title}</h3>
                      {post.body ? <p className="whitespace-pre-line text-sm leading-7 text-brand-cream/65 line-clamp-6">{post.body}</p> : null}
                      {post.videoUrl ? <a href={post.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex text-sm text-brand-gold underline">{isEnglish ? "Watch attached video" : "مشاهدة الفيديو المرفق"}</a> : null}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-gold/10 pt-3 text-xs text-brand-cream/45">
                        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                        <a href={post.facebookUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-gold underline">{isEnglish ? "Open on Facebook" : "عرض المنشور على Facebook"}</a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-brand-gold/10 bg-black/20 p-4 text-sm leading-7 text-brand-cream/55">
                {isEnglish ? "No confirmed Facebook publications are available yet. Open the official page to see its latest activity." : "لا توجد منشورات مؤكدة من سجل النشر حاليًا. افتح الصفحة الرسمية لمشاهدة أحدث نشاطها."}
              </p>
            )}
          </Card>
        </section>
      ) : null}

      {youtubeFeed.videos.length ? (
        <section className="space-y-6">
          <SectionHeader
            title={isEnglish ? "Latest from our YouTube channel" : "أحدث فيديوهات قناة ذِكر على YouTube"}
            subtitle={isEnglish ? youtubeFeed.videos.length + " public channel videos" : youtubeFeed.videos.length + " فيديو من القناة الرسمية"}
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {youtubeFeed.videos.map((video) => (
              <YoutubeFeedCard
                key={video.id}
                videoId={video.id}
                title={video.title}
                thumbnailUrl={video.thumbnailUrl}
                publishedLabel={formatDate(video.publishedAt)}
              />
            ))}
          </div>
          {youtubeFeed.stale || youtubeFeed.error ? (
            <p className="text-xs text-brand-cream/45">{isEnglish ? "Showing the latest cached channel data while synchronization is temporarily unavailable." : "نعرض آخر بيانات محفوظة للقناة لحين عودة المزامنة."}</p>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-6">
        <SectionHeader
          title={isEnglish ? "Original ZIKR videos" : "فيديوهات ذِكر الأصلية"}
          subtitle={isEnglish ? videos.length + " videos published inside ZIKR" : "عدد الفيديوهات المنشورة داخل ذِكر: " + videos.length}
        />

        {videos.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <Link href={"/videos/" + video.slug} key={video.id} className="block h-full">
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
                    <span className="absolute bottom-3 left-3 rounded-full bg-black/75 px-3 py-1 text-xs text-brand-gold">{isEnglish ? "On ZIKR" : "داخل ذِكر"}</span>
                  </div>
                  <div className="space-y-2 p-4">
                    <h2 className="line-clamp-2 font-semibold text-brand-cream">{video.title}</h2>
                    {video.description ? <p className="line-clamp-2 text-sm leading-6 text-brand-cream/55">{video.description}</p> : null}
                    <div className="flex items-center justify-between gap-3 text-xs text-brand-cream/40">
                      <span>{formatDate(video.createdAt)}</span>
                      {video.duration ? <span>{Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, "0")}</span> : null}
                    </div>
                    <Button variant="ghost" size="sm" className="px-0 text-brand-gold">{isEnglish ? "Watch video" : "شاهد الفيديو"}</Button>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="space-y-4 p-8 text-center">
            <h2 className="text-2xl font-bold text-brand-gold">{isEnglish ? "No original videos have been published yet" : "لا توجد فيديوهات أصلية منشورة حاليًا"}</h2>
            <p className="mx-auto max-w-2xl leading-8 text-brand-cream/65">
              {isEnglish ? "The video factory runs on its configured schedule. New videos will appear here after generation and quality checks." : "يعمل مصنع الفيديوهات وفق الجدول المحدد. ستظهر الفيديوهات الجديدة هنا بعد اكتمال التوليد وفحوص الجودة."}
            </p>
          </Card>
        )}
      </section>
    </Container>
  );
}
