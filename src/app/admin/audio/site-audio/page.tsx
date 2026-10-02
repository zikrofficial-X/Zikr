import Link from "next/link";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { Container } from "@/components/ui/container";

export const dynamic = "force-dynamic";

export default async function AudioSiteAudioPage() {
  await requireAdminPermission("audio.manage");
  return (
    <Container className="space-y-6 py-10" dir="rtl">
      <header>
        <p className="text-xs tracking-[0.22em] text-brand-cream/30">AUDIO / SITE AUDIO</p>
        <h1 className="mt-2 text-3xl font-bold text-brand-gold">Site Audio</h1>
        <p className="mt-2 text-sm leading-7 text-brand-cream/55">نقطة الدخول الرسمية للصوت العام للموقع. التنفيذ الحالي محفوظ في وحدة Site Audio الحالية.</p>
      </header>
      <Link href="/admin/site-audio" className="inline-flex rounded-xl border border-brand-gold/25 px-4 py-2 text-sm text-brand-gold">فتح مركز Site Audio ←</Link>
    </Container>
  );
}
