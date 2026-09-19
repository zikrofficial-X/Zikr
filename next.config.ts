import type { NextConfig } from 'next';
import { PRODUCTION_URL } from './src/lib/site';

const canonicalClientSiteUrl = PRODUCTION_URL;

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    NEXT_PUBLIC_SITE_URL: canonicalClientSiteUrl,
  },
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    unoptimized: false,
    remotePatterns: [
      { protocol: 'https', hostname: 'supabase.co' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        {
          key: 'Content-Security-Policy',
          value: `default-src 'self'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''} https://pagead2.googlesyndication.com https://partner.googleadservices.com https://www.googletagservices.com https://adservice.google.com https://fundingchoicesmessages.google.com https://www.googletagmanager.com https://va.vercel-scripts.com; script-src-elem 'self' 'unsafe-inline' https://va.vercel-scripts.com https://pagead2.googlesyndication.com https://partner.googleadservices.com https://www.googletagservices.com https://adservice.google.com https://fundingchoicesmessages.google.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://*.supabase.co https://res.cloudinary.com https://i.ytimg.com https://img.youtube.com https://pagead2.googlesyndication.com https://*.googleusercontent.com https://*.gstatic.com; media-src 'self' blob: https://*.supabase.co https://cdn.islamic.network https://www.islamcan.com https://everyayah.com https://quranaudio.pages.dev https://*.mp3quran.net https://download.quranicaudio.com https://archive.org https://*.archive.org https://server6.mp3quran.net https://server8.mp3quran.net https://stream.radiojar.com https://qurango.net; connect-src 'self' https://va.vercel-scripts.com https://*.supabase.co https://www.googleapis.com https://accounts.google.com https://oauth2.googleapis.com https://generativelanguage.googleapis.com https://api.hadith.gading.dev https://ummahapi.com https://api.aladhan.com https://api.alquran.cloud https://everyayah.com https://quranaudio.pages.dev https://*.mp3quran.net https://download.quranicaudio.com https://archive.org https://*.archive.org https://pagead2.googlesyndication.com https://adservice.google.com https://fundingchoicesmessages.google.com https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://ep1.adtrafficquality.google https://mp3quran.net https://api.quran.com https://www.hisnmuslim.com https://mp3quran.net/api; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://fundingchoicesmessages.google.com https://accounts.google.com; font-src 'self' data: https://fonts.gstatic.com;`,
        },
        { key: 'Permissions-Policy', value: 'geolocation=(self), microphone=(self), camera=(self)' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      ],
    },
    {
      source: '/api/:path*',
      headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
    },
    {
      source: '/static/:path*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
    {
      source: '/:path*.svg',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
  ],
  rewrites: async () => [
    { source: '/sitemap-content/:id.xml', destination: '/sitemap-content/:id' },
  ],
  redirects: async () => [
    // The Vercel project exposes historical/generated aliases. Keep the
    // user-facing origin and OAuth origin pinned to the canonical domain.
    {
      source: '/:path*',
      has: [
        {
          type: 'host',
          value: 'zikr-zikrmediaofficial.vercel.app',
        },
      ],
      destination: 'https://zikrmediaofficial.vercel.app/:path*',
      permanent: true,
    },
    { source: '/home', destination: '/', permanent: false },
    { source: '/prayer', destination: '/prayer-times', permanent: true },
    { source: '/islamic-conquests', destination: '/conquests', permanent: true },
    { source: '/battles/qaynuqa', destination: '/battles/banu-qaynuqa', permanent: false },
    { source: '/battles/nadir', destination: '/battles/banu-nadir', permanent: false },
    { source: '/battles/qurayza', destination: '/battles/banu-qurayza', permanent: false },
    { source: '/battles/mutah', destination: '/battles/mu-tah', permanent: false },
    { source: '/battles/salasel', destination: '/battles/dhat-salasil', permanent: false },
    { source: '/prophets/dhul-kifl', destination: '/prophets/dhulkifl', permanent: true },
    { source: '/prophets/zakariyya', destination: '/prophets/zakariya', permanent: true },
  ],
  productionBrowserSourceMaps: false,
  trailingSlash: false,
  experimental: {
    serverActions: { bodySizeLimit: '4mb' },
    optimizePackageImports: ['lucide-react'],
    inlineCss: true,
  },
};

export default nextConfig;
