"use server";

import { revalidatePath } from "next/cache";
import {
  getCurrentWirdProgress,
  saveCurrentWirdProgress,
  type WirdProgressState,
} from "@/features/wird/services/progress";

export type { WirdProgressState };

export async function getWirdProgress() {
  return getCurrentWirdProgress();
}

export async function saveWirdProgress(
  state: WirdProgressState,
): Promise<{ success: boolean; error?: string }> {
  const result = await saveCurrentWirdProgress(state);

  if (result.success) {
    revalidatePath("/profile");
    revalidatePath("/wird");
  }

  return result;
}
