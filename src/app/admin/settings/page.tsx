export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { getAdminSettings } from "@/features/admin/services/platform";
import { saveAdminSettingAction } from "@/app/admin/system-actions";

export const metadata: Metadata = { title: "إعدادات الإدارة | الأدمن" };

const SETTINGS = [
  ['require_mfa_for_destructive', 'طلب MFA قبل العمليات الحساسة', 'false'],
  ['maintenance_mode', 'وضع الصيانة', 'false'],
  ['admin_alerts_enabled', 'تنبيهات الإدارة', 'true'],
  ['search_result_limit', 'حد نتائج البحث', '25'],
] as const;

export default async function AdminSettingsPage() {
  await requireAdminPermission("settings.manage");
  const values = await getAdminSettings();

  return (
    <Container className="py-10 space-y-6" dir="rtl">
      <header>
        <p className="text-xs tracking-[0.2em] text-brand-cream/30">ADMIN CONFIG</p>
        <h1 className="mt-2 text-3xl font-bold text-brand-gold">إعدادات لوحة الإدارة</h1>
        <p className="mt-2 text-sm leading-7 text-brand-cream/50">الإعدادات التشغيلية الحساسة محفوظة في admin_settings مع تدقيق مركزي لكل تعديل.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {SETTINGS.map(([key, label, fallback]) => (
          <form key={key} action={saveAdminSettingAction} className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5 space-y-3">
            <input type="hidden" name="key" value={key} />
            <div>
              <h2 className="font-semibold text-brand-cream">{label}</h2>
              <p className="mt-1 text-xs text-brand-cream/35">{key}</p>
            </div>
            <textarea name="value" defaultValue={JSON.stringify(values[key] ?? JSON.parse(fallback))} rows={2} className="w-full rounded-xl border border-brand-gold/15 bg-black/20 px-3 py-2 text-sm text-brand-cream outline-none focus:border-brand-gold/40" />
            <button type="submit" className="rounded-xl border border-brand-gold/25 px-4 py-2 text-sm text-brand-gold hover:bg-brand-gold/10">حفظ الإعداد</button>
          </form>
        ))}
      </div>
    </Container>
  );
}
