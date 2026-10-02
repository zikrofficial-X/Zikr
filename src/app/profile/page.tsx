export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { pageMetadata } from "@/lib/site";
import {
  getCurrentProfileData,
  type ProfileFavorite,
  type ProfileReadingProgress,
} from "@/features/profile/services/profile";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { logoutAction, updateProfileAction } from "@/app/auth/actions";
import { AvatarUpload } from "@/features/profile/components/avatar-upload";
import { ProfileLocalSettings } from "@/features/profile/components/profile-local-settings";
import { getRecitersFromDb } from "@/features/quran/services/quran-server";
import { getCurrentReminderPreferences } from "@/features/reminders/services/reminder-preferences";
import Link from "next/link";

export const metadata: Metadata = pageMetadata({
  title: "الملف الشخصي",
  description: "إدارة بيانات حسابك وتفضيلات القراءة في منصة ذِكر.",
  path: "/profile",
  noindex: true,
});

const typeLabels: Record<string, string> = {
  quran: "القرآن",
  hadith: "الحديث",
  story: "القصص",
  scholar: "العلماء",
  dua: "الأدعية",
  article: "المقالات",
  video: "الفيديوهات",
  poetry: "الشعر",
};

const scopeLabels: Record<string, string> = {
  quran: "القرآن",
  hadith: "الحديث",
  stories: "القصص",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
}

