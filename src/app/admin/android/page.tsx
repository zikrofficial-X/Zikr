import { requireAdminPermission } from "@/features/admin/services/admin";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { type SiteSettingValue } from "@/features/site-content/services/site-content";
import { readAdminRows } from "@/features/admin/services/safe-read";
import { saveAndroidReleaseAction } from "./actions";

const RELEASES_API_BASE =
  "https://api.github.com/repos/zikrofficial-X/Zikr/releases";
const MAX_RELEASE_PAGES = 5;
const githubToken = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
const githubHeaders: HeadersInit = {
  Accept: "application/vnd.github+json",
  "User-Agent": "ZIKR-admin-release-manager",
  ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
};

type ReleaseAsset = { name?: string };
type Release = {
  tag_name?: string;
  name?: string | null;
  draft?: boolean;
  prerelease?: boolean;
  published_at?: string | null;
  assets?: ReleaseAsset[];
};

function versionParts(value: string) {
  return value
    .trim()
    .replace(/^v/i, "")
    .split(/[.-]/)
    .map(part => Number.parseInt(part, 10))
    .map(part => (Number.isFinite(part) ? part : 0));
}

function compareVersions(a: string, b: string) {
  const left = versionParts(a);
  const right = versionParts(b);
  const length = Math.max(left.length, right.length, 3);
  for (let index = 0; index < length; index += 1) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

async function getReleases(): Promise<{ rows: Release[]; ok: boolean }> {
  const releases: Release[] = [];

  try {
    for (let page = 1; page <= MAX_RELEASE_PAGES; page += 1) {
      const response = await fetch(
        `${RELEASES_API_BASE}?per_page=100&page=${page}`,
        { headers: githubHeaders, cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error(`GitHub releases API returned ${response.status}.`);
      }

      const batch = (await response.json()) as unknown;
      if (!Array.isArray(batch)) {
        throw new Error("GitHub releases API returned an invalid payload.");
      }
      if (batch.length === 0) break;

      releases.push(...(batch as Release[]));
      if (batch.length < 100) break;
    }

    const stableWithApk = releases.filter(
      release =>
        !release.draft &&
        !release.prerelease &&
        Boolean(release.tag_name) &&
        release.assets?.some(asset =>
          asset.name?.toLowerCase().endsWith(".apk"),
        ),
    );

    const unique = new Map<string, Release>();
    for (const release of stableWithApk) {
      const tag = release.tag_name!.trim();
      if (!unique.has(tag)) unique.set(tag, release);
    }

    return {
      rows: [...unique.values()].sort((a, b) => {
        const versionDiff = compareVersions(b.tag_name ?? "", a.tag_name ?? "");
        if (versionDiff !== 0) return versionDiff;

        const aDate = a.published_at ? Date.parse(a.published_at) : 0;
        const bDate = b.published_at ? Date.parse(b.published_at) : 0;
        return bDate - aDate;
      }),
      ok: true,
    };
  } catch (error) {
    console.error("[admin/android] failed to load GitHub releases:", error);
    return { rows: [], ok: false };
  }
}
export default async function AndroidReleaseAdminPage() {
  await requireAdminPermission("android.manage");
  const [releasesResult, settingResult] = await Promise.all([
    getReleases(),
    readAdminRows<{ value: SiteSettingValue }>(
      "/rest/v1/site_settings?select=value&key=eq.android_release&limit=1",
    ),
  ]);
  const releases = releasesResult.rows;
  const settingAvailable = settingResult.ok;
  const setting = settingAvailable ? settingResult.rows[0]?.value ?? null : null;

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

      {!settingAvailable && (
        <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
          تعذر قراءة إعداد إصدار Android المحفوظ. تم تعطيل الحفظ حتى لا يتم استبدال إعداد موجود بقيمة افتراضية غير مؤكدة.
        </div>
      )}
      {!releasesResult.ok && (
        <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
          تعذر الاتصال بواجهة GitHub لقراءة الإصدارات. لم يتم اعتبار خطأ الاتصال قائمة إصدارات فارغة.
        </div>
      )}

      <Card className="space-y-6 p-6">
        <form action={saveAndroidReleaseAction} className="space-y-5">
          <label className="flex items-center gap-3 rounded-xl border border-brand-gold/15 bg-black/20 p-4 cursor-pointer">
            <input type="radio" name="mode" value="auto" defaultChecked={selectedMode === "auto"} disabled={!settingAvailable} />
            <span>
              <span className="block font-semibold text-brand-cream">تلقائي — أحدث Release مستقر</span>
              <span className="text-xs text-brand-cream/45">كل Release جديد تنشره يصبح هو الإصدار الذي يتم تنزيله تلقائيًا.</span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-brand-gold/15 bg-black/20 p-4 cursor-pointer">
            <input type="radio" name="mode" value="pinned" defaultChecked={selectedMode === "pinned"} className="mt-1" disabled={!settingAvailable} />
            <span className="flex-1">
              <span className="block font-semibold text-brand-cream">تثبيت إصدار محدد</span>
              <span className="text-xs text-brand-cream/45">استخدم هذا عندما تريد تأخير التحديث للمستخدمين رغم وجود Release أحدث.</span>
              <select name="releaseTag" defaultValue={selectedTag} disabled={!settingAvailable || !releasesResult.ok || releases.length === 0} className="mt-3 w-full rounded-xl border border-brand-gold/20 bg-black/40 px-4 py-3 text-sm text-brand-cream disabled:cursor-not-allowed disabled:opacity-50">
                <option value="">اختر الإصدار</option>
                {selectedTag && !releases.some(release => release.tag_name === selectedTag) ? (
                  <option value={selectedTag}>{selectedTag} — الإصدار المحفوظ غير موجود ضمن قائمة GitHub الحالية</option>
                ) : null}
                {releases.map(release => (
                  <option key={release.tag_name} value={release.tag_name}>
                    {release.name || release.tag_name} — {release.tag_name}
                  </option>
                ))}
              </select>
            </span>
          </label>

          <button type="submit" disabled={!settingAvailable} className="w-full rounded-full bg-brand-gold px-6 py-3 font-bold text-black transition-colors hover:bg-brand-gold/90 disabled:cursor-not-allowed disabled:opacity-40">
            حفظ إعداد إصدار Android
          </button>
        </form>
      </Card>

      <Card className="space-y-3 p-6">
        <h2 className="text-lg font-bold text-brand-gold">الإصدارات المستقرة المتاحة</h2>
        {!releasesResult.ok ? (
          <p className="text-sm text-red-200">قائمة الإصدارات غير متاحة بسبب فشل اتصال GitHub. راجع صلاحية الاتصال وحدود API ثم حدّث الصفحة.</p>
        ) : releases.length === 0 ? (
          <p className="text-sm text-amber-200">اتصال GitHub ناجح، لكن لا توجد إصدارات مستقرة تحتوي على ملف APK في السجل الحالي.</p>
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
