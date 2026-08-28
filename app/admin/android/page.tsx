import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { getSiteSetting, type SiteSettingValue } from "@/lib/services/site-content";
import { saveAndroidReleaseAction } from "./actions";

const RELEASES_API = "https://api.github.com/repos/mohamedalaa7785-cpu/Zikr-Android-Releases/releases?per_page=20";

type Release = {
  tag_name?: string;
  name?: string | null;
  draft?: boolean;
  prerelease?: boolean;
  published_at?: string | null;
  assets?: Array<{ name?: string }>; 
};

async function getReleases(): Promise<Release[]> {
  try {
    const response = await fetch(RELEASES_API, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "ZIKR-admin-release-manager" },
      cache: "no-store",
    });
    if (!response.ok) return [];
    const releases = (await response.json()) as Release[];
    return releases.filter(r => !r.draft && !r.prerelease && Boolean(r.tag_name));
  } catch {
    return [];
  }
}

export default async function AndroidReleaseAdminPage() {
  const [releases, setting] = await Promise.all([
    getReleases(),
    getSiteSetting("android_release"),
  ]);

  const androidSetting = setting as SiteSettingValue & {
    mode?: string;
    releaseTag?: string | null;
  } | null;
  const selectedMode = androidSetting?.mode === "pinned" ? "pinned" : "auto";
  const selectedTag = androidSetting?.releaseTag ?? "";

  return (
    <Container className="max-w-3xl space-y-8 py-8" dir="rtl">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold text-brand-gold">إدارة إصدار تطبيق Android</h1>
        <p className="text-sm leading-7 text-brand-cream/55">
          تحكم في الإصدار الذي يفتحه زر «تنزيل أحدث APK الرسمي». الوضع التلقائي يختار أحدث Release مستقر منشور، بينما الوضع اليدوي يثبت إصدارًا محددًا.
        </p>
      </section>

      <Card className="space-y-6 p-6">
        <form action={saveAndroidReleaseAction} className="space-y-5">
          <label className="flex items-center gap-3 rounded-xl border border-brand-gold/15 bg-black/20 p-4 cursor-pointer">
            <input type="radio" name="mode" value="auto" defaultChecked={selectedMode === "auto"} />
            <span>
              <span className="block font-semibold text-brand-cream">تلقائي — أحدث Release مستقر</span>
              <span className="text-xs text-brand-cream/45">كل Release جديد تنشره يصبح هو الإصدار الذي يتم تنزيله تلقائيًا.</span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-brand-gold/15 bg-black/20 p-4 cursor-pointer">
            <input type="radio" name="mode" value="pinned" defaultChecked={selectedMode === "pinned"} className="mt-1" />
            <span className="flex-1">
              <span className="block font-semibold text-brand-cream">تثبيت إصدار محدد</span>
              <span className="text-xs text-brand-cream/45">استخدم هذا عندما تريد تأخير التحديث للمستخدمين رغم وجود Release أحدث.</span>
              <select name="releaseTag" defaultValue={selectedTag} className="mt-3 w-full rounded-xl border border-brand-gold/20 bg-black/40 px-4 py-3 text-sm text-brand-cream">
                <option value="">اختر الإصدار</option>
                {releases.map(release => {
                  const hasApk = release.assets?.some(asset => asset.name?.toLowerCase().endsWith(".apk"));
                  if (!hasApk) return null;
                  return (
                    <option key={release.tag_name} value={release.tag_name}>
                      {release.name || release.tag_name} — {release.tag_name}
                    </option>
                  );
                })}
              </select>
            </span>
          </label>

          <button type="submit" className="w-full rounded-full bg-brand-gold px-6 py-3 font-bold text-black transition-colors hover:bg-brand-gold/90">
            حفظ إعداد إصدار Android
          </button>
        </form>
      </Card>

      <Card className="space-y-3 p-6">
        <h2 className="text-lg font-bold text-brand-gold">الإصدارات المستقرة المتاحة</h2>
        {releases.length === 0 ? (
          <p className="text-sm text-brand-cream/50">تعذر جلب الإصدارات الآن.</p>
        ) : (
          <div className="space-y-2">
            {releases.map(release => (
              <div key={release.tag_name} className="flex items-center justify-between gap-4 rounded-xl border border-brand-gold/10 bg-black/15 px-4 py-3">
                <span className="font-semibold text-brand-cream">{release.name || release.tag_name}</span>
                <span className="text-xs text-brand-gold">{release.tag_name}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Container>
  );
}
