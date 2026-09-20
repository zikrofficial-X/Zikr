import {
  getCurrentProfileData,
  updateCurrentProfile,
} from '@/features/profile/services/profile';
import { requireSupabaseAuth } from '@/lib/supabase/guard';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const unauthenticated = requireSupabaseAuth();
  if (unauthenticated) return unauthenticated;

  try {
    const profileData = await getCurrentProfileData();
    if (!profileData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = profileData.profile;
    const metadata = profileData.user.user_metadata;
    const now = new Date().toISOString();

    return NextResponse.json({
      id: profileData.user.id,
      email: profileData.user.email,
      display_name:
        profile?.display_name ??
        getUserMetadataValue(metadata, 'display_name', 'full_name', 'name') ??
        profileData.user.email?.split('@')[0] ??
        null,
      avatar_url:
        profile?.avatar_url ??
        getUserMetadataValue(metadata, 'avatar_url', 'picture'),
      locale: profile?.locale ?? 'ar',
      role: profile?.role ?? 'user',
      created_at: profile?.created_at ?? profileData.user.created_at ?? now,
      updated_at: profile?.updated_at ?? now,
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
    const result = await updateCurrentProfile(body);

    if (!result.ok) {
      if (result.error === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (result.error === 'Invalid') {
        return NextResponse.json(
          { error: result.message ?? 'Invalid profile update' },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ...result.profile,
      email: result.email,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON request body' },
        { status: 400 },
      );
    }
    console.error('[api/user/profile] PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 },
    );
  }
}
