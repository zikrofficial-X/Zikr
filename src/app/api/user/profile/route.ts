import { createClient } from '@/lib/supabase/server';
import { requireSupabaseAuth } from '@/lib/supabase/guard';
import { NextRequest, NextResponse } from 'next/server';

const PROFILE_SELECT =
  'id, display_name, avatar_url, locale, role, created_at, updated_at';
const MAX_DISPLAY_NAME_LENGTH = 80;
const SUPPORTED_LOCALES = new Set(['ar', 'en']);

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getUserMetadataValue(metadata: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function getDisplayNameInput(body: JsonObject) {
  const hasSnakeCaseName = Object.hasOwn(body, 'display_name');
  const hasCamelCaseName = Object.hasOwn(body, 'displayName');
  if (!hasSnakeCaseName && !hasCamelCaseName) return { provided: false } as const;

  const value = hasSnakeCaseName ? body.display_name : body.displayName;
  if (typeof value !== 'string') {
    return { provided: true, error: 'display_name must be a string' } as const;
  }

  const displayName = value.trim();
  if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
    return {
      provided: true,
      error: `display_name must not exceed ${MAX_DISPLAY_NAME_LENGTH} characters`,
    } as const;
  }

  return { provided: true, value: displayName || null } as const;
}

function getLocaleInput(body: JsonObject) {
  if (!Object.hasOwn(body, 'locale')) return { provided: false } as const;
  if (typeof body.locale !== 'string' || !SUPPORTED_LOCALES.has(body.locale)) {
    return { provided: true, error: 'locale must be either ar or en' } as const;
  }
  return { provided: true, value: body.locale } as const;
}

export async function GET() {
  const unauthenticated = requireSupabaseAuth();
  if (unauthenticated) return unauthenticated;

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (profile) {
      return NextResponse.json({ ...profile, email: user.email ?? null });
    }

    const metadata = user.user_metadata ?? {};
    const now = new Date().toISOString();

    return NextResponse.json({
      id: user.id,
      email: user.email ?? null,
      display_name:
        getUserMetadataValue(metadata, 'display_name', 'full_name', 'name') ??
        user.email?.split('@')[0] ??
        null,
      avatar_url: getUserMetadataValue(metadata, 'avatar_url', 'picture'),
      locale: 'ar',
      role: 'user',
      created_at: user.created_at ?? now,
      updated_at: now,
    });
  } catch (error) {
    console.error('[api/user/profile] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const unauthenticated = requireSupabaseAuth();
  if (unauthenticated) return unauthenticated;

  try {
    const body: unknown = await request.json();
    if (!isJsonObject(body)) {
      return NextResponse.json({ error: 'Request body must be an object' }, { status: 400 });
    }

    const displayName = getDisplayNameInput(body);
    if ('error' in displayName) {
      return NextResponse.json({ error: displayName.error }, { status: 400 });
    }

    const locale = getLocaleInput(body);
    if ('error' in locale) {
      return NextResponse.json({ error: locale.error }, { status: 400 });
    }

    if (!displayName.provided && !locale.provided) {
      return NextResponse.json(
        { error: 'Provide display_name, displayName, or locale to update the profile' },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates: {
      id: string;
      display_name?: string | null;
      locale?: string;
      updated_at: string;
    } = {
      id: user.id,
      updated_at: new Date().toISOString(),
    };

    if (displayName.provided) updates.display_name = displayName.value;
    if (locale.provided) updates.locale = locale.value;

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert(updates, { onConflict: 'id' })
      .select(PROFILE_SELECT)
      .single();

    if (error) throw error;
    return NextResponse.json({ ...profile, email: user.email ?? null });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }
    console.error('[api/user/profile] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
