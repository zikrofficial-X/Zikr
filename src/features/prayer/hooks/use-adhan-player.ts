'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import {
  AZAN_CLIP_URL,
  playAzanTone,
  refreshSiteAudio,
  unlockAudioContext,
} from '@/lib/audio/spiritual-tones';
import { getAudioUrl } from '@/lib/audio/config';

export type AdhanVoice = 'makkah' | 'madinah';

export interface UseAdhanPlayerReturn {
  isPlaying: boolean;
  currentVoice: AdhanVoice;
  volume: number;
  play: (voice?: AdhanVoice) => Promise<void>;
  pause: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  setVoice: (voice: AdhanVoice) => void;
  duration: number;
  currentTime: number;
}

export function useAdhanPlayer(): UseAdhanPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVoice, setCurrentVoiceState] = useState<AdhanVoice>('makkah');
  const [volume, setVolumeState] = useState(70);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Initialize audio element
  useEffect(() => {
    void refreshSiteAudio();
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume / 100;
    }

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [volume]);

  const playLocalAdhan = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.dataset.voice = 'local';
    audio.src = AZAN_CLIP_URL;
    audio.load();

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      playAzanTone();
      setIsPlaying(false);
    }
  }, []);

  const play = useCallback(async (voice: AdhanVoice = currentVoice) => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    const audioSources: Record<AdhanVoice, string> = {
      makkah: 'https://www.islamcan.com/audio/adhan/azan1.mp3',
      madinah: 'https://www.islamcan.com/audio/adhan/azan2.mp3',
    };
    const audioPath = getAudioUrl('prayer') || audioSources[voice];

    // Unlock the guaranteed Web Audio fallback from the same user gesture.
    unlockAudioContext();

    try {
      // Use a data attribute because HTMLAudioElement.src becomes absolute.
      if (audio.dataset.voice !== voice) {
        audio.dataset.voice = voice;
        audio.src = audioPath;
        audio.load();
      }

      await audio.play();
      setIsPlaying(true);
    } catch {
      // Keep the adhan usable offline when an optional remote reciter is unavailable.
      await playLocalAdhan();
    }
  }, [currentVoice, playLocalAdhan]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, newVolume));
    setVolumeState(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume / 100;
    }
  }, []);

  const setVoice = useCallback((voice: AdhanVoice) => {
    setCurrentVoiceState(voice);
    // If currently playing, switch to new voice
    if (isPlaying && audioRef.current) {
      const wasPlaying = true;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.dataset.voice = voice;
      const audioSources: Record<AdhanVoice, string> = {
        makkah: 'https://www.islamcan.com/audio/adhan/azan1.mp3',
        madinah: 'https://www.islamcan.com/audio/adhan/azan2.mp3',
      };
      audioRef.current.src = audioSources[voice];
      audioRef.current.load();
      if (wasPlaying) {
        audioRef.current.play().catch(() => {
          void playLocalAdhan();
        });
      }
    }
  }, [isPlaying, playLocalAdhan]);

  return {
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
  };
}
