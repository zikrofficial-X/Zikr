export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'الملف الشخصي',
  robots: { index: false, follow: false },
};
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { logoutAction, updateProfileAction } from '@/app/auth/actions';
import { AvatarUpload } from '@/components/profile/avatar-upload';
import Link from 'next/link';

type Favorite = {
  id: string;
  item_type: string;
  item_ref: string;
  created_at: string;
};

type ReadingProgress = {
  id: string;
  scope: string;
  ref: string;
  progress_json: Record<string, unknown>;
  updated_at: string;
};

const typeLabels: Record<string, string> = {
  quran: 'القرآن',
  hadith: 'الحديث',
  story: 'القصص',
  scholar: 'العلماء',
  dua: 'الأدعية',
  article: 'المقالات',
  video: 'الفيديوهات',
  poetry: 'الشعر',
};

const scopeLabels: Record<string, string> = {
  quran: 'القرآن',
  hadith: 'الحديث',
  stories: 'القصص',
};

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getUserMetadataValue(metadata: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login?next=/profile');

  // Profile rows are created by the server-side auth callback/trigger. Avoid a
  // write during a read-only page render: it adds latency and can race RLS.
  const [profileRes, favoritesRes, progressRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, avatar_url, role, created_at')
      .eq('id', user.id)
      .limit(1),
    supabase
      .from('favorites')
      .select('id, item_type, item_ref, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('reading_progress')
      .select('id, scope, ref, progress_json, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(10),
  ]);

  const profile = profileRes.data?.[0] ?? null;
  const favList: Favorite[] = favoritesRes.data ?? [];
  const progressList: ReadingProgress[] = progressRes.data ?? [];
  const favCount = favList.length;
  const progressCount = progressList.length;

  const isAdmin = profile?.role === 'admin';
  const userMetadata = user.user_metadata ?? {};
  const displayName =
    profile?.display_name ??
    getUserMetadataValue(userMetadata, 'full_name', 'name', 'display_name') ??
    user.email?.split('@')[0] ??
    null;
  const avatarUrl = profile?.avatar_url ?? getUserMetadataValue(userMetadata, 'avatar_url', 'picture');
  const memberSince = profile?.created_at ?? user.created_at;
  const lastSignIn = user.last_sign_in_at;
  const emailVerified = Boolean(user.email_confirmed_at);
  const provider = user.app_metadata?.provider ?? 'email';
  const providerLabels: Record<string, string> = {
    email: 'البريد الإلكتروني',
    google: 'جوجل',
    facebook: 'فيسبوك',
    github: 'جيت هاب',
  };

  // Distinct favorite categories for the stats row
  const favTypes = new Set(favList.map((f) => f.item_type));

  return (
    <Container className="space-y-5 py-8 sm:py-12 lg:py-16">
      {params.success === 'profile_saved' && (
        <div role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          تم حفظ بيانات الحساب بنجاح.
        </div>
      )}
      {params.error && (
        <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {params.error}
        </div>
      )}
      {/* Header card: identity + account details */}
      <Card className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl text-brand-gold">الملف الشخصي</h1>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-full border border-brand-gold/40 bg-brand-gold/10 px-3 py-1 text-xs font-semibold text-brand-gold transition-colors hover:bg-brand-gold/20"
              >
                لوحة التحكم
              </Link>
            )}
            <span
              className={
                isAdmin
                  ? 'rounded-full bg-brand-gold/20 px-3 py-1 text-xs font-semibold text-brand-gold'
                  : 'rounded-full bg-black/25 px-3 py-1 text-xs text-brand-cream/70 ring-1 ring-brand-gold/20'
              }
            >
              {isAdmin ? 'أدمن' : 'مستخدم'}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <AvatarUpload
            currentAvatarUrl={avatarUrl}
            displayName={displayName}
            email={user.email ?? null}
          />
          <div className="space-y-1">
            <p className="text-lg font-semibold text-brand-cream">
              {displayName ?? 'لم يتم إعداد الاسم بعد'}
            </p>
            <p className="text-sm arabic-muted">{user.email ?? 'البريد غير متاح'}</p>
            <p className="text-xs arabic-muted">
              {emailVerified ? 'البريد الإلكتروني مُوثّق' : 'البريد الإلكتروني غير مُوثّق بعد'}
              {' · '}
              تسجيل الدخول عبر {providerLabels[provider] ?? provider}
            </p>
          </div>
        </div>

        {/* Account details grid */}
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-black/15 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="arabic-muted text-xs">عضو منذ</p>
            <p className="text-brand-cream/90">{formatDate(memberSince)}</p>
          </div>
          <div>
            <p className="arabic-muted text-xs">آخر تسجيل دخول</p>
            <p className="text-brand-cream/90">{formatDate(lastSignIn)}</p>
          </div>
          <div>
            <p className="arabic-muted text-xs">آخر المفضلة</p>
            <p className="text-brand-cream/90 tabular-nums">{favCount.toLocaleString('ar-EG')}</p>
          </div>
          <div>
            <p className="arabic-muted text-xs">آخر القراءات</p>
            <p className="text-brand-cream/90 tabular-nums">{progressCount.toLocaleString('ar-EG')}</p>
          </div>
        </div>
      </Card>

      {/* Edit profile */}
      <Card className="space-y-4">
        <h2 className="text-xl text-brand-gold">تعديل البيانات</h2>
        <form action={updateProfileAction} className="max-w-md space-y-4">
          <div className="space-y-1">
            <label className="block text-sm arabic-muted" htmlFor="displayName">
              الاسم المعروض
            </label>
            <input
              id="displayName"
              name="displayName"
              defaultValue={profile?.display_name ?? ''}
              placeholder="اكتب اسمك"
              className="w-full rounded-lg border border-brand-gold/20 bg-black/20 p-2 text-brand-cream focus:border-brand-gold focus:outline-none"
            />
          </div>

          <Button type="submit">حفظ التغييرات</Button>
        </form>

        <form action={logoutAction}>
          <Button type="submit" variant="ghost">
            تسجيل الخروج
          </Button>
        </form>
      </Card>

      {/* Activity summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Favorites */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl text-brand-gold">المفضلة</h2>
            {favCount > 0 && (
              <Link href="/favorites" className="text-sm text-brand-gold/70 transition-colors hover:text-brand-gold">
                عرض الكل
              </Link>
            )}
          </div>
          {favTypes.size > 0 && (
            <div className="flex flex-wrap gap-2">
              {[...favTypes].map((t) => (
                <span key={t} className="rounded-full bg-brand-gold/10 px-2 py-0.5 text-xs text-brand-gold">
                  {typeLabels[t] ?? t}
                </span>
              ))}
            </div>
          )}
          {favList.length === 0 ? (
            <p className="arabic-muted">
              لم تقم بحفظ أي عناصر بعد. تصفح المحتوى وأضف ما يعجبك إلى المفضلة.
            </p>
          ) : (
            <div className="space-y-2">
              {favList.map((fav) => (
                <div
                  key={fav.id}
                  className="flex items-center justify-between rounded-lg bg-black/20 p-3"
                >
                  <div>
                    <span className="rounded-full bg-brand-gold/10 px-2 py-0.5 text-xs text-brand-gold">
                      {typeLabels[fav.item_type] ?? fav.item_type}
                    </span>
                    <p className="mt-1 text-sm text-brand-cream/90">{fav.item_ref}</p>
                  </div>
                  <span className="text-xs arabic-muted">{formatDate(fav.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Reading progress */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl text-brand-gold">التقدم في القراءة</h2>
            {progressCount > 0 && (
              <span className="text-sm arabic-muted">
                آخر {progressCount.toLocaleString('ar-EG')} سجلات
              </span>
            )}
          </div>
          {progressList.length === 0 ? (
            <p className="arabic-muted">
              لم تبدأ أي قراءة بعد.{' '}
              <Link href="/quran" className="text-brand-gold hover:underline">
                ابدأ بتصفح القرآن
              </Link>{' '}
              لتتبع تقدمك.
            </p>
          ) : (
            <div className="space-y-2">
              {progressList.map((rp) => (
                <div
                  key={rp.id}
                  className="flex items-center justify-between rounded-lg bg-black/20 p-3 text-sm"
                >
                  <span className="text-brand-cream/90">
                    {rp.ref === 'wird'
                      ? 'الورد اليومي'
                      : `${scopeLabels[rp.scope] ?? rp.scope} — ${String(rp.progress_json?.surah_name ?? rp.ref).replace('surah:', 'سورة ')}`}
                  </span>
                  <span className="text-xs arabic-muted">{formatDate(rp.updated_at)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick links */}
      <Card className="space-y-4">
        <h2 className="text-xl text-brand-gold">روابط سريعة</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/memorization', label: 'خطط الحفظ' },
            { href: '/tasbeeh', label: 'المسبحة الإلكترونية' },
            { href: '/prayer-times', label: 'مواقيت الصلاة' },
            { href: '/competitions', label: 'المسابقات' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl border border-brand-gold/20 bg-black/15 p-4 text-center text-sm text-brand-cream/80 transition-colors hover:border-brand-gold/50 hover:text-brand-gold"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </Card>
    </Container>
  );
}
