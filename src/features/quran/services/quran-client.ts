"use client";

import type { Reciter } from "@/features/quran/types/quran";

export async function getQuranReciters(): Promise<Reciter[]> {
  const response = await fetch("/api/quran/reciters", {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Quran reciters request failed: ${response.status}`);
  }

  const payload = (await response.json()) as { reciters?: unknown };
  if (!Array.isArray(payload.reciters)) {
    throw new Error("Invalid Quran reciters response.");
  }

  return payload.reciters as Reciter[];
}
