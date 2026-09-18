'use client';

import { useAdhanPlayer, type AdhanVoice } from '@/hooks/use-adhan-player';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState } from 'react';

interface AdhanPlayerProps {
  className?: string;
  showVoiceSelector?: boolean;
  compact?: boolean;
}

export function AdhanPlayer({ 
  className = '', 
  showVoiceSelector = true,
  compact = false 
}: AdhanPlayerProps) {
  const {
    isPlaying,
    currentVoice,
    volume,
    play,
    pause,
    stop,
    setVolume,
    setVoice,
    duration,
    currentTime,
  } = useAdhanPlayer();

  const [showVolume, setShowVolume] = useState(false);

  const voices: { id: AdhanVoice; label: string; labelAr: string }[] = [
    { id: 'makkah', label: 'Mecca', labelAr: 'مكة' },
    { id: 'madinah', label: 'Madinah', labelAr: 'المدينة' },
  ];

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          onClick={() => isPlaying ? pause() : play()}
          variant="ghost"
          size="sm"
          className="text-brand-gold hover:bg-brand-gold/10"
          aria-label={isPlaying ? 'إيقاف الأذان' : 'تشغيل الأذان'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </Button>
        {showVoiceSelector && (
          <select
            value={currentVoice}
            onChange={(e) => setVoice(e.target.value as AdhanVoice)}
            className="text-xs bg-black/30 border border-brand-gold/30 rounded px-2 py-1 text-brand-cream"
          >
            {voices.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.labelAr}
              </option>
            ))}
          </select>
        )}
      </div>
    );
  }

  return (
    <Card className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-brand-gold">الأذان</h3>
        <span className="text-xs text-brand-cream/60">صوت الأذان</span>
      </div>

      {/* Voice Selector */}
      {showVoiceSelector && (
        <div className="flex gap-2">
          {voices.map((voice) => (
            <Button
              key={voice.id}
              onClick={() => setVoice(voice.id)}
              variant={currentVoice === voice.id ? 'primary' : 'secondary'}
              size="sm"
              className="flex-1"
            >
              {voice.labelAr}
            </Button>
          ))}
        </div>
      )}

      {/* Playback Controls */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => isPlaying ? pause() : play()}
          variant="primary"
          className="flex-1"
          aria-label={isPlaying ? 'إيقاف الأذان' : 'تشغيل الأذان'}
        >
          {isPlaying ? '⏸️ إيقاف' : '▶️ تشغيل'}
        </Button>
        <Button
          onClick={stop}
          variant="secondary"
          size="sm"
          aria-label="إيقاف الأذان تماماً"
        >
          ⏹️
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="h-1 bg-black/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-gold to-brand-emerald transition-all"
            style={{
              width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-brand-cream/60">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-brand-cream/70">مستوى الصوت</label>
          <button
            onClick={() => setShowVolume(!showVolume)}
            className="text-xs text-brand-gold/60 hover:text-brand-gold transition-colors"
          >
            {volume}%
          </button>
        </div>
        {showVolume && (
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-2 bg-black/30 rounded-full appearance-none cursor-pointer accent-brand-gold"
            aria-label="مستوى الصوت"
          />
        )}
      </div>

      {/* Info */}
      <p className="text-xs text-brand-cream/50 text-center">
        {isPlaying ? 'جاري التشغيل...' : 'اضغط على الزر لتشغيل الأذان'}
      </p>
    </Card>
  );
}
