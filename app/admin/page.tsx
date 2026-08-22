export const dynamic = "force-dynamic";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { VideoUploadField } from "@/components/admin/video-upload-field";
import { CloudinaryImageUploadField } from "@/components/admin/cloudinary-image-upload-field";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { requireAdmin } from "@/lib/services/admin";
import { runApiHealthChecks } from "@/lib/services/api-health";
import { getVideoPublishingConfig } from "@/lib/services/video-automation";
import { supabaseServerAdminCount } from "@/lib/supabase/server";
import {
  saveArticleAction,
  saveCompetitionAction,
  saveMemorizationPlanAction,
  savePinnedMessageAction,
  saveSiteSettingAction,
  saveStoryAction,
  saveVideoPostAction,
} from "./actions";

async function countTable(table: string) {
  return supabaseServerAdminCount(table);
}

// ─── Styled field ─────────────────────────────────────────────────────────────
function Field(props: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  textarea?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-brand-cream/80">
        {props.label}
      </span>
      {props.textarea ? (
        <textarea
          name={props.name}
          required={props.required}
          defaultValue={props.defaultValue}
          placeholder={props.placeholder}
          rows={4}
          dir="rtl"
          className="w-full rounded-xl border border-brand-gold/20 bg-black/30 px-4 py-2.5 text-sm text-brand-cream placeholder:text-brand-cream/25 focus:border-brand-gold/50 focus:outline-none focus:ring-2 focus:ring-brand-gold/10 resize-none transition-colors"
        />
      ) : (
        <input
          name={props.name}
          type={props.type ?? "text"}
          required={props.required}
          defaultValue={props.defaultValue}
          placeholder={props.placeholder}
          dir="rtl"
          className="w-full rounded-xl border border-brand-gold/20 bg-black/30 px-4 py-2.5 text-sm text-brand-cream placeholder:text-brand-cream/25 focus:border-brand-gold/50 focus:outline-none focus:ring-2 focus:ring-brand-gold/10 transition-colors"
        />
      )}
    </label>
  );
}

