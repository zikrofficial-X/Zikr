export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { requireAdminPermission, getCurrentProfile } from "@/features/admin/services/admin";
import { getAdminSettings } from "@/features/admin/services/platform";
import { getAdminPermissions, ADMIN_PERMISSIONS, type AdminPermission } from "@/features/admin/services/permissions";

export const metadata: Metadata = { title: "أمن لوحة الإدارة | الأدمن" };

export default async function AdminSecurityPage() {
  await requireAdminPermission("security.manage");
  const profile = await getCurrentProfile();
  const settings = await getAdminSettings();
  const permissions = getAdminPermissions(profile?.role ?? "user");
  const mfaRequired = settings.require_mfa_for_destructive === true;

  return (
    <Container className="py-10 space-y-6" dir="rtl">
      <header>
        <p className="text-xs tracking-[0.18em] text-brand-cream/30">الأمن والصلاحيات</p>
        <h1 className="mt-2 text-3xl font-bold text-brand-gold">أمن لوحة الإدارة</h1>
        <p className="mt-2 text-sm leading-7 text-brand-cream/50">مراجعة الدور الحالي، مصفوفة الصلاحيات، وإعداد MFA للعمليات الحساسة.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5"><p className="text-xs text-brand-cream/35">الدور</p><p className="mt-2 text-xl font-bold text-brand-cream">{({ user: "مستخدم", admin: "مدير النظام", super_admin: "مدير نظام رئيسي", content_manager: "مدير المحتوى", editor: "محرر", video_manager: "مدير الفيديو", social_manager: "مدير النشر الاجتماعي", moderator: "مشرف", seo_manager: "مدير SEO", analyst: "محلل", support: "دعم" } as Record<string,string>)[profile?.role ?? "user"] ?? profile?.role ?? "مستخدم"}</p></div>
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5"><p className="text-xs text-brand-cream/35">عدد الصلاحيات</p><p className="mt-2 text-xl font-bold text-brand-gold">{permissions.length}</p></div>
        <div className={`rounded-2xl border p-5 ${mfaRequired ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}><p className="text-xs text-brand-cream/35">MFA للعمليات الحساسة</p><p className="mt-2 text-xl font-bold">{mfaRequired ? 'مفعل' : 'غير مفعل'}</p></div>
      </section>

      <section className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
        <h2 className="text-lg font-semibold text-brand-gold">مصفوفة الصلاحيات للدور الحالي</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(ADMIN_PERMISSIONS).map(([key, label]) => {
            const permission = key as AdminPermission;
            const enabled = permissions.includes(permission);
            return <div key={key} className={`rounded-xl border px-3 py-2 text-sm ${enabled ? 'border-emerald-500/15 bg-emerald-500/5 text-emerald-200' : 'border-brand-gold/8 text-brand-cream/30'}`}><span className="font-mono text-[11px] text-brand-cream/40">{key}</span><div className="mt-1 text-xs opacity-70">{label}</div></div>;
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
        <h2 className="text-lg font-semibold text-brand-gold">حالة الحماية</h2>
        <ul className="mt-3 space-y-2 text-sm text-brand-cream/55">
          <li>• جميع صفحات الإدارة محمية بخادم الصلاحيات المركزية.</li>
          <li>• سجل الإدارة المركزي منفصل وغير قابل للتعديل بعد تسجيله على مستوى قاعدة البيانات.</li>
          <li>• العمليات الحساسة لديها صلاحيات مستقلة للنشر والحذف والأمن.</li>
          <li>• يمكن تفعيل التحقق متعدد العوامل (MFA) للعمليات الحساسة بعد تسجيل عامل TOTP موثّق للحساب.</li>
        </ul>
      </section>
    </Container>
  );
}
