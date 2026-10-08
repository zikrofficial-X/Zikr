import { Container } from "@/components/ui/container";

export default function AdminLoading() {
  return (
    <Container className="space-y-6 py-10" dir="rtl" aria-busy="true">
      <div className="h-8 w-56 animate-pulse rounded-xl bg-brand-gold/10" />
      <div className="h-4 w-96 max-w-full animate-pulse rounded bg-brand-cream/5" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl border border-brand-gold/10 bg-black/15" />
        ))}
      </div>
      <p className="text-sm text-brand-cream/35">جاري تحميل مركز الإدارة…</p>
    </Container>
  );
}
