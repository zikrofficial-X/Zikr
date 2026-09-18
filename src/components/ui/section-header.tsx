export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-10 space-y-3 text-right border-r-4 border-brand-gold pr-6">
      <h2 className="text-3xl font-bold text-brand-gold md:text-4xl tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-brand-cream/50 text-lg font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
}
