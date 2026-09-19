"use server";

/**
 * @openapi
 * POST /favorites/add (Server Action: addFavorite)
 * Summary: Add item to favorites
 * Tags: Favorites
 * Auth: Required
 * Request: itemRef (string), itemType (FavoriteItemType, default: quran)
 * Response: { success: true } | { error: string }
 *
 * DELETE /favorites/remove (Server Action: removeFavorite)
 * Summary: Remove item from favorites
 * Tags: Favorites
 * Auth: Required
 * Request: itemRef (string), itemType (FavoriteItemType, default: quran)
 * Response: { success: true } | { error: string }
 *
 * GET /favorites/check (Server Action: isFavorite)
 * Summary: Check if item is favorited
 * Tags: Favorites
 * Auth: Required
 * Request: itemRef (string), itemType (FavoriteItemType, default: quran)
 * Response: boolean
 */
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FavoriteItemType = "quran" | "hadith" | "story" | "scholar" | "dua";

type FavoriteActionResult = { success: true } | { error: string };

export async function addFavorite(
  itemRef: string,
  itemType: FavoriteItemType = "quran"
): Promise<FavoriteActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("favorites").insert({
    user_id: user.id,
    item_type: itemType,
    item_ref: itemRef,
  });

  if (error) {
    // 23505 = unique_violation — item already favorited, treat as success
    if (error.code === "23505") return { success: true };
    console.error("Failed to add favorite:", error);
    return { error: "Failed to add favorite" };
  }

  revalidatePath("/favorites");
  return { success: true };
}

export async function removeFavorite(
  itemRef: string,
  itemType: FavoriteItemType = "quran"
): Promise<FavoriteActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("item_type", itemType)
    .eq("item_ref", itemRef);

  if (error) {
    console.error("Failed to remove favorite:", error);
    return { error: "Failed to remove favorite" };
  }

  revalidatePath("/favorites");
  return { success: true };
}

export async function isFavorite(
  itemRef: string,
  itemType: FavoriteItemType = "quran"
): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("item_type", itemType)
    .eq("item_ref", itemRef)
    .maybeSingle();

  return data !== null;
}

/**
 * Batch check: returns a Set of item_refs that are favorited by the current user.
 * Use this instead of calling isFavorite N times on a list page.
 */
export async function getFavoritedRefs(
  itemRefs: string[],
  itemType: FavoriteItemType = "quran"
): Promise<Set<string>> {
  if (!itemRefs.length) return new Set();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data } = await supabase
    .from("favorites")
    .select("item_ref")
    .eq("user_id", user.id)
    .eq("item_type", itemType)
    .in("item_ref", itemRefs);

  return new Set((data ?? []).map((d) => d.item_ref as string));
}
