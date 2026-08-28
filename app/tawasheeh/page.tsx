"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  tawasheeh as verifiedFallback,
  type Tawasheeh,
} from "@/lib/data/content";

type ApiTrack = {
  id: string;
  title_ar: string;
  title_en: string;
  artist_ar: string | null;
  artist_en: string | null;
  audio_url: string;
  duration: number | null;
  views: number | null;
  featured: boolean | null;
  metadata: Record<string, unknown> | null;
};
type Track = Tawasheeh & { sourceUrl?: string };

function formatDuration(seconds: number): string {
  const safeSeconds =
    Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, "0")}`;
}

function mapApiTrack(track: ApiTrack): Track {
  return {
    id: track.id,
    titleAr: track.title_ar,
    titleEn: track.title_en,
    artistAr: track.artist_ar ?? "منشد غير محدد",
    artistEn: track.artist_en ?? "Unknown artist",
    audioUrl: track.audio_url,
    duration: track.duration ?? 0,
    views: track.views ?? 0,
    featured: track.featured ?? false,
    sourceUrl:
      typeof track.metadata?.source_url === "string"
        ? track.metadata.source_url
        : undefined,
  };
}

export default function TawasheehPage() {
  const [tracks, setTracks] = useState<Track[]>(verifiedFallback);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataNotice, setDataNotice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadTracks() {
      try {
        const response = await fetch("/api/tawasheeh?limit=100", {
          signal: controller.signal,
          credentials: "same-origin",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as { data?: ApiTrack[] };
        const apiTracks = (payload.data ?? [])
          .filter(track => Boolean(track.audio_url))
          .map(mapApiTrack);
        if (apiTracks.length > 0) {
          setTracks(apiTracks);
          setDataNotice(null);
        } else {
          setDataNotice(
            "تُعرض المجموعة الموثقة المدمجة مؤقتًا حتى تتوفر سجلات الصوت في قاعدة البيانات."
          );
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setDataNotice(
          "تعذر الاتصال بالمكتبة الآن؛ تُعرض المجموعة الموثقة المدمجة ويمكنك الاستماع إليها مباشرة."
        );
      } finally {
        setIsLoading(false);
      }
    }
    void loadTracks();
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return tracks;
    return tracks.filter(track =>
      [track.titleAr, track.titleEn, track.artistAr, track.artistEn].some(
        value => value.toLowerCase().includes(query)
      )
    );
  }, [searchQuery, tracks]);
  const featured = useMemo(
    () => tracks.filter(track => track.featured),
    [tracks]
  );
  const currentTrack = tracks.find(track => track.id === currentId) ?? null;

  const handlePlay = (id: string) => {
    setAudioError(null);
    if (currentId === id) {
      if (isPlaying) audioRef.current?.pause();
      else
        void audioRef.current
          ?.play()
          .catch(() =>
            setAudioError("تعذّر تشغيل المقطع؛ تحقق من الاتصال بالمصدر.")
          );
      return;
    }
    setCurrentId(id);
    setIsPlaying(true);
  };
  const handleStop = () => {
    audioRef.current?.pause();
    setCurrentId(null);
    setIsPlaying(false);
    setAudioError(null);
  };

  return (
    <Container className="py-12 space-y-10" dir="rtl">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold">
          المداحون والتواشيح
        </h1>
        <p className="max-w-2xl mx-auto text-lg leading-8 arabic-muted">
          مكتبة صوتية للتواشيح والابتهالات والمدائح النبوية، مع إظهار مصدر كل
          تسجيل.
        </p>
        <div className="flex flex-wrap justify-center gap-2 text-xs arabic-muted">
          <Badge variant="outline">
            {tracks.length.toLocaleString("ar-EG")} تسجيلًا
          </Badge>
          <Badge variant="outline">مصادر قابلة للمراجعة</Badge>
          <Badge variant="outline">تشغيل مباشر</Badge>
        </div>
      </section>
      {dataNotice && (
        <p className="rounded-lg border border-brand-gold/20 bg-brand-gold/5 p-3 text-center text-sm arabic-muted">
          {dataNotice}
        </p>
      )}
      {currentTrack && (
        <Card className="border-brand-gold/40 space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm arabic-muted">يُشغّل الآن</p>
              <p className="font-bold text-brand-gold truncate">
                {currentTrack.titleAr}
              </p>
              <p className="text-xs text-brand-cream/60 truncate">
                {currentTrack.artistAr}
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={handleStop}
              aria-label="إيقاف التشغيل"
            >
              إيقاف
            </Button>
          </div>
          {audioError && (
            <p role="alert" className="text-xs text-red-400 text-center py-1">
              {audioError}
            </p>
          )}
          <audio
            ref={audioRef}
            key={currentTrack.id}
            src={currentTrack.audioUrl}
            controls
            autoPlay
            preload="metadata"
            className="w-full"
            aria-label={`تشغيل ${currentTrack.titleAr}`}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
              setCurrentId(null);
            }}
            onError={() => {
              setIsPlaying(false);
              setAudioError("تعذّر تحميل المقطع الصوتي من المصدر.");
            }}
          >
            متصفحك لا يدعم تشغيل الصوت.
          </audio>
          {currentTrack.sourceUrl && (
            <a
              href={currentTrack.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs text-brand-gold underline"
            >
              عرض صفحة المصدر والترخيص
            </a>
          )}
        </Card>
      )}
      <section className="flex gap-2">
        <Input
          type="search"
          placeholder="ابحث عن توشيح أو منشد..."
          value={searchQuery}
          onChange={event => setSearchQuery(event.target.value)}
          className="flex-1"
          dir="rtl"
          aria-label="البحث في التواشيح"
        />
      </section>
      {isLoading ? (
        <div className="py-12 text-center arabic-muted" role="status">
          جارٍ تحميل المكتبة الصوتية...
        </div>
      ) : (
        <>
          {featured.length > 0 && !searchQuery && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-brand-gold">
                مختارات موصى بها
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map(track => (
                  <TrackCard
                    key={`featured-${track.id}`}
                    track={track}
                    currentId={currentId}
                    isPlaying={isPlaying}
                    onPlay={handlePlay}
                  />
                ))}
              </div>
            </section>
          )}
          <section className="space-y-4">
            {searchQuery && (
              <p className="text-sm arabic-muted">
                {filtered.length.toLocaleString("ar-EG")} نتيجة للبحث عن «
                {searchQuery}»
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(track => (
                <TrackCard
                  key={track.id}
                  track={track}
                  currentId={currentId}
                  isPlaying={isPlaying}
                  onPlay={handlePlay}
                />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-8 arabic-muted">
                  لم يتم العثور على نتائج للبحث.
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </Container>
  );
}

type TrackCardProps = {
  track: Track;
  currentId: string | null;
  isPlaying: boolean;
  onPlay: (id: string) => void;
};
function TrackCard({ track, currentId, isPlaying, onPlay }: TrackCardProps) {
  const active = currentId === track.id;
  return (
    <Card
      className={`flex items-center gap-4 transition-all hover:border-brand-gold/50 ${active ? "border-brand-gold/60 bg-brand-gold/5" : ""}`}
    >
      <button
        onClick={() => onPlay(track.id)}
        className="w-10 h-10 shrink-0 rounded-full border border-brand-gold/30 flex items-center justify-center text-brand-gold hover:bg-brand-gold/10 transition-colors"
        aria-label={
          active && isPlaying
            ? `إيقاف مؤقت ${track.titleAr}`
            : `تشغيل ${track.titleAr}`
        }
      >
        {active && isPlaying ? "Ⅱ" : "▶"}
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-brand-cream truncate">{track.titleAr}</p>
        <p className="text-xs text-brand-cream/50 truncate">
          {track.artistAr} · {formatDuration(track.duration)}
        </p>
        {track.sourceUrl && (
          <a
            href={track.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-brand-gold/80 underline"
          >
            المصدر
          </a>
        )}
      </div>
    </Card>
  );
}
