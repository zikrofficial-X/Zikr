import "server-only";

import { createClient } from "@/lib/supabase/server";

export type FavoriteItemType =
  | "quran"
  | "hadith"
  | "story"
  | "scholar"
  | "dua";

export type Favorite = {
  id: string;
  item_type: FavoriteItemType | string;
  item_ref: string;
  created_at: string;
};

const MAX_ITEM_REF_LENGTH = 500;

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { supabase, user };
}

function normalizeItemRef(value: string): string {
  return value.trim();
}

export async function getCurrentUserFavorites(): Promise<Favorite[] | null> {
  const session = await getAuthenticatedUser();
  if (!session) return null;

  const { data, error } = await session.supabase
    .from("favorites")
    .select("id, item_type, item_ref, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw error;
  return (data ?? []) as Favorite[];
}

export async function addCurrentUserFavorite(
  itemRef: string,
  itemType: FavoriteItemType = "quran",
): Promise<{ ok: true } | { ok: false; error: "Unauthorized" | "Invalid" | "Failed" }> {
  const session = await getAuthenticatedUser();
  if (!session) return { ok: false, error: "Unauthorized" };

  const normalizedRef = normalizeItemRef(itemRef);
  if (!normalizedRef || normalizedRef.length > MAX_ITEM_REF_LENGTH) {
    return { ok: false, error: "Invalid" };
  }

  const { error } = await session.supabase.from("favorites").insert({
    user_id: session.user.id,
    item_type: itemType,
    item_ref: normalizedRef,
  });

  if (error?.code === "23505") return { ok: true };
  if (error) {
    console.error("[favorites] add failed:", error);
    return { ok: false, error: "Failed" };
  }

  return { ok: true };
}

export async function removeCurrentUserFavorite(
  itemRef: string,
  itemType: FavoriteItemType = "quran",
): Promise<{ ok: true } | { ok: false; error: "Unauthorized" | "Invalid" | "Failed" }> {
  const session = await getAuthenticatedUser();
  if (!session) return { ok: false, error: "Unauthorized" };

  const normalizedRef = normalizeItemRef(itemRef);
  if (!normalizedRef || normalizedRef.length > MAX_ITEM_REF_LENGTH) {
    return { ok: false, error: "Invalid" };
  }

  const { error } = await session.supabase
    .from("favorites")
    .delete()
    .eq("user_id", session.user.id)
    .eq("item_type", itemType)
    .eq("item_ref", normalizedRef);

  if (error) {
    console.error("[favorites] remove failed:", error);
    return { ok: false, error: "Failed" };
  }

  return { ok: true };
}

export async function removeCurrentUserFavoriteById(
  id: string,
): Promise<{ ok: true } | { ok: false; error: "Unauthorized" | "Invalid" | "Failed" }> {
  const session = await getAuthenticatedUser();
  if (!session) return { ok: false, error: "Unauthorized" };

  const normalizedId = id.trim();
  if (!normalizedId || normalizedId.length > 200) {
    return { ok: false, error: "Invalid" };
  }

  const { error } = await session.supabase
    .from("favorites")
    .delete()
    .eq("user_id", session.user.id)
    .eq("id", normalizedId);

  if (error) {
    console.error("[favorites] remove by id failed:", error);
    return { ok: false, error: "Failed" };
  }

  return { ok: true };
}

export async function isCurrentUserFavorite(
  itemRef: string,
  itemType: FavoriteItemType = "quran",
): Promise<boolean> {
  const session = await getAuthenticatedUser();
  if (!session) return false;

  const normalizedRef = normalizeItemRef(itemRef);
  if (!normalizedRef || normalizedRef.length > MAX_ITEM_REF_LENGTH) return false;

  const { data } = await session.supabase
    .from("favorites")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("item_type", itemType)
    .eq("item_ref", normalizedRef)
    .maybeSingle();

  return Boolean(data);
}

export async function getCurrentUserFavoritedRefs(
  itemRefs: string[],
  itemType: FavoriteItemType = "quran",
): Promise<Set<string>> {
  const session = await getAuthenticatedUser();
  if (!session || !itemRefs.length) return new Set();

  const refs = [...new Set(
    itemRefs
      .map(normalizeItemRef)
      .filter((ref) => ref && ref.length <= MAX_ITEM_REF_LENGTH),
  )];
  if (!refs.length) return new Set();

  const { data } = await session.supabase
    .from("favorites")
    .select("item_ref")
    .eq("user_id", session.user.id)
    .eq("item_type", itemType)
    .in("item_ref", refs);

  return new Set((data ?? []).map((row) => String(row.item_ref)));
}
