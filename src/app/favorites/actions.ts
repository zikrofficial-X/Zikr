"use server";

import { revalidatePath } from "next/cache";
import {
  addCurrentUserFavorite,
  getCurrentUserFavoritedRefs,
  isCurrentUserFavorite,
  removeCurrentUserFavorite,
  type FavoriteItemType,
} from "@/features/favorites/services/favorites";

type FavoriteActionResult = { success: true } | { error: string };

export type { FavoriteItemType };

export async function addFavorite(
  itemRef: string,
  itemType: FavoriteItemType = "quran",
): Promise<FavoriteActionResult> {
  const result = await addCurrentUserFavorite(itemRef, itemType);
  if (result.ok) {
    revalidatePath("/favorites");
    return { success: true };
  }
  return {
    error:
      result.error === "Unauthorized"
        ? "Unauthorized"
        : result.error === "Invalid"
          ? "Invalid favorite"
          : "Failed to add favorite",
  };
}

export async function removeFavorite(
  itemRef: string,
  itemType: FavoriteItemType = "quran",
): Promise<FavoriteActionResult> {
  const result = await removeCurrentUserFavorite(itemRef, itemType);
  if (result.ok) {
    revalidatePath("/favorites");
    return { success: true };
  }
  return {
    error:
      result.error === "Unauthorized"
        ? "Unauthorized"
        : result.error === "Invalid"
          ? "Invalid favorite"
          : "Failed to remove favorite",
  };
}

export async function isFavorite(
  itemRef: string,
  itemType: FavoriteItemType = "quran",
): Promise<boolean> {
  return isCurrentUserFavorite(itemRef, itemType);
}

export async function getFavoritedRefs(
  itemRefs: string[],
  itemType: FavoriteItemType = "quran",
): Promise<Set<string>> {
  return getCurrentUserFavoritedRefs(itemRefs, itemType);
}
