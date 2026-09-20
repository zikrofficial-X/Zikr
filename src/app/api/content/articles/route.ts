import { NextRequest, NextResponse } from "next/server";
import { getArticles, type Article } from "@/features/articles/services/articles";

type ArticleSearchItem = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  author: string | null;
  category_id: string | null;
  created_at: string;
};

const MAX_SEARCH_LENGTH = 120;

function toSearchItem(article: Article): ArticleSearchItem {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    summary: article.summary ?? null,
    author: article.author ?? null,
    category_id: article.categoryId ?? null,
    created_at: article.createdAt,
  };
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length > MAX_SEARCH_LENGTH) {
    return NextResponse.json(
      { error: "Search query is too long." },
      { status: 400 },
    );
  }

  try {
    const articles = await getArticles(undefined, query ? 100 : 60);
    const normalizedQuery = query.toLocaleLowerCase("ar");

    const matches = query
      ? articles.filter((article) =>
          [
            article.title,
            article.summary ?? "",
            article.content ?? "",
            ...(article.tags ?? []),
          ].some((value) =>
            value.toLocaleLowerCase("ar").includes(normalizedQuery),
          ),
        )
      : articles;

    return NextResponse.json(
      matches.slice(0, query ? 12 : 60).map(toSearchItem),
      {
        headers: {
          "Cache-Control":
            "public, max-age=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("[api/content/articles] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 },
    );
  }
}
