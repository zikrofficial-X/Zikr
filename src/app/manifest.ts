import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: '/?utm_source=pwa',
    scope: '/',
    display: 'standalone',
    background_color: '#061322',
    theme_color: '#061322',
    orientation: 'portrait-primary',
    lang: 'ar',
    dir: siteConfig.dir,
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['lifestyle', 'reference', 'education'],
    shortcuts: [
      { name: 'القرآن الكريم', short_name: 'القرآن', url: '/quran' },
      { name: 'مواقيت الصلاة', short_name: 'الصلاة', url: '/prayer-times' },
      { name: 'الأذكار', short_name: 'الأذكار', url: '/adhkar' },
      { name: 'الورد اليومي', short_name: 'الورد', url: '/wird' },
    ],
  };
}
