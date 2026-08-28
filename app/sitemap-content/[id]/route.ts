import { NextResponse } from 'next/server';
import { getSitemapPage } from '@/app/sitemap';
import { siteConfig } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 0) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const entries = await getSitemapPage(id);
  const baseUrl = siteConfig.url.replace(/\/$/, '');
  const urls = entries
    .map((entry) => {
      const lastModified = entry.lastModified
        ? new Date(entry.lastModified).toISOString()
        : undefined;
      return [
        '  <url>',
        `    <loc>${escapeXml(entry.url)}</loc>`,
        lastModified ? `    <lastmod>${lastModified}</lastmod>` : '',
        entry.changeFrequency ? `    <changefreq>${entry.changeFrequency}</changefreq>` : '',
        typeof entry.priority === 'number' ? `    <priority>${entry.priority}</priority>` : '',
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `public, max-age=300, s-maxage=900, stale-while-revalidate=3600`,
      'X-Sitemap-Base': baseUrl,
    },
  });
}