function Published() {
  return (
    <label className="flex items-center gap-2.5 text-sm text-brand-cream/65 cursor-pointer select-none">
      <input
        name="published"
        type="checkbox"
        defaultChecked
        className="w-4 h-4 rounded border border-brand-gold/30 bg-black/30 accent-brand-gold"
      />
      نشر مباشرة
    </label>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  note,
  color = "text-brand-gold",
}: {
  label: string;
  value: number | string;
  note?: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-brand-gold/15 bg-black/25 p-5 space-y-1 hover:border-brand-gold/30 transition-colors">
      <p className="text-xs text-brand-cream/40">{note}</p>
      <p className={`text-3xl font-bold tabular-nums ${color}`}>
        {String(value)}
      </p>
      <p className="text-sm font-semibold text-brand-cream/70">{label}</p>
    </div>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-1 h-6 rounded-full bg-brand-gold" />
      <div>
        <h2 className="text-lg font-bold text-brand-gold">{title}</h2>
        {subtitle && (
          <p className="text-xs text-brand-cream/40 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// ─── Quick link card ──────────────────────────────────────────────────────────
function QuickLink({
  href,
  title,
  desc,
  badge,
}: {
  href: string;
  title: string;
  desc: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-brand-gold/15 bg-black/20 p-5 hover:border-brand-gold/40 hover:bg-black/30 transition-all duration-200 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-brand-gold group-hover:text-brand-goldSoft transition-colors">
          {title}
        </h3>
        {badge && (
          <span className="text-[9px] font-bold tracking-widest text-brand-gold/45 uppercase px-2 py-0.5 rounded-full border border-brand-gold/15">
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm text-brand-cream/45 leading-relaxed">{desc}</p>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-brand-gold/40 group-hover:text-brand-gold/70 transition-colors">
        <span>فتح</span>
        <svg
          viewBox="0 0 16 16"
          fill="currentColor"
          className="w-3 h-3 rotate-180"
        >
          <path
            fillRule="evenodd"
            d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </Link>
  );
}

// ─── API health badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ok: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    warning: "bg-amber-500/15 text-amber-300 border-amber-500/25",
    error: "bg-red-500/15 text-red-300 border-red-500/25",
  };
  const labels: Record<string, string> = {
    ok: "يعمل",
    warning: "تحذير",
    error: "خطأ",
  };
  return (
    <span
      className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full border ${map[status] ?? map.error}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

// ─── Mini bar chart (pure CSS) ────────────────────────────────────────────────
function MiniBar({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-brand-cream/55">{label}</span>
        <span className="text-brand-gold/70 font-semibold tabular-nums">
          {value.toLocaleString("ar-EG")}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-black/30 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-gold/70 to-brand-gold/40 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default async function AdminPage() {
  const admin = await requireAdmin();
  const [
    checks,
    storiesCount,
    competitionsCount,
    articlesCount,
    usersCount,
    videosCount,
    duasCount,
    socialQueueCount,
    prophetsCount,
    companionsCount,
    scholarsCount,
    conquestsCount,
    battlesCount,
    kidsCount,
    tawasheehCount,
    recitersCount,
    quranSurahsCount,
    hadithCount,
    publishingConfig,
  ] = await Promise.all([
    runApiHealthChecks(),
    countTable("stories"),
    countTable("competitions"),
    countTable("articles"),
    countTable("profiles"),
    countTable("videos"),
    countTable("duas"),
    countTable("social_publish_queue"),
    countTable("prophets"),
    countTable("companions"),
    countTable("scholars"),
    countTable("conquests"),
    countTable("battles"),
    countTable("kids_content"),
    countTable("tawasheeh"),
    countTable("quran_reciters"),
    countTable("quran_surahs"),
    countTable("hadiths"),
    getVideoPublishingConfig(),
  ]);

  const maxContent = Math.max(
    storiesCount,
    articlesCount,
    duasCount,
    videosCount,
    competitionsCount,
    1
  );

  return (
    <Container className="space-y-10 py-8 text-right">
      {/* Header */}
      <section className="space-y-1">
        <p className="text-xs text-brand-cream/35 tracking-widest uppercase">
          مرحبًا، {admin.display_name ?? admin.email ?? "Admin"}
        </p>
        <h1 className="text-3xl font-bold text-brand-gold" dir="rtl">
          لوحة تحكم ذِكرٌ
        </h1>
        <p
          className="text-sm text-brand-cream/45 max-w-2xl leading-relaxed"
          dir="rtl"
        >
          من هنا تتحكم في كل شيء — المحتوى، المستخدمون، الفيديوهات، إعدادات
          الموقع، وأكثر.
        </p>
      </section>

      <Card id="video-publishing-status" className="space-y-4 border-brand-gold/25 bg-black/25">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-brand-gold">جاهزية النشر التلقائي</h2>
            <p className="text-xs text-brand-cream/45">لا تظهر المفاتيح هنا؛ هذه مؤشرات وجود الإعدادات فقط.</p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs ${publishingConfig.autoPublish ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}`}>
            {publishingConfig.autoPublish ? "التشغيل التلقائي مفعّل" : "التشغيل التلقائي متوقف"}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className={`rounded-xl border px-4 py-3 ${publishingConfig.youtubeEnabled ? "border-emerald-500/25 bg-emerald-500/5" : "border-amber-500/25 bg-amber-500/5"}`}>
            <p className="font-semibold text-brand-cream">YouTube</p>
            <p className="text-sm text-brand-cream/60">{publishingConfig.youtubeEnabled ? "OAuth والرفع جاهزان" : "يحتاج YOUTUBE_CLIENT_ID وSECRET وREFRESH_TOKEN"}</p>
          </div>
          <div className={`rounded-xl border px-4 py-3 ${publishingConfig.facebookEnabled ? "border-emerald-500/25 bg-emerald-500/5" : "border-amber-500/25 bg-amber-500/5"}`}>
            <p className="font-semibold text-brand-cream">Facebook</p>
            <p className="text-sm text-brand-cream/60">{publishingConfig.facebookEnabled ? "Page ID وPage Access Token جاهزان" : "يحتاج FACEBOOK_PAGE_ID وPAGE_ACCESS_TOKEN"}</p>
          </div>
        </div>
      </Card>

      {/* Stats grid */}
      <section>
        <SectionHeading
          title="إحصائيات عامة"
          subtitle="أرقام مباشرة من قاعدة البيانات"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard
            label="المستخدمون"
            value={usersCount}
            note="حساب مسجل"
            color="text-brand-gold"
          />
          <StatCard label="القصص" value={storiesCount} note="قصة منشورة" />
          <StatCard label="المقالات" value={articlesCount} note="مقالة" />
          <StatCard label="الأدعية" value={duasCount} note="دعاء مأثور" />
          <StatCard label="الفيديوهات" value={videosCount} note="فيديو" />
          <StatCard
            label="طابور النشر"
            value={socialQueueCount}
            note="عنصر اجتماعي"
          />
          <StatCard label="المسابقات" value={competitionsCount} note="مسابقة" />
          <StatCard
            label="صلاحيتك"
            value="Admin"
            note="المستوى"
            color="text-emerald-300"
          />
          <StatCard
            label="API"
            value={`${checks.filter(c => c.status === "ok").length}/${checks.length}`}
            note="يعمل بشكل صحيح"
            color="text-sky-300"
          />
        </div>
      </section>

      {/* Full content inventory */}
      <section>
        <SectionHeading
          title="جرد محتوى الموقع"
          subtitle="أعداد حقيقية وروابط مباشرة للأقسام القابلة للإدارة"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "القرآن والسور", value: quranSurahsCount, href: "/admin/knowledge" },
            { label: "الأحاديث", value: hadithCount, href: "/admin/knowledge" },
            { label: "الأنبياء", value: prophetsCount, href: "/admin/prophets" },
            { label: "الصحابة", value: companionsCount, href: "/admin/knowledge" },
            { label: "العلماء", value: scholarsCount, href: "/admin/knowledge" },
            { label: "الغزوات", value: battlesCount, href: "/admin/battles" },
            { label: "الفتوحات", value: conquestsCount, href: "/conquests" },
            { label: "محتوى الأطفال", value: kidsCount, href: "/admin/kids" },
            { label: "التواشيح", value: tawasheehCount, href: "/tawasheeh" },
            { label: "القراء", value: recitersCount, href: "/reciters" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-2xl border border-brand-gold/12 bg-black/20 p-4 transition-colors hover:border-brand-gold/35 hover:bg-black/30"
            >
              <p className="text-xs text-brand-cream/50">{item.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-brand-gold">{item.value.toLocaleString("ar-EG")}</p>
              <p className="mt-1 text-[11px] text-brand-cream/35">فتح القسم ←</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Content distribution chart */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-4 p-6">
          <SectionHeading
            title="توزيع المحتوى"
            subtitle="مقارنة بصرية لأنواع المحتوى"
          />
          <div className="space-y-3">
            <MiniBar value={storiesCount} max={maxContent} label="القصص" />
            <MiniBar value={articlesCount} max={maxContent} label="المقالات" />
            <MiniBar value={duasCount} max={maxContent} label="الأدعية" />
            <MiniBar value={videosCount} max={maxContent} label="الفيديوهات" />
            <MiniBar
              value={competitionsCount}
              max={maxContent}
              label="المسابقات"
            />
          </div>
        </Card>

        {/* Quick links */}
        <div className="space-y-4">
          <SectionHeading title="الوصول السريع" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickLink
              href="/admin/content"
              title="إدارة المحتوى"
              desc="نشر وإخفاء وحذف القصص والمقالات"
              badge="محتوى"
            />
            <QuickLink
              href="/admin/knowledge"
              title="المعرفة الإسلامية"
              desc="تحرير الصحابة والعلماء والسور والأحاديث مع المصادر"
              badge="مراجعة"
            />
            <QuickLink
              href="/admin/sections"
              title="ترتيب الأقسام"
              desc="تحكم في ظهور وترتيب الأقسام"
              badge="تخصيص"
            />
            <QuickLink
              href="/admin/users"
              title="المستخدمون"
              desc="الأدوار والصلاحيات وقائمة الحسابات"
              badge="مستخدمون"
            />
            <QuickLink
              href="/admin/analytics"
              title="التحليلات"
              desc="إحصائيات المحتوى والمشاهدات"
              badge="بيانات"
            />
            <QuickLink
              href="/admin/videos"
              title="الفيديوهات"
              desc="مزامنة يوتيوب وإدارة الفيديوهات"
              badge="فيديو"
            />
            <QuickLink
              href="/admin/social"
              title="النشر التلقائي"
              desc="متابعة طابور فيسبوك ويوتيوب والبوستات"
              badge="Social"
            />
            <QuickLink
              href="/admin/kids"
              title="قسم الأطفال"
              desc="قصص وألعاب وفيديوهات للأطفال"
              badge="أطفال"
            />
          </div>
        </div>
      </section>

      {/* API health */}
      <section>
        <SectionHeading
          title="حالة الـ API"
          subtitle="مراجعة شاملة لكل الخدمات المتصلة"
        />
        <div className="grid gap-3 md:grid-cols-2">
          {checks.map(check => (
            <div
              key={check.name}
              className="flex items-start gap-4 rounded-2xl border border-brand-gold/12 bg-black/20 p-4 hover:border-brand-gold/25 transition-colors"
            >
              <StatusBadge status={check.status} />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-brand-cream text-sm">
                  {check.name}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-brand-cream/45">
                  {check.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Forms grid */}
      <section>
        <SectionHeading
          title="إضافة محتوى"
          subtitle="أضف قصص، مسابقات، خطط حفظ، ورسائل مثبتة"
        />
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Site settings */}
          <Card className="space-y-5 p-6">
            <h2 className="text-base font-bold text-brand-gold" dir="rtl">
              إعدادات الموقع العامة
            </h2>
            <form action={saveSiteSettingAction} className="space-y-4">
              <input type="hidden" name="key" value="homepage" />
              <Field name="title" label="العنوان الرئيسي" placeholder="ذِكرٌ" />
              <Field name="body" label="وصف الصفحة الرئيسية" textarea />
              <CloudinaryImageUploadField name="imageUrl" label="صورة الهيرو" folder="homepage" />
              <CloudinaryImageUploadField name="logoUrl" label="اللوجو" folder="branding" />
              <Field
                name="youtubeChannelUrl"
                label="رابط قناة يوتيوب"
                placeholder="https://youtube.com/..."
              />
              <Field
                name="pinnedMessage"
                label="رسالة مثبتة أعلى الموقع"
                textarea
              />
              <Button type="submit" className="w-full">
                حفظ إعدادات الموقع
              </Button>
            </form>
          </Card>

          {/* Add story */}
          <Card className="space-y-5 p-6">
            <h2 className="text-base font-bold text-brand-gold" dir="rtl">
              إضافة قصة
            </h2>
            <form action={saveStoryAction} className="space-y-4">
              <Field name="title" label="عنوان القصة" required />
              <Field
                name="slug"
                label="الرابط المختصر (slug)"
                required
                placeholder="story-slug"
              />
              <Field name="category" label="التصنيف" defaultValue="faith" />
              <Field
                name="mood"
                label="الوسم / الحالة"
                placeholder="inspiring"
              />
              <CloudinaryImageUploadField name="coverImage" label="صورة الغلاف" folder="stories" />
              <Field name="content" label="محتوى القصة" required textarea />
              <div className="flex items-center justify-between">
                <Published />
                <Button type="submit">نشر القصة</Button>
              </div>
            </form>
          </Card>

          {/* Article / post publishing */}
          <Card className="space-y-5 p-6">
            <h2 className="text-base font-bold text-brand-gold" dir="rtl">
              نشر بوست أو مقال
            </h2>
            <form action={saveArticleAction} className="space-y-4">
              <Field name="title" label="العنوان" required />
              <Field
                name="slug"
                label="الرابط المختصر"
                required
                placeholder="article-slug"
              />
              <Field name="summary" label="ملخص يصلح لفيسبوك" textarea />
              <CloudinaryImageUploadField name="imageUrl" label="صورة المقال" folder="articles" />
              <Field name="author" label="الكاتب" defaultValue="ZIKR" />
              <Field
                name="content"
                label="نص المقال / البوست"
                required
                textarea
              />
              <Field
                name="scheduledAt"
                label="موعد النشر الاجتماعي"
                type="datetime-local"
              />
              <div className="flex flex-wrap items-center gap-4 text-sm text-brand-cream/65">
                <Published />
                <label>
                  <input
                    name="share_facebook"
                    type="checkbox"
                    className="ml-2 accent-brand-gold"
                  />
                  مشاركة على فيسبوك
                </label>
                <label>
                  <input
                    name="share_youtube"
                    type="checkbox"
                    className="ml-2 accent-brand-gold"
                  />
                  إضافة لقائمة نشر يوتيوب
                </label>
              </div>
              <Button type="submit" className="w-full">
                حفظ ونشر المقال
              </Button>
            </form>
          </Card>

          {/* Video / media publishing */}
          <Card id="video-publish" className="space-y-5 p-6">
            <h2 className="text-base font-bold text-brand-gold" dir="rtl">
              نشر فيديو أو صورة
            </h2>
            <form action={saveVideoPostAction} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field name="title" label="عنوان الفيديو" required />
                <Field
                  name="slug"
                  label="الرابط المختصر"
                  required
                  placeholder="video-slug"
                />
              </div>
              <Field name="description" label="الوصف" textarea />
              <Field
                name="caption"
                label="الكابشن / نص المنشور على Facebook"
                textarea
                placeholder="النص الذي سيظهر مع المنشور على Facebook وReels"
              />
              <VideoUploadField />
              <Field
                name="youtubeId"
                label="YouTube Video ID"
                placeholder="مثال: dQw4w9WgXcQ"
              />
              <CloudinaryImageUploadField name="thumbnailUrl" label="الصورة المصغرة" folder="videos" />
              <Field
                name="script"
                label="نص الفيديو (اختياري عند طلب التوليد)"
                placeholder="اكتب النص المراجَع الذي سيُستخدم في الفيديو"
                textarea
              />
              <Field
                name="scheduledAt"
                label="موعد النشر التلقائي"
                type="datetime-local"
              />
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-sm text-brand-cream/65">
                  <span>التصنيف</span>
                  <select
                    name="category"
                    defaultValue="story"
                    className="rounded-lg border border-brand-gold/30 bg-black/30 px-3 py-2 text-brand-cream focus:border-brand-gold focus:outline-none"
                  >
                    <option value="quran">القرآن</option>
                    <option value="hadith">الحديث</option>
                    <option value="story">قصة إسلامية</option>
                    <option value="dua">دعاء</option>
                    <option value="adhkar">أذكار</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 pt-7 text-sm text-brand-cream/65">
                  <input
                    name="generateVideo"
                    type="checkbox"
                    className="accent-brand-gold"
                  />
                  توليد فيديو تلقائي
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-brand-cream/65">
                <Published />
                <label>
                  <input
                    name="share_facebook"
                    type="checkbox"
                    className="ml-2 accent-brand-gold"
                  />
                  مشاركة فيسبوك
                </label>
                <label>
                  <input
                    name="share_facebook_reels"
                    type="checkbox"
                    className="ml-2 accent-brand-gold"
                  />
                  نشر Reel على فيسبوك
                </label>
                <label>
                  <input
                    name="share_youtube"
                    type="checkbox"
                    className="ml-2 accent-brand-gold"
                  />
                  نشر/رفع يوتيوب Shorts
                </label>
                <p className="basis-full text-xs text-brand-cream/50">
                  ارفع ملف الفيديو من الحقل السابق، أو فعّل التوليد التلقائي بعد إدخال نص مراجع. لا حاجة لإدخال أي رابط فيديو يدويًا.
                </p>
              </div>
              <Button type="submit" className="w-full">
                حفظ وتجهيز النشر
              </Button>
            </form>
          </Card>

          {/* Add competition */}
          <Card className="space-y-5 p-6">
            <h2 className="text-base font-bold text-brand-gold" dir="rtl">
              إضافة مسابقة
            </h2>
            <form action={saveCompetitionAction} className="space-y-4">
              <Field name="title" label="عنوان المسابقة" required />
              <Field name="description" label="وصف المسابقة" textarea />
              <Field name="rules" label="الشروط وطريقة الاشتراك" textarea />
              <Field name="prize" label="الجائزة" placeholder="جائزة قيّمة" />
              <CloudinaryImageUploadField name="imageUrl" label="صورة المسابقة" folder="competitions" />
              <div className="grid grid-cols-2 gap-3">
                <Field
                  name="startsAt"
                  label="تاريخ البداية"
                  type="datetime-local"
                />
                <Field
                  name="endsAt"
                  label="تاريخ النهاية"
                  type="datetime-local"
                />
              </div>
              <div className="flex items-center justify-between">
                <Published />
                <Button type="submit">إضافة المسابقة</Button>
              </div>
            </form>
          </Card>

          {/* Pinned message */}
          <Card className="space-y-5 p-6">
            <h2 className="text-base font-bold text-brand-gold" dir="rtl">
              رسالة مثبتة
            </h2>
            <form action={savePinnedMessageAction} className="space-y-4">
              <Field name="title" label="العنوان" defaultValue="تنبيه مهم" />
              <Field name="body" label="نص الرسالة" required textarea />
              <div className="grid grid-cols-2 gap-3">
                <Field
                  name="type"
                  label="النوع"
                  placeholder="info / warning / announcement"
                  defaultValue="info"
                />
                <Field
                  name="priority"
                  label="الأولوية"
                  type="number"
                  defaultValue="0"
                />
              </div>
              <div className="flex items-center justify-between">
                <Published />
                <Button type="submit">تثبيت الرسالة</Button>
              </div>
            </form>
          </Card>

          {/* Social links */}
          <Card className="space-y-5 p-6">
            <h2 className="text-base font-bold text-brand-gold" dir="rtl">
              روابط التواصل الاجتماعي
            </h2>
            <form action={saveSiteSettingAction} className="space-y-4">
              <input type="hidden" name="key" value="social" />
              <Field
                name="facebookPageUrl"
                label="فيسبوك"
                placeholder="https://facebook.com/..."
                defaultValue="https://www.facebook.com/zikrmediaofficial1"
              />
              <Field
                name="youtubeChannelUrl"
                label="يوتيوب"
                placeholder="https://youtube.com/..."
              />
              <Field
                name="twitterUrl"
                label="تويتر / X"
                placeholder="https://x.com/..."
              />
              <Field
                name="instagramUrl"
                label="إنستغرام"
                placeholder="https://instagram.com/..."
              />
              <Button type="submit" className="w-full">
                حفظ روابط التواصل
              </Button>
            </form>
          </Card>

          {/* Memorization plan */}
          <Card className="space-y-5 p-6">
            <h2 className="text-base font-bold text-brand-gold" dir="rtl">
              خطة حفظ قرآنية
            </h2>
            <form action={saveMemorizationPlanAction} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field name="title" label="اسم الخطة" required />
                <Field
                  name="cadence"
                  label="التكرار"
                  placeholder="daily / weekly"
                  defaultValue="daily"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  name="targetRef"
                  label="المقرر"
                  placeholder="البقرة 1-5"
                />
                <Field
                  name="tajweedFocus"
                  label="تركيز التجويد"
                  placeholder="الغنة، المدود"
                />
              </div>
              <Field name="prompt" label="سؤال أكمل / تسميع" textarea />
              <div className="flex items-center justify-between">
                <Published />
                <Button type="submit">إضافة الخطة</Button>
              </div>
            </form>
          </Card>
        </div>
      </section>
    </Container>
  );
}
