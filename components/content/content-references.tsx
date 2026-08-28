import Link from "next/link";
import { Card } from "@/components/ui/card";

export type ContentReference = {
  title_ar: string;
  source_type: "quran" | "hadith" | "history" | "academic" | "editorial";
  url?: string;
  locator_ar?: string;
  locator?: string;
  note_ar?: string;
};

const SOURCE_LABELS: Record<ContentReference["source_type"], string> = {
  quran: "القرآن الكريم",
  hadith: "حديث / سنة",
  history: "مصدر تاريخي",
  academic: "دراسة أكاديمية",
  editorial: "تنبيه تحريري",
};

function isReference(value: unknown): value is ContentReference {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.title_ar === "string" && typeof item.source_type === "string"
  );
}

export function getContentReferences(metadata: unknown): ContentReference[] {
  if (!metadata || typeof metadata !== "object") return [];
  const references = (metadata as Record<string, unknown>).references;
  if (!Array.isArray(references)) return [];
  return references.filter(isReference);
}

export function ContentReferences({
  references,
}: {
  references: ContentReference[];
}) {
  if (references.length === 0) return null;

  return (
    <Card
      className="border-brand-gold/20 bg-brand-gold/5 p-6 space-y-4"
      aria-labelledby="content-references-title"
    >
      <div className="space-y-1">
        <h2
          id="content-references-title"
          className="text-xl font-bold text-brand-gold"
        >
          المراجع والمنهجية
        </h2>
        <p className="text-sm leading-7 text-brand-cream/65">
          هذه الروابط تساعد الطالب على الرجوع إلى النص أو المصدر الأصلي. لا
          تُعرض الروايات التاريخية المختلفة على أنها يقين واحد، ويجب مراجعة النص
          الكامل وسياقه.
        </p>
      </div>
      <ol className="space-y-3 list-decimal list-inside">
        {references.map((reference, index) => (
          <li
            key={`${reference.title_ar}-${index}`}
            className="text-sm leading-7 text-brand-cream/80"
          >
            <span className="font-semibold text-brand-cream">
              {reference.title_ar}
            </span>
            <span className="mx-2 rounded-full border border-brand-gold/20 px-2 py-0.5 text-[11px] text-brand-gold/75">
              {SOURCE_LABELS[reference.source_type]}
            </span>
            {(reference.locator_ar ?? reference.locator) && (
              <span className="text-brand-cream/60">
                {" "}
                — {reference.locator_ar ?? reference.locator}
              </span>
            )}
            {reference.note_ar && (
              <span className="block pr-5 text-brand-cream/55">
                {reference.note_ar}
              </span>
            )}
            {reference.url && (
              <Link
                href={reference.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mr-2 text-brand-gold underline decoration-brand-gold/40 underline-offset-4 hover:text-brand-goldSoft"
              >
                فتح المصدر
              </Link>
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
}
