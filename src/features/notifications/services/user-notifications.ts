import "server-only";

import { createClient } from "@/lib/supabase/server";

export type UserNotification = Record<string, unknown>;

export async function getCurrentUserNotifications(): Promise<UserNotification[] | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data ?? []) as UserNotification[];
}