function getUserMetadataValue(
  metadata: Record<string, unknown>,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const [data, reciters, reminderPreferences] = await Promise.all([
    getCurrentProfileData(),
    getRecitersFromDb(),
    getCurrentReminderPreferences(),
  ]);

  if (!data) redirect("/auth/login?next=/profile");

  const { user, profile, assignedRole } = data;
  const availableReciters = reciters ?? [];
  const favList: ProfileFavorite[] = data.favorites;
  const progressList: ProfileReadingProgress[] = data.readingProgress;
  const isAdmin = profile?.role === "admin" || Boolean(assignedRole);

  const displayName =
    profile?.display_name ??
    getUserMetadataValue(user.user_metadata, "full_name", "name", "display_name") ??
    user.email?.split("@")[0] ??
    null;
  const avatarUrl =
    profile?.avatar_url ??
    getUserMetadataValue(user.user_metadata, "avatar_url", "picture");
  const memberSince = profile?.created_at ?? user.created_at;
  const lastSignIn = user.last_sign_in_at;
  const emailVerified = Boolean(user.email_confirmed_at);
  const provider = String(user.app_metadata.provider ?? "email");
  const providerLabels: Record<string, string> = {
    email: "البريد الإلكتروني",
    google: "جوجل",
    facebook: "فيسبوك",
    github: "جيت هاب",
  };
  const favTypes = new Set(favList.map((favorite) => favorite.item_type));

  return (
    <Container className="space-y-5 py-8 sm:py-12 lg:py-16">
      {params.success === "profile_saved" && (
        <div role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          تم حفظ بيانات الحساب بنجاح.
        </div>
      )}
      {params.error && (
        <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {params.error}
        </div>
      )}

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
            <span className="rounded-full bg-black/25 px-3 py-1 text-xs text-brand-cream/70 ring-1 ring-brand-gold/20">
              {isAdmin ? "أدمن" : "مستخدم"}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <AvatarUpload
            currentAvatarUrl={avatarUrl}
            displayName={displayName}
            email={user.email}
          />
          <div className="space-y-1">
            <p className="text-lg font-semibold text-brand-cream">
              {displayName ?? "لم يتم إعداد الاسم بعد"}
            </p>
            <p className="text-sm arabic-muted">
              {user.email ?? "البريد غير متاح"}
            </p>
            <p className="text-xs arabic-muted">
              {emailVerified
                ? "البريد الإلكتروني مُوثّق"
                : "البريد الإلكتروني غير مُوثّق بعد"}
              {" · "}
              تسجيل الدخول عبر {providerLabels[provider] ?? provider}
            </p>
          </div>
        </div>

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
            <p className="text-brand-cream/90 tabular-nums">{favList.length.toLocaleString("ar-EG")}</p>
          </div>
          <div>
            <p className="arabic-muted text-xs">آخر القراءات</p>
            <p className="text-brand-cream/90 tabular-nums">{progressList.length.toLocaleString("ar-EG")}</p>
          </div>
          <div>
            <p className="arabic-muted text-xs">هدف الورد اليومي</p>
            <p className="text-brand-cream/90 tabular-nums">{(profile?.daily_wird_target ?? 20).toLocaleString("ar-EG")} آية</p>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-xl text-brand-gold">تعديل البيانات</h2>
        <form action={updateProfileAction} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm arabic-muted" htmlFor="displayName">
              الاسم المعروض
            </label>
            <input
              id="displayName"
              name="displayName"
              defaultValue={profile?.display_name ?? ""}
              placeholder="اكتب اسمك"
              className="w-full rounded-lg border border-brand-gold/20 bg-black/20 p-3 text-brand-cream focus:border-brand-gold focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm arabic-muted" htmlFor="locale">
              لغة الواجهة
            </label>
            <select
              id="locale"
              name="locale"
              defaultValue={profile?.locale ?? "ar"}
              className="w-full rounded-lg border border-brand-gold/20 bg-black/20 p-3 text-brand-cream focus:border-brand-gold focus:outline-none"
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="block text-sm arabic-muted" htmlFor="bio">
              نبذة قصيرة
            </label>
            <textarea
              id="bio"
              name="bio"
              defaultValue={profile?.bio ?? ""}
              maxLength={500}
              rows={3}
              placeholder="اكتب ما يساعد ذِكر على تخصيص تجربتك القرآنية."
              className="w-full rounded-lg border border-brand-gold/20 bg-black/20 p-3 text-brand-cream leading-7 focus:border-brand-gold focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm arabic-muted" htmlFor="preferredReciterCode">
              القارئ المفضل
            </label>
            <select
              id="preferredReciterCode"
              name="preferredReciterCode"
              defaultValue={profile?.preferred_reciter_code ?? ""}
              className="w-full rounded-lg border border-brand-gold/20 bg-black/20 p-3 text-brand-cream focus:border-brand-gold focus:outline-none"
            >
              <option value="">اختيار تلقائي</option>
              {availableReciters.slice(0, 120).map((reciter) => (
                <option key={reciter.id} value={reciter.code}>
                  {reciter.nameAr}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm arabic-muted" htmlFor="dailyWirdTarget">
              هدف الورد اليومي (آيات)
            </label>
            <input
              id="dailyWirdTarget"
              name="dailyWirdTarget"
              type="number"
              min={1}
              max={6236}
              defaultValue={profile?.daily_wird_target ?? 20}
              className="w-full rounded-lg border border-brand-gold/20 bg-black/20 p-3 text-brand-cream focus:border-brand-gold focus:outline-none"
            />
          </div>
          <input type="hidden" name="timezone" value={profile?.timezone ?? "Africa/Cairo"} />
          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-brand-cream/50">تُحفظ بيانات الملف مباشرة في حسابك، وليس داخل تخزين الجهاز فقط.</p>
            <Button type="submit">حفظ التغييرات</Button>
          </div>
        </form>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost">
            تسجيل الخروج
          </Button>
        </form>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl text-brand-gold">المفضلة</h2>
            {favList.length > 0 && (
              <Link href="/favorites" className="text-sm text-brand-gold/70 transition-colors hover:text-brand-gold">
                عرض الكل
              </Link>
            )}
          </div>
          {favTypes.size > 0 && (
            <div className="flex flex-wrap gap-2">
              {[...favTypes].map((type) => (
                <span key={type} className="rounded-full bg-brand-gold/10 px-2 py-0.5 text-xs text-brand-gold">
                  {typeLabels[type] ?? type}
                </span>
              ))}
            </div>
          )}
          {favList.length === 0 ? (
            <p className="arabic-muted">لم تقم بحفظ أي عناصر بعد.</p>
          ) : (
            <div className="space-y-2">
              {favList.map((favorite) => (
                <div key={favorite.id} className="flex items-center justify-between rounded-lg bg-black/20 p-3">
                  <div>
                    <span className="rounded-full bg-brand-gold/10 px-2 py-0.5 text-xs text-brand-gold">
                      {typeLabels[favorite.item_type] ?? favorite.item_type}
                    </span>
                    <p className="mt-1 text-sm text-brand-cream/90">{favorite.item_ref}</p>
                  </div>
                  <span className="text-xs arabic-muted">{formatDate(favorite.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl text-brand-gold">التقدم في القراءة</h2>
            {progressList.length > 0 && (
              <span className="text-sm arabic-muted">
                آخر {progressList.length.toLocaleString("ar-EG")} سجلات
              </span>
            )}
          </div>
          {progressList.length === 0 ? (
            <p className="arabic-muted">
              لم تبدأ أي قراءة بعد.{" "}
              <Link href="/quran" className="text-brand-gold hover:underline">
                ابدأ بتصفح القرآن
              </Link>
              {" "}لتتبع تقدمك.
            </p>
          ) : (
            <div className="space-y-2">
              {progressList.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg bg-black/20 p-3 text-sm">
                  <span className="text-brand-cream/90">
                    {item.ref === "wird"
                      ? "الورد اليومي"
                      : `${scopeLabels[item.scope] ?? item.scope} — ${String(item.progress_json?.surah_name ?? item.ref).replace("surah:", "سورة ")}`}
                  </span>
                  <span className="text-xs arabic-muted">{formatDate(item.updated_at)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {(() => {
        const wird = progressList.find((item) => item.scope === "quran" && item.ref === "wird");
        const wirdState = wird?.progress_json ?? null;
        return (
          <Card className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-brand-gold/70">YOUR QURAN JOURNEY</p>
                <h2 className="mt-1 text-2xl font-bold text-brand-gold">رحلتك مع القرآن</h2>
              </div>
              <Link href="/wird" className="text-sm text-brand-gold hover:underline">فتح صفحة الورد</Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-brand-gold/15 bg-black/15 p-4">
                <p className="text-xs arabic-muted">قراءة اليوم</p>
                <p className="mt-2 text-2xl font-bold text-brand-cream">{Number(wirdState?.todayCount ?? 0).toLocaleString("ar-EG")}</p>
                <p className="text-xs arabic-muted">من {Number(wirdState?.dailyTarget ?? profile?.daily_wird_target ?? 20).toLocaleString("ar-EG")}</p>
              </div>
              <div className="rounded-2xl border border-brand-gold/15 bg-black/15 p-4">
                <p className="text-xs arabic-muted">الاستمرارية</p>
                <p className="mt-2 text-2xl font-bold text-brand-cream">{Number(wirdState?.streak ?? 0).toLocaleString("ar-EG")} يوم</p>
              </div>
              <div className="rounded-2xl border border-brand-gold/15 bg-black/15 p-4">
                <p className="text-xs arabic-muted">الختمات</p>
                <p className="mt-2 text-2xl font-bold text-brand-cream">{Number(wirdState?.khatmaCount ?? 0).toLocaleString("ar-EG")}</p>
              </div>
              <div className="rounded-2xl border border-brand-gold/15 bg-black/15 p-4">
                <p className="text-xs arabic-muted">الموضع الحالي</p>
                <p className="mt-2 text-lg font-bold text-brand-cream">{wirdState?.position ? `آية ${Number(wirdState.position).toLocaleString("ar-EG")}` : "لم تبدأ بعد"}</p>
              </div>
            </div>
          </Card>
        );
      })()}

      <ProfileLocalSettings
        initialReminder={{
          quran_enabled: reminderPreferences?.quran_enabled ?? false,
          quran_time: reminderPreferences?.quran_time?.slice(0, 5) ?? "20:00",
          quran_message:
            reminderPreferences?.quran_message ??
            "اهدأ قليلًا… وافتح وردك اليومي. آية واحدة قد تغيّر يومك.",
        }}
      />

      <Card className="space-y-4">
        <h2 className="text-xl text-brand-gold">روابط سريعة</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/memorization", label: "خطط الحفظ" },
            { href: "/tasbeeh", label: "المسبحة الإلكترونية" },
            { href: "/prayer-times", label: "مواقيت الصلاة" },
            { href: "/competitions", label: "المسابقات" },
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
