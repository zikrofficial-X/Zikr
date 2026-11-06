import Link from "next/link";
import {
  Activity,
  ArrowUpLeft,
  BarChart3,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  Globe2,
  Search,
  Send,
  Share2,
  Wallet,
  Clock3,
  Users,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getTrafficRevenueSnapshot } from "@/features/admin/services/traffic-revenue";

const format = (value: number | null) =>
  value === null ? "غير متاح" : value.toLocaleString("ar-EG-u-nu-latn");

const platformLabels: Record<string, string> = {
  facebook: "Facebook",
  facebook_reels: "Facebook Reels",
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
  telegram: "Telegram",
  pinterest: "Pinterest",
  x: "X",
  whatsapp: "WhatsApp",
};

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: number | null;
  note: string;
  icon: typeof Activity;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-brand-cream/55">{label}</p>
          <p className="mt-3 text-2xl font-bold tabular-nums text-brand-cream">{format(value)}</p>
          <p className="mt-1 text-xs leading-5 text-brand-cream/40">{note}</p>
        </div>
        <span className="rounded-xl border border-brand-gold/15 bg-brand-gold/10 p-2 text-brand-gold">
          <Icon size={18} />
        </span>
      </div>
    </Card>
  );
}

export async function TrafficRevenuePanel() {
  const snapshot = await getTrafficRevenueSnapshot();
  const metrics = snapshot.metrics;
  const platforms = snapshot.socialProfiles ?? [];

  return (
    <section className="mt-8 space-y-6" dir="rtl" aria-labelledby="traffic-revenue-heading">
      <header className="rounded-3xl border border-brand-gold/15 bg-gradient-to-br from-brand-gold/10 via-black/20 to-black/5 p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.16em] text-brand-cream/35">GROWTH / TRAFFIC / MONETIZATION</p>
            <h2 id="traffic-revenue-heading" className="mt-2 text-2xl font-bold text-brand-gold">
              محرك الزيارات والإيرادات
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-brand-cream/55">
              مركز موحّد لجذب جمهور حقيقي، ومتابعة قنوات التوزيع، وقياس أداء المحتوى وتحقيق الدخل دون تكرار أنظمة النشر الحالية.
            </p>
          </div>
          <Badge variant="outline" className="border-emerald-400/25 text-emerald-200/80">
            <Activity size={13} className="ml-1" /> قراءة تشغيلية مباشرة
          </Badge>
        </div>
        <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm leading-7 text-amber-100/80">
          الزيارات والأرباح لا تُحسب من فتح الموقع آليًا. أرقام الزيارات وظهور Monetag والأرباح لن تظهر إلا بعد ربط تقارير المصدر الحقيقي. لا يستخدم هذا المحرك تحديث الصفحات أو النقرات الاصطناعية.
        </div>
      </header>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-brand-cream">مؤشرات النمو وتحقيق الدخل</h3>
          <span className="text-xs text-brand-cream/35">
            آخر قراءة: {new Date(snapshot.generatedAt).toLocaleString("ar-EG-u-nu-latn")}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="زيارات الموقع الحقيقية" value={null} note="يلزم اتصال تقارير GA4" icon={Globe2} />
          <MetricCard label="مرات ظهور Monetag" value={null} note="يلزم استيراد تقرير الناشر" icon={BarChart3} />
          <MetricCard label="أرباح Monetag" value={null} note="لا توجد مزامنة أرباح متصلة بعد" icon={Wallet} />
          <MetricCard label="مقالات منشورة" value={metrics.publishedArticles} note="عدد دقيق من قاعدة البيانات" icon={Search} />
          <MetricCard label="فيديوهات منشورة" value={metrics.publishedVideos} note="عدد دقيق من قاعدة البيانات" icon={Share2} />
          <MetricCard label="منشورات منشورة" value={metrics.socialPublished} note="سجل طابور النشر الاجتماعي" icon={CheckCircle2} />
          <MetricCard label="منشورات في الانتظار" value={metrics.socialQueued} note="تُعالج بواسطة الناشر الحالي" icon={Send} />
          <MetricCard label="منشورات فاشلة" value={metrics.socialFailed} note="تحتاج مراجعة قبل إعادة المحاولة" icon={CircleHelp} />
          <MetricCard label="منشورات جزئية" value={metrics.socialPartial} note="لم تكتمل على كل المنصات المستهدفة" icon={CircleHelp} />
          <MetricCard label="منشورات قيد المعالجة" value={metrics.socialProcessing} note="ممسوكة بواسطة عامل النشر" icon={Activity} />
          <MetricCard label="محاولات فيديو معادة" value={metrics.videoRetryPending} note="لها موعد إعادة محاولة مسجل" icon={Clock3} />
          <MetricCard label="متوسط رندر الفيديو (ث)" value={metrics.averageRenderDurationMs7d === null ? null : Math.round(metrics.averageRenderDurationMs7d / 1000)} note="متوسط آخر 7 أيام UTC" icon={Clock3} />
        </div>
      </div>


      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-brand-cream">اتجاهات التشغيل — آخر 24 ساعة و7 أيام</h3>
          <span className="text-[11px] text-brand-cream/35">كل الفترات محسوبة بتوقيت UTC حتى {snapshot.period.end}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="منشورات أُنشئت خلال 24 ساعة" value={metrics.socialCreated24h} note="تاريخ إنشاء عناصر الطابور" icon={Send} />
          <MetricCard label="منشورات نُشرت خلال 24 ساعة" value={metrics.socialPublished24h} note="من تاريخ النشر الفعلي" icon={CheckCircle2} />
          <MetricCard label="منشورات أُنشئت خلال 7 أيام" value={metrics.socialCreated7d} note="تاريخ إنشاء عناصر الطابور" icon={Send} />
          <MetricCard label="منشورات نُشرت خلال 7 أيام" value={metrics.socialPublished7d} note="من تاريخ النشر الفعلي" icon={CheckCircle2} />
          <MetricCard label="طلبات فيديو خلال 24 ساعة" value={metrics.videoRequested24h} note="تاريخ إنشاء الطلب" icon={Activity} />
          <MetricCard label="فيديوهات اكتملت خلال 24 ساعة" value={metrics.videoCompleted24h} note="من تاريخ آخر تحديث لطلب مكتمل" icon={CheckCircle2} />
          <MetricCard label="طلبات فيديو خلال 7 أيام" value={metrics.videoRequested7d} note="تاريخ إنشاء الطلب" icon={Activity} />
          <MetricCard label="فيديوهات اكتملت خلال 7 أيام" value={metrics.videoCompleted7d} note="من تاريخ آخر تحديث لطلب مكتمل" icon={CheckCircle2} />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-bold text-brand-cream">نتائج النشر لكل منصة</h3>
          <Badge variant="outline">{snapshot.socialPlatformStatsComplete ? "قراءة مكتملة" : "بيانات غير مكتملة"}</Badge>
        </div>
        {snapshot.socialPlatformStatsComplete && snapshot.socialPlatformStats ? (
          <Card className="overflow-hidden p-0">
            <div className="grid grid-cols-2 sm:grid-cols-2 sm:grid-cols-5 gap-2 border-b border-brand-gold/10 px-4 py-3 text-[11px] text-brand-cream/40">
              <span>المنصة</span><span className="text-center">عمليات تسليم</span><span className="text-center">نجاح</span><span className="text-center">فشل</span><span className="text-center">معرّفات بعيدة</span>
            </div>
            {snapshot.socialPlatformStats.map((item) => (
              <div key={item.platform} className="grid grid-cols-2 sm:grid-cols-2 sm:grid-cols-5 gap-2 border-b border-brand-gold/5 px-4 py-3 text-xs last:border-0">
                <span className="font-semibold text-brand-cream/80">{platformLabels[item.platform] ?? item.platform}</span>
                <span className="text-center tabular-nums text-brand-cream/65">{format(item.deliveries)}</span>
                <span className="text-center tabular-nums text-emerald-200/80">{format(item.successful)}</span>
                <span className="text-center tabular-nums text-amber-100/75">{format(item.failed)}</span>
                <span className="text-center tabular-nums text-brand-cream/65">{format(item.remoteIds)}</span>
              </div>
            ))}
            <p className="px-4 pb-3 text-[10px] leading-5 text-brand-cream/35">
              المعرّفات البعيدة تُحتسب فقط؛ لا تعرض اللوحة معرّفات النشر أو رموز الوصول نفسها.
            </p>
          </Card>
        ) : (
          <Card className="p-4 text-xs leading-6 text-brand-cream/45">
            تعذر تحميل سجل نتائج المنصات كاملًا. لن تُعرض مجاميع جزئية على أنها إجماليات نهائية.
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-brand-cream">تحليلات زيارات الموقع — Google Analytics 4</h3>
          <Badge variant="outline" className={snapshot.integrations.ga4ReportingConnected ? "border-emerald-400/20 text-emerald-200/80" : "border-amber-300/20 text-amber-100/75"}>
            {snapshot.integrations.ga4ReportingConnected ? "تقارير GA4 متصلة" : snapshot.ga4Analytics.status === "authorization_required" ? "تحتاج إعادة تفويض" : "غير متصلة"}
          </Badge>
        </div>
        {snapshot.ga4Analytics.status === "connected" ? (
          <>
            <p className="text-xs leading-5 text-brand-cream/45">آخر 28 يومًا مكتملة وفق المنطقة الزمنية لخاصية GA4؛ التحديث كل ساعة.</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="المستخدمون النشطون" value={snapshot.ga4Analytics.activeUsers} note="GA4 Data API" icon={Users} />
              <MetricCard label="الجلسات" value={snapshot.ga4Analytics.sessions} note="جلسات الموقع" icon={Activity} />
              <MetricCard label="مشاهدات الصفحات" value={snapshot.ga4Analytics.pageViews} note="screenPageViews" icon={Eye} />
              <MetricCard label="معدل التفاعل (%)" value={snapshot.ga4Analytics.engagementRate === null ? null : Number((snapshot.ga4Analytics.engagementRate * 100).toFixed(2))} note="معدل الجلسات المتفاعلة" icon={BarChart3} />
              <MetricCard label="الأحداث" value={snapshot.ga4Analytics.events} note="إجمالي الأحداث المسجلة" icon={CheckCircle2} />
              <MetricCard label="الأحداث الرئيسية" value={snapshot.ga4Analytics.keyEvents} note="Key events في GA4" icon={CheckCircle2} />
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <Card className="p-5">
                <h4 className="font-semibold text-brand-gold">قنوات الزيارات</h4>
                {snapshot.ga4Analytics.channels?.length ? (
                  <div className="mt-3 divide-y divide-brand-gold/10">
                    {snapshot.ga4Analytics.channels.map((channel) => (
                      <div key={channel.channel} className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm">
                        <span className="text-brand-cream/80">{channel.channel}</span>
                        <span className="tabular-nums text-brand-cream/65">{format(channel.sessions)} جلسة · {format(channel.activeUsers)} مستخدم</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="mt-3 text-xs text-brand-cream/45">لا توجد بيانات قنوات للفترة المحددة.</p>}
              </Card>
              <Card className="p-5">
                <h4 className="font-semibold text-brand-gold">أهم صفحات الدخول</h4>
                {snapshot.ga4Analytics.landingPages?.length ? (
                  <div className="mt-3 divide-y divide-brand-gold/10">
                    {snapshot.ga4Analytics.landingPages.map((page) => (
                      <div key={page.page} className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm">
                        <span className="max-w-[65%] truncate text-brand-cream/80" dir="ltr">{page.page}</span>
                        <span className="tabular-nums text-brand-cream/65">{format(page.sessions)} جلسة</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="mt-3 text-xs text-brand-cream/45">لا توجد صفحات دخول للفترة المحددة.</p>}
              </Card>
            </div>
          </>
        ) : (
          <Card className="p-5">
            <p className="text-sm leading-7 text-brand-cream/65">
              {snapshot.ga4Analytics.status === "authorization_required"
                ? "رمز GA4 لا يملك صلاحية analytics.readonly أو لا يستطيع الوصول إلى خاصية GA4. أعد التفويض بعد تفعيل Google Analytics Data API ومنح حساب Google صلاحية قراءة للخاصية."
                : snapshot.ga4Analytics.status === "not_configured"
                  ? "يلزم إعداد GOOGLE_CLIENT_ID وGOOGLE_CLIENT_SECRET وGA4_REFRESH_TOKEN وGA4_PROPERTY_ID. لا يكفي وجود Measurement ID لقراءة التقارير."
                  : "تعذر الوصول إلى تقارير GA4 حاليًا. لم يتم استبدال البيانات المفقودة بأصفار."}
            </p>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-brand-cream">تحليلات قناة YouTube</h3>
          <Badge variant="outline" className={snapshot.integrations.youtubeAnalyticsConnected ? "border-emerald-400/20 text-emerald-200/80" : "border-amber-300/20 text-amber-100/75"}>
            {snapshot.integrations.youtubeAnalyticsConnected ? "بيانات مالك القناة متصلة" : snapshot.youtubeAnalytics.status === "authorization_required" ? "تحتاج إعادة تفويض" : "غير متصلة"}
          </Badge>
        </div>
        {snapshot.youtubeAnalytics.status === "connected" ? (
          <>
            <p className="text-xs leading-5 text-brand-cream/45">
              الفترة: {snapshot.youtubeAnalytics.startDate} إلى {snapshot.youtubeAnalytics.endDate}. تُحدّث البيانات كل ساعة.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="مشاهدات YouTube" value={snapshot.youtubeAnalytics.views} note="تقارير مالك القناة" icon={Eye} />
              <MetricCard label="ساعات المشاهدة" value={snapshot.youtubeAnalytics.estimatedMinutesWatched === null ? null : Math.round(snapshot.youtubeAnalytics.estimatedMinutesWatched / 60)} note="من إجمالي دقائق المشاهدة" icon={Clock3} />
              <MetricCard label="متوسط مدة المشاهدة (ث)" value={snapshot.youtubeAnalytics.averageViewDurationSeconds} note="متوسط القناة خلال الفترة" icon={Activity} />
              <MetricCard label="نسبة المشاهدة المتوسطة (%)" value={snapshot.youtubeAnalytics.averageViewPercentage} note="متوسط نسبة الفيديو المشاهدة" icon={BarChart3} />
              <MetricCard label="المشتركون المكتسبون" value={snapshot.youtubeAnalytics.subscribersGained} note="خلال الفترة المحددة" icon={Users} />
              <MetricCard label="المشتركون المفقودون" value={snapshot.youtubeAnalytics.subscribersLost} note="خلال الفترة المحددة" icon={Users} />
              <MetricCard label="الإعجابات" value={snapshot.youtubeAnalytics.likes} note="تفاعل على فيديوهات القناة" icon={CheckCircle2} />
              <MetricCard label="المشاركات" value={snapshot.youtubeAnalytics.shares} note="مشاركة فيديوهات القناة" icon={Share2} />
            </div>
            {snapshot.youtubeAnalytics.trafficSources ? (
              <Card className="p-5">
                <h4 className="font-semibold text-brand-gold">مصادر الزيارات إلى فيديوهات القناة</h4>
                {snapshot.youtubeAnalytics.trafficSources.length ? (
                  <div className="mt-3 divide-y divide-brand-gold/10">
                    {snapshot.youtubeAnalytics.trafficSources.map((source) => (
                      <div key={source.source} className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm">
                        <span className="text-brand-cream/80">{source.source}</span>
                        <span className="tabular-nums text-brand-cream/65">{format(source.views)} مشاهدة · {format(Math.round(source.watchMinutes / 60))} ساعة مشاهدة</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="mt-3 text-xs text-brand-cream/45">لم تُرجع المنصة مصادر زيارات لهذه الفترة.</p>}
              </Card>
            ) : null}
          </>
        ) : (
          <Card className="p-5">
            <p className="text-sm leading-7 text-brand-cream/65">
              {snapshot.youtubeAnalytics.status === "authorization_required"
                ? "بيانات YouTube العامة تعمل، لكن رمز OAuth الحالي لا يملك صلاحية تقارير Analytics. يلزم إعادة تفويض القناة بصلاحية yt-analytics.readonly ثم تحديث YOUTUBE_REFRESH_TOKEN في إعدادات Vercel."
                : snapshot.youtubeAnalytics.status === "not_configured"
                  ? "يلزم ضبط YOUTUBE_CLIENT_ID وYOUTUBE_CLIENT_SECRET وYOUTUBE_REFRESH_TOKEN على بيئة الإنتاج."
                  : "تعذر الوصول إلى تقارير YouTube Analytics حاليًا. لم يتم استبدال البيانات المفقودة بأصفار."}
            </p>
          </Card>
        )}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-brand-gold">حالة مصادر البيانات</h3>
            <Badge variant="outline">التكاملات</Badge>
          </div>
          <div className="mt-4 divide-y divide-brand-gold/10">
            <div className="flex items-start justify-between gap-3 py-3">
              <div>
                <p className="font-semibold text-brand-cream">Google Analytics 4</p>
                <p className="mt-1 text-xs leading-5 text-brand-cream/45">
                  {snapshot.integrations.ga4MeasurementConfigured
                    ? "معرّف القياس متاح في إعدادات تشغيل التطبيق؛ واجهة التقارير البرمجية لم تُربط بعد."
                    : "معرّف القياس غير متاح في بيئة تشغيل التطبيق الحالية."}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0 border-amber-300/20 text-amber-100/75">التقارير غير متصلة</Badge>
            </div>
            <div className="flex items-start justify-between gap-3 py-3">
              <div>
                <p className="font-semibold text-brand-cream">Monetag</p>
                <p className="mt-1 text-xs leading-5 text-brand-cream/45">
                  وسم التحقق ورابط SmartLink موجودان في الكود. مزامنة مرات الظهور والأرباح غير متصلة.
                </p>
                <a
                  href="https://publishers.monetag.com"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-brand-gold hover:underline"
                >
                  فتح لوحة Monetag <ExternalLink size={12} />
                </a>
              </div>
              <Badge variant="outline" className="shrink-0 border-amber-300/20 text-amber-100/75">التقارير غير متصلة</Badge>
            </div>
          </div>
          {snapshot.unavailable.length > 0 ? (
            <p role="status" className="mt-3 text-xs leading-6 text-amber-100/65">
              تعذر قراءة: {snapshot.unavailable.join("، ")}. عُرضت كبيانات غير متاحة بدلًا من أصفار غير مؤكدة.
            </p>
          ) : null}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-brand-gold">قنوات التوزيع</h3>
            <Badge variant="outline">{platforms.length} ملفات تعريف مسجلة</Badge>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {["facebook", "youtube", "instagram", "tiktok", "telegram", "whatsapp", "pinterest", "x"].map((platform) => {
              const profile = platforms.find((item) => item.platform.toLowerCase() === platform);
              const connected = Boolean(profile);
              const label = platformLabels[platform] ?? platform;
              const Icon = platform === "telegram" ? Send : platform === "youtube" ? Share2 : platform === "instagram" ? Globe2 : Share2;
              return (
                <div key={platform} className="flex items-center justify-between gap-2 rounded-xl border border-brand-gold/10 bg-black/10 p-3">
                  <span className="flex min-w-0 items-center gap-2 text-sm text-brand-cream/80">
                    <Icon size={16} className="shrink-0 text-brand-gold/70" />
                    <span className="truncate">{label}</span>
                  </span>
                  <Badge variant="outline" className={connected ? "shrink-0 border-emerald-400/20 text-emerald-200/80" : "shrink-0 border-white/10 text-brand-cream/35"}>
                    {connected ? (profile?.status === "ok" ? "تمت المزامنة" : "ملف موجود") : "غير مربوط"}
                  </Badge>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs leading-6 text-brand-cream/40">
            وجود ملف منصة لا يعني أن صلاحية النشر أو الرمز ما زالا صالحين؛ تُفحص صلاحية النشر داخل مركز النشر قبل أي عملية.
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-bold text-brand-gold">مراكز التشغيل الحالية</h3>
        <p className="mt-1 text-xs leading-6 text-brand-cream/45">
          إعادة استخدام الأنظمة الموجودة بدل تشغيل مجدولات متعارضة أو إنشاء طوابير مكررة.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Link href="/admin/social" className="flex items-center justify-between gap-3 rounded-xl border border-brand-gold/10 p-3 text-sm text-brand-cream/80 transition hover:border-brand-gold/30 hover:bg-brand-gold/5">
            مركز النشر الاجتماعي <ArrowUpLeft size={16} className="text-brand-gold" />
          </Link>
          <Link href="/admin/seo" className="flex items-center justify-between gap-3 rounded-xl border border-brand-gold/10 p-3 text-sm text-brand-cream/80 transition hover:border-brand-gold/30 hover:bg-brand-gold/5">
            إعدادات SEO <ArrowUpLeft size={16} className="text-brand-gold" />
          </Link>
          <Link href="/admin/automation" className="flex items-center justify-between gap-3 rounded-xl border border-brand-gold/10 p-3 text-sm text-brand-cream/80 transition hover:border-brand-gold/30 hover:bg-brand-gold/5">
            مركز الأتمتة <ArrowUpLeft size={16} className="text-brand-gold" />
          </Link>
        </div>
      </Card>
    </section>
  );
}
