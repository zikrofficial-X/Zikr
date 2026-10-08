export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { getAdminHealth } from "@/features/admin/services/platform";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import { getLatestStableAndroidRelease } from "@/features/releases/services/github-android-release";
import { createAndroidReleaseAction } from "./actions";

export const metadata: Metadata = { title: "مركز الإصدار | الأدمن" };

const checks = [
  ["التحقق الآلي", "CircleCI → ci-check"],
  ["بناء الإنتاج", "Vercel / production release"],
  ["سلامة الترحيلات", "pnpm supabase:migrations:check"],
  ["سلامة المسارات", "pnpm routes:check"],
  ["جاهزية الهاتف", "pnpm mobile:check"],
  ["إصدار Android", "APK + AAB + SHA256SUMS + توقيع"],
] as const;

type Operation = {
  status?: string;
  tag?: string;
  version?: string;
  versionCode?: number;
  commitSha?: string;
  releaseId?: number | null;
  releaseUrl?: string | null;
  startedAt?: string;
  startedBy?: string | null;
  note?: string;
};

export default async function AdminReleasePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPermission("release.manage");

  const health = await getAdminHealth();
  const [operationRows, latestAndroidRelease] = await Promise.all([
    supabaseServerAdminRequest<Array<{ value?: unknown }>>(
      "/rest/v1/admin_settings?key=eq.android_release_operation&select=value&limit=1",
      { method: "GET" },
    ).catch(() => []),
    getLatestStableAndroidRelease().catch(() => null),
  ]);

  const operation = (operationRows?.[0]?.value ?? null) as Operation | null;
  const params = await searchParams;
  const startedTag =
    typeof params.android_release === "string" &&
    typeof params.tag === "string"
      ? params.tag
      : null;
  const operationIsActive = Boolean(
    operation?.status === "building" &&
      operation.startedAt &&
      Date.now() - Date.parse(operation.startedAt) < 6 * 60 * 60 * 1000,
  );

  const releaseError = typeof params.android_release_error === "string" ? params.android_release_error.slice(0, 300) : null;

  const branch = process.env.VERCEL_GIT_COMMIT_REF ?? "غير متاح";
  const commit = process.env.VERCEL_GIT_COMMIT_SHA ?? "غير متاح خارج Vercel";

  return (
    <Container className="py-10 space-y-6" dir="rtl">
      <header>
        <p className="text-xs tracking-[0.18em] text-brand-cream/30">إدارة الإصدار</p>
        <h1 className="mt-2 text-3xl font-bold text-brand-gold">مركز الإصدار</h1>
        <p className="mt-2 max-w-4xl text-sm leading-7 text-brand-cream/50">
          مركز واحد لإطلاق إصدار Android رسمي من أحدث نسخة على main. الزر ينشئ
          version جديدًا، يحدّث metadata، وينشئ Git tag موثقًا وDraft Release.
          يجب التأكد من ظهور pipeline الوسم في CircleCI؛ شغّله يدويًا إذا لم يبدأ تلقائيًا،
          ولا تنشر الـRelease قبل نجاح فحوص APK/AAB والتوقيع وSHA-256.
        </p>
      </header>

      {releaseError ? (
        <section role="alert" className="rounded-2xl border border-red-500/25 bg-red-500/5 p-5 text-sm leading-7 text-red-200">
          تعذر إنشاء إصدار Android: {releaseError}
        </section>
      ) : null}

      {startedTag ? (
        <section className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5">
          <h2 className="font-semibold text-emerald-300">تم إطلاق عملية الإصدار</h2>
          <p className="mt-2 text-sm leading-7 text-brand-cream/70">
            تم إنشاء <span className="font-mono text-brand-gold">{startedTag}</span> كـGit tag وإنشاء Draft Release.
            تحقق من pipeline الخاص بالوسم في CircleCI؛ إذا لم يبدأ تلقائيًا فشغّله يدويًا.
            سيظل الإصدار غير عام حتى تنجح فحوص APK/AAB.
          </p>
          <a
            href="https://app.circleci.com/pipelines/github/zikr-org/Zikr"
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 inline-flex text-sm text-brand-gold underline"
          >
            فتح pipelines في CircleCI
          </a>
        </section>
      ) : null}

      <section className="rounded-2xl border border-brand-gold/15 bg-black/15 p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-brand-gold">إصدار Android جديد</h2>
            <p className="mt-1 text-sm leading-7 text-brand-cream/45">
              يتم حساب الإصدار التالي تلقائيًا من النسخة الحالية، وزيادة versionCode،
              وتجهيز ملاحظات الإصدار من commits الموجودة منذ آخر Release مستقر.
            </p>
          </div>
          <form action={createAndroidReleaseAction}>
            <button
              type="submit"
              className="rounded-xl bg-brand-gold px-6 py-3 font-bold text-black hover:bg-brand-gold/90"
              disabled={operationIsActive}
            >
              {operationIsActive ? "يوجد إصدار قيد البناء" : "إطلاق أحدث نسخة Android"}
            </button>
          </form>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-brand-gold/10 bg-black/10 p-4">
            <p className="text-xs text-brand-cream/35">حالة العملية</p>
            <p className="mt-2 font-semibold text-brand-cream/80">
              {operationIsActive ? "قيد بناء APK/AAB" : "جاهز لإطلاق إصدار جديد"}
            </p>
          </div>
          <div className="rounded-xl border border-brand-gold/10 bg-black/10 p-4">
            <p className="text-xs text-brand-cream/35">الإصدار المطلوب</p>
            <p className="mt-2 font-mono text-sm text-brand-gold">{operation?.tag ?? "—"}</p>
          </div>
          <div className="rounded-xl border border-brand-gold/10 bg-black/10 p-4">
            <p className="text-xs text-brand-cream/35">Commit المصدر</p>
            <p className="mt-2 break-all font-mono text-xs text-brand-cream/60">
              {operation?.commitSha ?? commit}
            </p>
          </div>
        </div>

        {operationIsActive ? (
          <div className="rounded-xl border border-sky-500/15 bg-sky-500/5 p-4 text-sm leading-7 text-sky-100/75">
            {operation?.note ?? "تم إنشاء الـDraft Release، والـCI مسؤول عن البناء والتحقق والنشر بعد نجاح الفحوص."}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
          <p className="text-xs text-brand-cream/35">الفرع الحالي</p>
          <p className="mt-2 font-mono text-sm text-brand-cream/70">{branch}</p>
        </div>
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5 md:col-span-2">
          <p className="text-xs text-brand-cream/35">Commit الواجهة الحالية</p>
          <p className="mt-2 break-all font-mono text-sm text-brand-cream/70">{commit}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
        <h2 className="text-lg font-semibold text-brand-gold">التحققات المطلوبة</h2>
        <div className="mt-4 space-y-2">
          {checks.map(([name, value]) => (
            <div
              key={name}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-gold/8 bg-black/10 px-4 py-3"
            >
              <span className="text-sm text-brand-cream/75">{name}</span>
              <span className="font-mono text-xs text-brand-cream/35">{value}</span>
              <span className="text-[11px] text-brand-cream/25">يتم إثباته من CI/Release</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-brand-gold">أحدث Release مستقر</h2>
            <p className="mt-1 text-sm text-brand-cream/45">
              هذا هو الإصدار الذي يستخدمه قسم تحميل Android في الوضع التلقائي.
            </p>
          </div>
          {latestAndroidRelease?.html_url ? (
            <a
              href={latestAndroidRelease.html_url}
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-full border border-brand-gold/25 px-4 py-2 text-xs text-brand-gold hover:bg-brand-gold/10"
            >
              فتح GitHub Release
            </a>
          ) : null}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-brand-gold/10 bg-black/10 p-4">
            <p className="text-xs text-brand-cream/35">Tag</p>
            <p className="mt-2 font-mono text-brand-gold">{latestAndroidRelease?.tag_name ?? "لا يوجد"}</p>
          </div>
          <div className="rounded-xl border border-brand-gold/10 bg-black/10 p-4">
            <p className="text-xs text-brand-cream/35">التاريخ</p>
            <p className="mt-2 text-sm text-brand-cream/70">
              {latestAndroidRelease?.published_at
                ? new Date(latestAndroidRelease.published_at).toLocaleString("ar-EG-u-nu-latn")
                : "لا يوجد"}
            </p>
          </div>
          <div className="rounded-xl border border-brand-gold/10 bg-black/10 p-4">
            <p className="text-xs text-brand-cream/35">قاعدة البيانات</p>
            <p className="mt-2 text-sm text-emerald-300">Supabase control plane</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div
          className={
            health.database === "healthy"
              ? "rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5"
              : "rounded-2xl border border-red-500/20 bg-red-500/5 p-5"
          }
        >
          <h2 className="font-semibold text-brand-gold">اتصال قاعدة البيانات</h2>
          <p className="mt-2 text-sm text-brand-cream/55">
            {health.database === "healthy"
              ? "تم الاتصال بقاعدة الإنتاج بنجاح في آخر فحص."
              : "تعذر تأكيد سلامة الاتصال في آخر فحص."}
          </p>
        </div>
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
          <h2 className="font-semibold text-brand-gold">الطوابير</h2>
          <p className="mt-2 text-sm text-brand-cream/55">
            فشل النشر الاجتماعي: {health.queues.socialFailed} · فشل الفيديو: {health.queues.videoFailed}
          </p>
        </div>
      </section>
    </Container>
  );
}
