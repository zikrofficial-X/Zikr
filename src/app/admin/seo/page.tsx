export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import { savePublicSiteSettingAction } from "./actions";

export const metadata: Metadata = { title: "SEO وبيانات الموقع | الأدمن" };

type Setting = { key: string; value: Record<string, unknown> };

async function read<T>(path: string): Promise<{ rows: T[]; ok: boolean }> {
  try {
    return { rows: (await supabaseServerAdminRequest<T[]>(path, { method: "GET" })) ?? [], ok: true };
  } catch {
    return { rows: [], ok: false };
  }
}

function textValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function booleanValue(value: unknown, fallback = true): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export default async function AdminSeoPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPermission("settings.manage");

  const [settingsRes, articlesRes, storiesRes, libraryRes] = await Promise.all([
    read<Setting>("/rest/v1/site_settings?select=key,value&key=in.(homepage,seo,branding,social)&limit=20"),
    read<{ id: string }>("/rest/v1/articles?select=id&published=eq.true&limit=1000"),
    read<{ id: string }>("/rest/v1/stories?select=id&published=eq.true&limit=1000"),
    read<{ id: string }>("/rest/v1/content_library?select=id&published=eq.true&limit=1000"),
  ]);

  const settings = settingsRes.rows;
  const articles = articlesRes.rows;
  const stories = storiesRes.rows;
  const library = libraryRes.rows;
  const hasSetting = (key: string) => settings.some((item) => item.key === key);
  const dataFor = (key: string): Record<string, unknown> => {
    const value = settings.find((item) => item.key === key)?.value;
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  };
  const homepage = dataFor("homepage");
  const seo = dataFor("seo");
  const social = dataFor("social");
  const homepageTitle = textValue(homepage.title, "ذِكرٌ");
  const homepageBody = textValue(homepage.body, "منصة إسلامية مرتبة للقراءة والذكر والتعلّم والعمل.");
  const seoTitle = textValue(seo.title, "ZIKR | ذِكرٌ");
  const seoDescription = textValue(seo.description, "منصة إسلامية شاملة للقرآن الكريم والأحاديث والأذكار ومواقيت الصلاة.");
  const keywordsValue = Array.isArray(seo.keywords)
    ? seo.keywords.filter((item): item is string => typeof item === "string").join(", ")
    : textValue(seo.keywords, "القرآن الكريم، الأذكار، الحديث النبوي، مواقيت الصلاة، ذِكر");
  const countDetail = (res: { rows: { id: string }[]; ok: boolean }) =>
    !res.ok ? "تعذر قراءة البيانات" : res.rows.length >= 1000 ? "1000+ منشور" : `${res.rows.length} منشور`;

  const checks = [
    ["Homepage metadata", settingsRes.ok && hasSetting("homepage"), settingsRes.ok ? "site_settings/homepage" : "تعذر قراءة الإعدادات"],
    ["SEO settings", settingsRes.ok && hasSetting("seo"), settingsRes.ok ? "site_settings/seo" : "تعذر قراءة الإعدادات"],
    ["Social metadata", settingsRes.ok && hasSetting("social"), settingsRes.ok ? "site_settings/social" : "تعذر قراءة الإعدادات"],
    ["Published articles", articlesRes.ok && articles.length > 0, countDetail(articlesRes)],
    ["Published stories", storiesRes.ok && stories.length > 0, countDetail(storiesRes)],
    ["Published library content", libraryRes.ok && library.length > 0, countDetail(libraryRes)],
  ] as const;

  const params = await searchParams;
  const savedSection = typeof params?.saved === "string" ? params.saved : null;
  const savedLabels: Record<string, string> = {
    homepage: "إعدادات الصفحة الرئيسية",
    seo: "إعدادات SEO",
    social: "بيانات المشاركة والحسابات الاجتماعية",
  };

  const inputClass = "mt-2 w-full rounded-xl border border-brand-gold/15 bg-black/25 px-3 py-3 text-sm text-brand-cream outline-none focus:border-brand-gold/45";
  const labelClass = "block text-sm font-semibold text-brand-cream/80";

  return (
    <Container className="space-y-8 py-10" dir="rtl">
      <header>
        <p className="text-xs tracking-[0.2em] text-brand-cream/30">إدارة الموقع والظهور العام</p>
        <h1 className="mt-2 text-3xl font-bold text-brand-gold">SEO والصفحة الرئيسية والبيانات الاجتماعية</h1>
        <p className="mt-2 max-w-4xl text-sm leading-7 text-brand-cream/55">
          هذه النماذج تحفظ الإعدادات العامة في site_settings، وتستخدمها الصفحة الرئيسية وبيانات Open Graph وTwitter.
          يتم التحقق من الروابط وتسجيل كل تعديل في سجل التدقيق. القيم الافتراضية تساعدك على البدء؛ لا تصبح مخزنة إلا بعد الضغط على حفظ.
        </p>
      </header>

      {savedSection && savedLabels[savedSection] ? (
        <div role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          تم حفظ {savedLabels[savedSection]} بنجاح.
        </div>
      ) : null}

      {!settingsRes.ok ? (
        <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm leading-7 text-red-100">
          تعذر قراءة إعدادات الموقع. لم تُعرض القيم غير المتاحة كأنها محفوظة؛ أصلح اتصال قاعدة البيانات قبل حفظ الإعدادات.
        </div>
      ) : null}

      <section className="rounded-3xl border border-brand-gold/15 bg-black/15 p-5 sm:p-7">
        <h2 className="text-xl font-bold text-brand-gold">الصفحة الرئيسية</h2>
        <p className="mt-1 text-sm leading-6 text-brand-cream/45">هذه الحقول تتحكم في العنوان والوصف ومداخل الصفحة الرئيسية والأقسام السفلية، وتُحفظ في site_settings/homepage.</p>
        <form action={savePublicSiteSettingAction} className="mt-5 space-y-5">
          <input type="hidden" name="section" value="homepage" />
          <label className={labelClass}>العنوان الرئيسي
            <input name="title" maxLength={120} required defaultValue={homepageTitle} className={inputClass} />
          </label>
          <label className={labelClass}>الوصف الظاهر أسفل العنوان
            <textarea name="body" maxLength={600} rows={3} required defaultValue={homepageBody} className={inputClass} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {([
              ["showQuran", "إظهار القرآن في المداخل السريعة", booleanValue(homepage.showQuran)],
              ["showHadith", "إظهار الحديث في المداخل السريعة", booleanValue(homepage.showHadith)],
              ["showPrayerTimes", "إظهار مواقيت الصلاة", booleanValue(homepage.showPrayerTimes)],
              ["showQuickStart", "إظهار قسم ابدأ بسرعة", booleanValue(homepage.showQuickStart)],
              ["showJourneys", "إظهار مسارات الأقسام", booleanValue(homepage.showJourneys)],
              ["showGuidedPaths", "إظهار البدايات المقترحة", booleanValue(homepage.showGuidedPaths)],
              ["showEditorialLibrary", "إظهار المكتبة التحريرية والمقالات", booleanValue(homepage.showEditorialLibrary)],
              ["showDailyTools", "إظهار الأدوات اليومية", booleanValue(homepage.showDailyTools)],
              ["showDailyVerse", "إظهار آية التدبر في نهاية الصفحة", booleanValue(homepage.showDailyVerse)],
            ] as const).map(([name, label, checked]) => (
              <label key={name} className="flex items-center gap-3 rounded-xl border border-brand-gold/10 bg-black/15 p-4 text-sm text-brand-cream/80">
                <input type="hidden" name={name} value="false" />
                <input type="checkbox" name={name} value="true" defaultChecked={checked} className="h-4 w-4 accent-brand-gold" />
                {label}
              </label>
            ))}
          </div>
          <button type="submit" disabled={!settingsRes.ok} className="rounded-xl bg-brand-gold px-5 py-3 text-sm font-bold text-brand-emeraldDeep disabled:cursor-not-allowed disabled:opacity-40">حفظ الصفحة الرئيسية</button>
        </form>
      </section>

      <section className="rounded-3xl border border-brand-gold/15 bg-black/15 p-5 sm:p-7">
        <h2 className="text-xl font-bold text-brand-gold">SEO العام</h2>
        <p className="mt-1 text-sm leading-6 text-brand-cream/45">تظهر هذه القيم في metadata العامة للصفحات، مع بقاء canonical وبيانات كل صفحة كما هي.</p>
        <form action={savePublicSiteSettingAction} className="mt-5 space-y-5">
          <input type="hidden" name="section" value="seo" />
          <label className={labelClass}>عنوان الموقع
            <input name="title" maxLength={120} required defaultValue={seoTitle} className={inputClass} />
          </label>
          <label className={labelClass}>الوصف لمحركات البحث (يفضّل أن يكون موجزًا)
            <textarea name="description" maxLength={320} rows={3} required defaultValue={seoDescription} className={inputClass} />
          </label>
          <label className={labelClass}>الكلمات المفتاحية (افصل بينها بفاصلة)
            <textarea name="keywords" maxLength={500} rows={2} defaultValue={keywordsValue} className={inputClass} />
          </label>
          <button type="submit" disabled={!settingsRes.ok} className="rounded-xl bg-brand-gold px-5 py-3 text-sm font-bold text-brand-emeraldDeep disabled:cursor-not-allowed disabled:opacity-40">حفظ SEO</button>
        </form>
      </section>

      <section className="rounded-3xl border border-brand-gold/15 bg-black/15 p-5 sm:p-7">
        <h2 className="text-xl font-bold text-brand-gold">Social Metadata والحسابات</h2>
        <p className="mt-1 text-sm leading-6 text-brand-cream/45">تحدد هذه القيم عنوان ووصف وصورة المعاينة عند مشاركة الموقع، وروابط التواصل في تذييل الصفحات.</p>
        <form action={savePublicSiteSettingAction} className="mt-5 space-y-5">
          <input type="hidden" name="section" value="social" />
          <label className={labelClass}>عنوان المشاركة
            <input name="ogTitle" maxLength={120} defaultValue={textValue(social.ogTitle, seoTitle)} className={inputClass} />
          </label>
          <label className={labelClass}>وصف المشاركة
            <textarea name="ogDescription" maxLength={320} rows={3} defaultValue={textValue(social.ogDescription, seoDescription)} className={inputClass} />
          </label>
          <label className={labelClass}>مسار صورة المشاركة أو رابط HTTPS
            <input name="ogImageUrl" maxLength={500} defaultValue={textValue(social.ogImageUrl, "/branding/og-image.png")} className={inputClass} />
            <span className="mt-1 block text-xs font-normal text-brand-cream/35">المسار المحلي الافتراضي: /branding/og-image.png</span>
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClass}>Facebook Page URL
              <input name="facebookPageUrl" type="url" defaultValue={textValue(social.facebookPageUrl, "https://www.facebook.com/zikrmediaofficial1")} className={inputClass} />
            </label>
            <label className={labelClass}>YouTube Channel URL
              <input name="youtubeChannelUrl" type="url" defaultValue={textValue(social.youtubeChannelUrl, "https://www.youtube.com/@zikrmediaofficial")} className={inputClass} />
            </label>
            <label className={labelClass}>Instagram URL (اختياري)
              <input name="instagramUrl" type="url" defaultValue={textValue(social.instagramUrl)} className={inputClass} />
            </label>
            <label className={labelClass}>X / Twitter URL (اختياري)
              <input name="xUrl" type="url" defaultValue={textValue(social.xUrl, textValue(social.twitterUrl))} className={inputClass} />
            </label>
          </div>
          <button type="submit" disabled={!settingsRes.ok} className="rounded-xl bg-brand-gold px-5 py-3 text-sm font-bold text-brand-emeraldDeep disabled:cursor-not-allowed disabled:opacity-40">حفظ بيانات المشاركة والتواصل</button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-gold">حالة المحتوى والأصول العامة</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {checks.map(([name, ok, detail]) => (
            <div key={name} className={`rounded-2xl border p-5 ${ok ? "border-emerald-500/20 bg-emerald-500/5" : "border-amber-500/20 bg-amber-500/5"}`}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-brand-cream">{name}</h3>
                <span className={ok ? "text-emerald-300" : "text-amber-300"}>{ok ? "OK" : "راجع"}</span>
              </div>
              <p className="mt-2 text-xs text-brand-cream/40">{detail}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
          <h3 className="font-semibold text-brand-gold">الأصول العامة</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/sitemap.xml" className="rounded-lg border border-brand-gold/15 px-3 py-2 text-xs text-brand-gold">Sitemap</Link>
            <Link href="/robots.txt" className="rounded-lg border border-brand-gold/15 px-3 py-2 text-xs text-brand-gold">Robots</Link>
            <Link href="/" className="rounded-lg border border-brand-gold/15 px-3 py-2 text-xs text-brand-gold">الموقع</Link>
          </div>
        </div>
      </section>
    </Container>
  );
}
