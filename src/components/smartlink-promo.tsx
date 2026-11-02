import {
  MONETAG_SMARTLINK_DISCLOSURE_AR,
  MONETAG_SMARTLINK_DISCLOSURE_EN,
  MONETAG_SMARTLINK_URL,
} from '@/lib/smartlink';

type SmartLinkPromoProps = {
  isEnglish?: boolean;
  compact?: boolean;
};

export function SmartLinkPromo({
  isEnglish = false,
  compact = false,
}: SmartLinkPromoProps) {
  return (
    <section
      aria-label={isEnglish ? 'External advertising link' : 'رابط إعلاني خارجي'}
      dir={isEnglish ? 'ltr' : 'rtl'}
      className={compact
        ? 'rounded-2xl border border-brand-gold/15 bg-brand-gold/[0.04] p-4'
        : 'rounded-3xl border border-brand-gold/20 bg-gradient-to-br from-brand-gold/[0.08] to-black/20 p-6 sm:p-8'}
    >
      <p className="text-[11px] font-bold tracking-wide text-brand-gold/70">
        {isEnglish ? 'ADVERTISEMENT / EXTERNAL LINK' : 'إعلان · رابط خارجي'}
      </p>
      <div className={compact ? 'mt-2 flex flex-wrap items-center justify-between gap-3' : 'mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'}>
        <div className="max-w-2xl">
          <h2 className="font-bold text-brand-cream">
            {isEnglish ? 'Explore external offers' : 'استكشف عروضًا وروابط خارجية'}
          </h2>
          <p className="mt-1 text-xs leading-6 text-brand-cream/55">
            {isEnglish
              ? 'This sponsored link may open a third-party offer or website. Review the destination before proceeding.'
              : 'هذا رابط إعلاني وقد يفتح عرضًا أو موقعًا تابعًا لجهة خارجية. راجع الوجهة قبل المتابعة.'}
          </p>
        </div>
        <a
          href={MONETAG_SMARTLINK_URL}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-brand-gold/35 bg-brand-gold/10 px-4 py-2 text-sm font-semibold text-brand-gold transition hover:bg-brand-gold/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
        >
          {isEnglish ? 'Open external link' : 'فتح الرابط الخارجي'}
        </a>
      </div>
      <p className="mt-2 text-[10px] leading-5 text-brand-cream/35">
        {isEnglish ? MONETAG_SMARTLINK_DISCLOSURE_EN : MONETAG_SMARTLINK_DISCLOSURE_AR}
      </p>
    </section>
  );
}
