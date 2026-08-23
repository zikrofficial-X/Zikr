import { createClient } from '@/lib/supabase/server';

export type SiteSettingValue = {
  title?: string | null;
  body?: string | null;
  imageUrl?: string | null;
  logoUrl?: string | null;
  youtubeChannelUrl?: string | null;
  pinnedMessage?: string | null;
  showQuran?: boolean;
  showHadith?: boolean;
  showProphets?: boolean;
  showCompanions?: boolean;
  showKids?: boolean;
  showPoetry?: boolean;
  showPrayerTimes?: boolean;
  showMemorization?: boolean;
  facebookPageUrl?: string | null;
  twitterUrl?: string | null;
  instagramUrl?: string | null;
  audioSettings?: {
    prayer?: string | null;
    dhikr?: string | null;
    salawat?: string | null;
  } | null;
};

export type PinnedMessage = {
  id: string;
  title: string | null;
  body: string | null;
  type: string | null;
  is_active: boolean;
  priority: number;
};

export type Competition = {
  id: string;
  title: string;
  description: string | null;
  prize: string | null;
  starts_at: string | null;
  ends_at: string | null;
  metadata: { imageUrl?: string | null; rules?: string | null } | null;
};

export type MemorizationPlan = {
  id: string;
  title: string;
  cadence: string;
  target_ref: string | null;
  prompt: string | null;
  tajweed_focus: string | null;
};

export async function getSiteSetting(key: string): Promise<SiteSettingValue | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .limit(1)
      .single();
    return (data?.value as SiteSettingValue) ?? null;
  } catch {
    return null;
  }
}

export async function getPinnedMessages(limit = 3): Promise<PinnedMessage[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('pinned_messages')
      .select('id, title, body, type, is_active, priority')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getCompetitions(limit = 20): Promise<Competition[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('competitions')
      .select('id, title, description, prize, starts_at, ends_at, metadata')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getMemorizationPlans(limit = 12): Promise<MemorizationPlan[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('memorization_plans')
      .select('id, title, cadence, target_ref, prompt, tajweed_focus')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    return data ?? [];
  } catch {
    return [];
  }
}
