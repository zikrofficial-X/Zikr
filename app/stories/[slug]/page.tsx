import { getStoryBySlug } from "@/lib/services/stories";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";

interface StoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  let title = "قصة";
  let description = "اقرأ القصة كاملة في منصة ZIKR للمحتوى الإسلامي.";
  try {
    const story = await getStoryBySlug(slug);
    if (story) {
      title = story.title;
      if (story.summary) description = story.summary.slice(0, 160);
    }
  } catch {
    // fall back to generic metadata
  }
  return pageMetadata({ title, description, path: `/stories/${slug}` });
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);

  if (!story) {
    notFound();
  }

  const youtubeId =
    typeof story.metadata?.youtubeId === "string"
      ? story.metadata.youtubeId
      : null;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button href="/stories" variant="ghost" className="mb-6">
        <ChevronLeft className="ml-2 h-4 w-4" />
        العودة إلى القصص
      </Button>

      <div className="flex flex-col gap-8">
        <div className="space-y-4">
          <Badge>{story.category}</Badge>
          <h1 className="text-4xl font-bold">{story.title}</h1>
          <p className="text-xl text-muted-foreground">{story.summary}</p>
        </div>

        {youtubeId && (
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-muted shadow-lg">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title={story.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            ></iframe>
          </div>
        )}

        <div className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-wrap">
          {story.content}
        </div>

        {story.primarySources && story.primarySources.length > 0 && (
          <section aria-labelledby="story-sources" className="rounded-2xl border border-brand-gold/20 bg-black/10 p-6">
            <h2 id="story-sources" className="mb-4 text-2xl font-semibold text-brand-gold">
              المصادر الأصلية والمراجع
            </h2>
            <p className="mb-4 leading-7 text-muted-foreground">
              هذه الروابط تساعدك على الرجوع إلى النص أو المصدر الأساسي. لم تُنشأ هذه المراجع بدل النص الأصلي، ولا تغني عن مراجعة الآيات والأحاديث في مواضعها.
            </p>
            <ul className="space-y-3">
              {story.primarySources.map((source) => (
                <li key={`${source.type}-${source.url}`}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-brand-gold underline underline-offset-4 hover:bg-brand-gold/10"
                  >
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
