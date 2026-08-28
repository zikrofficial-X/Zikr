import { NextResponse } from 'next/server';
import { getSitemapShardCount } from '@/app/sitemap';
import { siteConfig } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export async function GET() {
  const baseUrl = siteConfig.url.replace(/\/$/, '');
  const count = await getSitemapShardCount();
  const lastMod = new Date().toISOString();
  const sitemapUrls = Array.from({ length: count }, (_, id) => `    <sitemap><loc>${escapeXml(`${baseUrl}/sitemap-content/${id}.xml`)}</loc><lastmod>${lastMod}</lastmod></sitemap>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</sitemapindex>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=900, s-maxage=900, stale-while-revalidate=3600',
    },
  });
}
