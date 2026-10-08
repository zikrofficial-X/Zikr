import Link from "next/link";
import { Container } from "@/components/ui/container";

export default function AdminNotFound() {
  return (
    <Container className="py-16" dir="rtl">
      <section className="mx-auto max-w-2xl rounded-3xl border border-brand-gold/10 bg-black/15 p-8 text-center">
        <p className="text-xs tracking-[0.2em] text-brand-cream/30">404 ADMIN</p>
        <h1 className="mt-3 text-2xl font-bold text-brand-gold">الوحدة الإدارية غير موجودة</h1>
        <p className="mt-3 text-sm leading-7 text-brand-cream/50">تحقق من المسار الرسمي أو استخدم التنقل الرئيسي.</p>
        <Link href="/admin" className="mt-6 inline-flex rounded-xl border border-brand-gold/25 px-5 py-2.5 text-sm font-semibold text-brand-gold hover:bg-brand-gold/10">العودة للوحة التحكم</Link>
      </section>
    </Container>
  );
}
