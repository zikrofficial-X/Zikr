import { createAdminClient } from "@/lib/supabase/server";
import { requireAdminApi } from "@/lib/services/admin";
import { NextResponse } from "next/server";

interface DatedRow {
  created_at?: string | null;
}
interface BehaviorRow extends DatedRow {
  user_id?: string | null;
}
interface FavoriteRow {
  item_type?: string | null;
  item_ref?: string | null;
}

export async function GET() {
  try {
    const auth = await requireAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Analytics tables are intentionally read with the service-role client only
    // after the request has passed the session + profile role check above.
    const supabase = createAdminClient();

    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const [
      usersRes,
      behaviorCountRes,
      recentProfilesRes,
      behaviorRes,
      favoritesRes,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("user_behavior")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo),
      supabase
        .from("user_behavior")
        .select("created_at, user_id")
        .gte("created_at", thirtyDaysAgo),
      supabase.from("favorites").select("item_type, item_ref"),
    ]);

    const timeline = Array.from({ length: 30 }, (_, i) => {
      const day = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
      const dayKey = day.toISOString().slice(0, 10);
      const usersOnDay = ((recentProfilesRes.data || []) as DatedRow[]).filter(
        p => p.created_at?.slice(0, 10) === dayKey
      ).length;
      const eventsOnDay = ((behaviorRes.data || []) as BehaviorRow[]).filter(
        b => b.created_at?.slice(0, 10) === dayKey
      );
      return {
        date: day.toLocaleDateString("ar-SA"),
        users: usersOnDay,
        sessions: new Set(eventsOnDay.map(b => b.user_id)).size,
        pageViews: eventsOnDay.length,
      };
    });

    const favCounts = new Map<
      string,
      { item_type: string; item_ref: string; count: number }
    >();
    for (const f of (favoritesRes.data || []) as FavoriteRow[]) {
      if (!f.item_type || !f.item_ref) continue;
      const key = `${f.item_type}:${f.item_ref}`;
      const entry = favCounts.get(key) || {
        item_type: f.item_type,
        item_ref: f.item_ref,
        count: 0,
      };
      entry.count++;
      favCounts.set(key, entry);
    }
    const topContent = [...favCounts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(c => ({
        id: c.item_ref,
        title: `${c.item_type} #${c.item_ref}`,
        views: 0,
        favorites: c.count,
      }));

    return NextResponse.json({
      stats: {
        totalUsers: usersRes.count ?? 0,
        activeSessions: new Set(
          ((behaviorRes.data || []) as BehaviorRow[])
            .map(b => b.user_id)
            .filter(Boolean)
        ).size,
        totalPageViews: behaviorCountRes.count ?? 0,
        avgSessionDuration: 0,
      },
      timeline,
      topContent,
    });
  } catch (error) {
    console.error("[api/admin/analytics] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
