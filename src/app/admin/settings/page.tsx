export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { getAdminSettings } from "@/features/admin/services/platform";
import { saveAdminSettingAction } from "@/app/admin/system-actions";

export const metadata: Metadata = { title: "إعدادات الإدارة | الأدمن" };

const BOOLEAN_SETTINGS = [
  ["require_mfa_for_destructive", "طلب MFA قبل العمليات الحساسة", "يتحكم في طبقة الإحالة قبل الحذف والنشر والعمليات الخطرة."],
  ["maintenance_mode", "وضع الصيانة", "يوقف واجهات الصيانة التي تعتمد على هذا الإعداد دون تغيير بيانات المحتوى."],
  ["admin_alerts_enabled", "تنبيهات الإدارة", "يسمح لمركز الإدارة بعرض والتنبيه عن الأحداث التشغيلية المهمة."],
] as const;

export default async function AdminSettingsPage() {
  await requireAdminPermission("settings.manage");
  const values = await getAdminSettings();

  return (
    <Container className="space-y-8 py-10 text-right" dir="rtl">
      <header>
        <p className="text-xs tracking-[0.2em] text-brand-cream/30">إعدادات الإدارة</p>
        <h1 className="mt-2 text-3xl font-bold text-brand-gold">إعدادات لوحة الإدارة</h1>
        <p className="mt-2 max-w-4xl text-sm leading-7 text-brand-cream/50">
          إعدادات typed بدل إدخال JSON حر. كل تعديل يمر عبر صلاحية settings.manage ويسجل في سجل التدقيق.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {BOOLEAN_SETTINGS.map(([key, label, description]) => {
          const enabled = values[key] === true;
          return (
            <form key={key} action={saveAdminSettingAction} className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
              <input type="hidden" name="key" value={key} />
              <h2 className="font-semibold text-brand-cream">{label}</h2>
              <p className="mt-2 text-sm leading-6 text-brand-cream/45">{description}</p>
              <label className="mt-5 flex items-center gap-3 text-sm text-brand-cream/70">
                <input type="hidden" name="value" value="false" />
                <input type="checkbox" name="value" value="true" defaultChecked={enabled} className="h-4 w-4 accent-brand-gold" />
                مفعّل
              </label>
              <button type="submit" className="mt-4 rounded-xl border border-brand-gold/25 px-4 py-2 text-sm text-brand-gold hover:bg-brand-gold/10">حفظ</button>
            </form>
          );
        })}
      </section>

      <form action={saveAdminSettingAction} className="max-w-xl rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
        <input type="hidden" name="key" value="search_result_limit" />
        <h2 className="font-semibold text-brand-gold">حد نتائج البحث المركزي</h2>
        <p className="mt-2 text-sm leading-6 text-brand-cream/45">قيمة من 10 إلى 100 لتجنب استعلامات ضخمة داخل مركز الإدارة.</p>
        <input
          name="value"
          type="number"
          min={10}
          max={100}
          defaultValue={typeof values.search_result_limit === "number" ? values.search_result_limit : 40}
          className="mt-4 w-full rounded-xl border border-brand-gold/15 bg-black/20 px-3 py-2 text-sm text-brand-cream outline-none focus:border-brand-gold/40"
        />
        <button type="submit" className="mt-4 rounded-xl border border-brand-gold/25 px-4 py-2 text-sm text-brand-gold hover:bg-brand-gold/10">حفظ حد البحث</button>
      </form>

      <section className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-5 text-sm leading-7 text-brand-cream/60">
        إعدادات الأتمتة الخاصة بالفيديو لها مركز مستقل في <a href="/admin/automation" className="text-brand-gold hover:underline">الأتمتة والتشغيل</a> حتى لا تختلط إعدادات الحسابات والأمن مع تشغيل مصنع الفيديو.
      </section>
    </Container>
  );
}
