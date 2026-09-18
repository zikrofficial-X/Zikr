"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getCurrentPrayer,
  getNextPrayer,
  type PrayerTime,
} from "@/lib/services/prayer-times";

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
}

interface UsePrayerTimesReturn {
  times: PrayerTimes | null;
  loading: boolean;
  error: Error | null;
  currentPrayer: string | null;
  nextPrayer: string | null;
  getPrayerTimes: (latitude: number, longitude: number) => Promise<void>;
}

export function usePrayerTimes(): UsePrayerTimesReturn {
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPrayer, setCurrentPrayer] = useState<string | null>(null);
  const [nextPrayer, setNextPrayer] = useState<string | null>(null);

  const getPrayerTimes = useCallback(
    async (latitude: number, longitude: number) => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `/api/prayer-times?latitude=${latitude}&longitude=${longitude}&method=4`
        );
        if (!response.ok) throw new Error("Failed to fetch prayer times");
        const data = await response.json();
        const next = data.data?.timings ?? data.timings;
        setTimes(next);
        if (next) {
          setCurrentPrayer(getCurrentPrayer(next as PrayerTime)?.name ?? null);
          setNextPrayer(getNextPrayer(next as PrayerTime)?.name ?? null);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator))
      return;

    let cancelled = false;
    void (async () => {
      try {
        const native = (
          window as Window & {
            zikrNative?: {
              isNative?: boolean;
              requestLocationPermission?: () => Promise<unknown>;
            };
          }
        ).zikrNative;
        if (native?.isNative && native.requestLocationPermission) {
          const permission = (await native.requestLocationPermission()) as
            | {
                location?: string;
              }
            | undefined;
          if (permission?.location === "denied") {
            setError(new Error("Location permission was denied"));
            return;
          }
        }

        navigator.geolocation.getCurrentPosition(
          position => {
            if (!cancelled) {
              void getPrayerTimes(
                position.coords.latitude,
                position.coords.longitude
              );
            }
          },
          geolocationError => {
            if (!cancelled) setError(new Error(geolocationError.message));
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
        );
      } catch {
        navigator.geolocation.getCurrentPosition(position => {
          if (!cancelled) {
            void getPrayerTimes(
              position.coords.latitude,
              position.coords.longitude
            );
          }
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [getPrayerTimes]);

  return {
    times,
    loading,
    error,
    currentPrayer,
    nextPrayer,
    getPrayerTimes,
  };
}
