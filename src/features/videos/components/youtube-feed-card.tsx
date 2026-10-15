'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Card } from '@/components/ui/card';

type Props = {
  videoId: string;
  title: string;
  thumbnailUrl: string | null;
  publishedLabel?: string;
};

export function YoutubeFeedCard({ videoId, title, thumbnailUrl, publishedLabel }: Props) {
  const [playing, setPlaying] = useState(false);
  const [resolvedThumbnail, setResolvedThumbnail] = useState(thumbnailUrl);

  const fallbackThumbnail = `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;

  return (
    <Card className="overflow-hidden h-full flex flex-col hover:border-brand-gold/50 transition-all">
      <div className="relative aspect-video bg-black/60">
        {playing ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0&playsinline=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 block h-full w-full text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
            aria-label={`تشغيل ${title} داخل منصة ذِكر`}
          >
            {resolvedThumbnail ? (
              <Image
                src={resolvedThumbnail}
                alt={title}
                fill
                sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                onError={() => {
                  if (resolvedThumbnail !== fallbackThumbnail) setResolvedThumbnail(fallbackThumbnail);
                  else setResolvedThumbnail(null);
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-brand-gold/10" aria-hidden="true">
                <span className="text-5xl text-brand-gold/40">▶</span>
              </div>
            )}
            <span className="absolute inset-0 bg-black/20 transition group-hover:bg-black/10" aria-hidden="true" />
            <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/75 text-2xl text-brand-gold shadow-lg ring-1 ring-brand-gold/40">
              ▶
            </span>
          </button>
        )}
      </div>
      <div className="p-4 space-y-2 flex-1">
        <h3 className="text-sm font-semibold text-brand-cream line-clamp-2">{title}</h3>
        {publishedLabel ? <p className="text-xs text-brand-cream/50">{publishedLabel}</p> : null}
      </div>
    </Card>
  );
}
