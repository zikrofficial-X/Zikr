import {
  addCurrentUserFavorite,
  getCurrentUserFavorites,
  removeCurrentUserFavorite,
  removeCurrentUserFavoriteById,
  type FavoriteItemType,
} from "@/features/favorites/services/favorites";
import { requireSupabaseAuth } from "@/lib/supabase/guard";
import { NextRequest, NextResponse } from "next/server";

function isFavoriteItemType(value: unknown): value is FavoriteItemType {
  return (
    value === "quran" ||
    value === "hadith" ||
    value === "story" ||
    value === "scholar" ||
    value === "dua" ||
    value === "article" ||
    value === "video"
  );
}

export async function GET() {
  const unauthenticated = requireSupabaseAuth();
  if (unauthenticated) return unauthenticated;

  try {
    const favorites = await getCurrentUserFavorites();
    if (favorites === null) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(favorites);
  } catch (error) {
    console.error("[api/user/favorites] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const unauthenticated = requireSupabaseAuth();
  if (unauthenticated) return unauthenticated;

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    const itemType = input.item_type ?? input.itemType ?? "quran";
    const itemRef = input.item_ref ?? input.itemRef;

    if (!isFavoriteItemType(itemType) || typeof itemRef !== "string") {
      return NextResponse.json({ error: "Invalid favorite" }, { status: 400 });
    }

    const result = await addCurrentUserFavorite(itemRef, itemType);
    if (result.error === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (result.error === "Invalid") {
      return NextResponse.json({ error: "Invalid favorite" }, { status: 400 });
    }
    if (!result.ok) {
      return NextResponse.json({ error: "Failed to create favorite" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[api/user/favorites] POST error:", error);
    return NextResponse.json({ error: "Failed to create favorite" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const unauthenticated = requireSupabaseAuth();
  if (unauthenticated) return unauthenticated;

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const itemRef = searchParams.get("item_ref") ?? searchParams.get("itemRef");
    const itemTypeValue =
      searchParams.get("item_type") ?? searchParams.get("itemType") ?? "quran";

    if (id) {
      const result = await removeCurrentUserFavoriteById(id);
      if (result.error === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (result.error === "Invalid") {
        return NextResponse.json({ error: "Invalid favorite id" }, { status: 400 });
      }
      if (!result.ok) {
        return NextResponse.json(
          { error: "Failed to delete favorite" },
          { status: 500 },
        );
      }
      return new NextResponse(null, { status: 204 });
    }

    if (!itemRef || !isFavoriteItemType(itemTypeValue)) {
      return NextResponse.json(
        { error: "item_ref and valid item_type are required" },
        { status: 400 },
      );
    }

    const result = await removeCurrentUserFavorite(itemRef, itemTypeValue);
    if (result.error === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (result.error === "Invalid") {
      return NextResponse.json({ error: "Invalid favorite" }, { status: 400 });
    }
    if (!result.ok) {
      return NextResponse.json({ error: "Failed to delete favorite" }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[api/user/favorites] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete favorite" }, { status: 500 });
  }
}
