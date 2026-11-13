import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import { areMediaAssetRightsVerified, classifyMediaAssetKind } from "@/features/media/services/media-asset-classification";

export const dynamic = "force-dynamic";

type AssetRow = {
  id: string;
  title: string | null;
  name: string | null;
  asset_type: string | null;
  media_type: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  rights_verified: boolean | null;
  verified_rights: boolean | null;
  metadata: Record<string, unknown> | null;
};

function isKidsAsset(asset: AssetRow) {
  const metadata = asset.metadata ?? {};
  const tags = [
    asset.asset_type, asset.media_type,
    metadata.scope, metadata.section, metadata.module, metadata.game_slug,
    metadata.game_id, metadata.asset_role,
  ].map((value) => String(value ?? "").toLowerCase()).join(" ");
  return /kids|kid|children|game|أطفال|لعبة/.test(tags);
}

const number = (value: number) => value.toLocaleString("ar-EG-u-nu-latn");

export default async function KidsAssetsPage() {
  await requireAdminPermission("kids.manage");

  let loaded = true;
  let assets: AssetRow[] = [];
  try {
    assets = await supabaseServerAdminRequest<AssetRow[]>(
      "/rest/v1/media_assets?select=id,title,name,asset_type,media_type,mime_type,size_bytes,rights_verified,verified_rights,metadata&order=created_at.desc&limit=300",
      { method: "GET" },
    );
  } catch (error) {
    loaded = false;
    console.error("[admin/kids/assets] failed to load assets:", error);
  }
  const kidsAssets = assets.filter(isKidsAsset);
  const verified = kidsAssets.filter(areMediaAssetRightsVerified).length;
  const unverified = kidsAssets.length - verified;
  const taggedAudio = kidsAssets.filter((asset) => classifyMediaAssetKind(asset) === "audio").length;
  const taggedVisual = kidsAssets.filter((asset) => classifyMediaAssetKind(asset) === "visual").length;
  const unclassified = kidsAssets.length - taggedAudio - taggedVisual;

  return (
    <Container className="space-y-8 py-10 text-right" dir="rtl">
      <header className="space-y-2">
        <Link href="/admin/kids/games" className="text-xs text-brand-gold/60 hover:text-brand-gold">← سجل الألعاب</Link>
        <p className="mt-4 text-xs tracking-[0.2em] text-brand-cream/30">KIDS / ASSET GOVERNANCE</p>
        <h1 className="text-3xl font-bold text-brand-gold">أصول الألعاب والأطفال</h1>
        <p className="max-w-4xl text-sm leading-7 text-brand-cream/55">هذه الشاشة لا تعتبر كل الوسائط العامة أصولًا للأطفال. يظهر الأصل عند تصنيفه صراحةً بنوع kids أو ببيانات metadata.scope أو metadata.section أو metadata.game_slug أو metadata.game_id. تعرض القائمة أحدث 300 أصل فقط؛ استخدم مكتبة الوسائط للبحث عن الأصول الأقدم.</p>
      </header>

      {!loaded && <div role="alert" className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100">تعذر قراءة مكتبة الوسائط. حالة الأصول غير متاحة وليست صفرًا.</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card><p className="text-xs text-brand-cream/40">أصول مرتبطة بالأطفال</p><p className="mt-2 text-3xl font-bold text-brand-gold">{loaded ? number(kidsAssets.length) : "غير متاح"}</p></Card>
        <Card><p className="text-xs text-brand-cream/40">أصول صوتية</p><p className="mt-2 text-3xl font-bold text-sky-200">{loaded ? number(taggedAudio) : "غير متاح"}</p></Card>
        <Card><p className="text-xs text-brand-cream/40">أصول مرئية</p><p className="mt-2 text-3xl font-bold text-emerald-300">{loaded ? number(taggedVisual) : "غير متاح"}</p></Card>
        <Card><p className="text-xs text-brand-cream/40">أصول غير مصنفة</p><p className="mt-2 text-3xl font-bold text-brand-cream/70">{loaded ? number(unclassified) : "غير متاح"}</p></Card>
        <Card><p className="text-xs text-brand-cream/40">أصول تحتاج تدقيق حقوق</p><p className="mt-2 text-3xl font-bold text-amber-200">{loaded ? number(unverified) : "غير متاح"}</p></Card>
      </section>

      {loaded && kidsAssets.length === 0 && (
        <div role="status" className="rounded-2xl border border-amber-400/25 bg-amber-400/5 p-5 text-sm leading-7 text-amber-100">
          لا توجد أصول موسومة حاليًا على أنها تخص الأطفال أو لعبة بعينها. هذا لا يعني أن مكتبة الوسائط العامة فارغة؛ يعني فقط أن تصنيفها كأصل للأطفال غير موثق في asset_type أو metadata. لا تنقل ملفات عامة إلى الألعاب قبل التحقق من الملكية والحقوق.
        </div>
      )}

      <section className="flex flex-wrap gap-3">
        <Link href="/admin/memory" className="rounded-xl border border-brand-gold/25 bg-brand-gold/10 px-4 py-2 text-sm font-semibold text-brand-gold">فتح مكتبة الوسائط والذاكرة</Link>
        <Link href="/admin/kids" className="rounded-xl border border-brand-gold/15 px-4 py-2 text-sm text-brand-cream/70">محتوى الأطفال</Link>
      </section>

      {loaded && kidsAssets.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-brand-gold/10 bg-black/15">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-sm">
              <thead className="bg-black/20 text-brand-gold/75"><tr>{["الأصل", "النوع", "الحجم", "الحقوق", "الدور"].map((label) => <th key={label} className="px-4 py-3 text-right">{label}</th>)}</tr></thead>
              <tbody>
                {kidsAssets.map((asset) => (
                  <tr key={asset.id} className="border-t border-brand-gold/8">
                    <td className="px-4 py-3 text-brand-cream/85">{asset.title || asset.name || asset.id}</td>
                    <td className="px-4 py-3 text-brand-cream/60" dir="ltr">{asset.asset_type || asset.media_type || asset.mime_type || "unknown"}</td>
                    <td className="px-4 py-3 text-brand-cream/60">{asset.size_bytes === null ? "غير معروف" : `${number(Math.round(asset.size_bytes / 1024))} KB`}</td>
                    <td className="px-4 py-3">{areMediaAssetRightsVerified(asset) ? <span className="text-emerald-300">موثقة</span> : <span className="text-amber-300">تحتاج مراجعة</span>}</td>
                    <td className="px-4 py-3 text-brand-cream/50">{String(asset.metadata?.asset_role ?? asset.metadata?.game_slug ?? asset.metadata?.game_id ?? "غير محدد")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </Container>
  );
}
