'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useTransition } from 'react';
import { surahs, hadiths, prophets } from '@/lib/data/content';
import type { Surah, Hadith, Prophet } from '@/lib/data/content';

type Result = {
  type: 'surah' | 'hadith' | 'prophet' | 'article';
  labelAr: string;
  title: string;
  subtitle: string;
  href: string;
};

type ArticleSearchItem = {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  author?: string | null;
};

function runStaticSearch(query: string): Result[] {
  if (!query.trim()) return [];
  const q = query.trim().toLowerCase();

  const surahResults: Result[] = surahs
    .filter((s: Surah) => s.nameAr.includes(q) || s.nameEn.toLowerCase().includes(q))
    .slice(0, 5)
    .map((s: Surah) => ({
      type: 'surah',
      labelAr: 'سورة',
      title: s.nameAr,
      subtitle: `${s.nameEn} — ${s.ayahCount} آية`,
      href: `/quran/${s.id}`,
    }));

  const hadithResults: Result[] = hadiths
    .filter(
      (d: Hadith) =>
        d.textAr.includes(q) ||
        d.narrator.includes(q) ||
        d.chapter.includes(q),
    )
    .slice(0, 4)
    .map((d: Hadith) => ({
      type: 'hadith',
      labelAr: 'حديث',
      title: d.textAr.slice(0, 60) + '...',
      subtitle: `${d.narrator} — ${d.grade}`,
      href: `/hadith/${d.bookId}`,
    }));

  const prophetResults: Result[] = prophets
    .filter((p: Prophet) => p.nameAr.includes(q) || (p.nameEn ?? '').toLowerCase().includes(q))
    .slice(0, 3)
    .map((p: Prophet) => ({
      type: 'prophet',
      labelAr: 'نبي',
      title: p.nameAr,
      subtitle: p.nameEn ?? '',
      href: `/prophets/${p.slug}`,
    }));

  return [...surahResults, ...hadithResults, ...prophetResults];
}

async function runSearch(query: string): Promise<Result[]> {
  const staticResults = runStaticSearch(query);

  try {
    const response = await fetch(`/api/content/articles?q=${encodeURIComponent(query)}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) return staticResults;

    const articles = (await response.json()) as ArticleSearchItem[];
    const articleResults: Result[] = articles.map((article) => ({
      type: 'article',
      labelAr: 'مقال',
      title: article.title,
      subtitle: article.summary ?? article.author ?? 'مقال تعليمي من مكتبة ذِكر',
      href: `/articles/${article.slug}`,
    }));
    return [...staticResults, ...articleResults];
  } catch (error) {
    console.error('[search] Failed to fetch article results:', error);
    return staticResults;
  }
}

const SUGGESTIONS = ['الفاتحة', 'الكهف', 'موسى', 'إبراهيم', 'الرحمن'];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [searched, setSearched] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const initialQuery = new URLSearchParams(window.location.search).get('q');
    if (initialQuery?.trim()) {
      void handleSearch(initialQuery);
    }
  }, []);

  const handleSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    const params = new URLSearchParams(window.location.search);
    params.set('q', trimmed);
    window.history.replaceState(null, '', `/search?${params.toString()}`);
    startTransition(() => {
      void runSearch(trimmed).then((nextResults) => {
        setResults(nextResults);
        setSearched(true);
      });
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <Container className="py-12 space-y-10">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold">بحث شامل</h1>
        <p className="max-w-2xl mx-auto text-lg leading-8 arabic-muted">
          ابحث في القرآن والأحاديث والأنبياء والمقالات التعليمية
        </p>
      </section>

      <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl mx-auto">
        <Input
          type="text"
          placeholder="اكتب اسم سورة، نبي، أو كلمة من مقال..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229))
              e.preventDefault();
          }}
          className="flex-1 text-lg"
          dir="rtl"
          aria-label="كلمة البحث"
        />
        <Button type="submit" variant="primary" className="px-8" disabled={!query.trim()}>
          بحث
        </Button>
      </form>

      {/* Quick suggestions */}
      {!searched && (
        <section className="flex flex-wrap gap-2 justify-center" aria-label="اقتراحات البحث">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSearch(s)}
              className="rounded-full border border-brand-gold/30 px-3 py-1 text-sm text-brand-cream/70 hover:border-brand-gold hover:text-brand-gold transition-colors"
            >
              {s}
            </button>
          ))}
        </section>
      )}

      {searched && results.length === 0 && (
        <Card className="text-center p-8 space-y-2">
          <p className="text-brand-cream/60">
            لا توجد نتائج لـ &quot;{query}&quot;. جرب كلمات أخرى.
          </p>
        </Card>
      )}

      {results.length > 0 && (
        <section className="space-y-4">
          <p className="text-sm arabic-muted">{results.length} نتيجة</p>
          <div className="grid gap-3">
            {results.map((result, idx) => (
              <Link key={idx} href={result.href}>
                <Card className="p-5 flex items-center gap-4 hover:border-brand-gold/50 cursor-pointer transition-all">
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {result.labelAr}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-brand-cream truncate">{result.title}</h3>
                    <p className="text-sm text-brand-cream/50 truncate">{result.subtitle}</p>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4 text-brand-gold/40 shrink-0 rotate-180"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
