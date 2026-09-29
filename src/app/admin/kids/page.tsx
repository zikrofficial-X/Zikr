export const dynamic = "force-dynamic";

import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import { saveKidsContentAction } from "./actions";
import { CloudinaryImageUploadField } from "@/features/admin/components/cloudinary-image-upload-field";
import { GAME_REGISTRY } from "@/lib/games/registry";

const typeLabels: Record<string, string> = {
  story: "قصة",
  prayer: "دعاء",
  wudu: "الوضوء والصلاة",
  quiz: "اختبار",
  game: "لعبة",
  puzzle: "لغز",
  coloring: "تلوين",
  matching: "توصيل",
  video: "فيديو",
  memorize: "حفظ",
};

const ageGroupLabels: Record<string, string> = {
  "3-5": "3-5 سنوات",
  "6-8": "6-8 سنوات",
  "9-12": "9-12 سنة",
  "13-15": "13-15 سنة",
};

type KidsRow = {
  id: string;
  title_ar: string;
  title_en: string | null;
  slug: string;
  type: string;
  age_group: string | null;
  published: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function Field({
  name,
  label,
  type = "text",
  placeholder,
  textarea,
  defaultValue,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  textarea?: boolean;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1 text-sm text-brand-cream/80">
      <span>{label}{required && <span className="text-red-400 mr-1">*</span>}</span>
      {textarea ? (
        <textarea name={name} required={required} defaultValue={defaultValue} placeholder={placeholder} rows={4}
          className="w-full rounded-lg bg-black/20 border border-brand-gold/20 p-2 text-brand-cream focus:border-brand-gold focus:outline-none" />
      ) : (
        <input name={name} type={type} required={required} defaultValue={defaultValue} placeholder={placeholder}
          className="w-full rounded-lg bg-black/20 border border-brand-gold/20 p-2 text-brand-cream focus:border-brand-gold focus:outline-none" />
      )}
    </label>
  );
}

async function getKidsContent(): Promise<KidsRow[]> {
  try {
    return await supabaseServerAdminRequest<KidsRow[]>(
      "/rest/v1/kids_content?select=id,title_ar,title_en,slug,type,age_group,published,is_active,created_at,updated_at&order=updated_at.desc&limit=300",
      { method: "GET" },
    );
  } catch (error) {
    console.error("[admin/kids] failed to load database content:", error);
    return [];
  }
}

export default async function AdminKidsPage() {
  await requireAdminPermission("kids.manage");
  const rows = await getKidsContent();
  const publishedCount = rows.filter((item) => item.published && item.is_active).length;
  const draftCount = rows.length - publishedCount;
  const typeCounts = rows.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Container className="space-y-8 py-10 text-right">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/admin" className="text-brand-gold/60 hover:text-brand-gold text-sm">لوحة التحكم</Link>
        <span className="text-brand-gold/30">/</span>
        <h1 className="text-2xl font-bold text-brand-gold">إدارة قسم الأطفال</h1>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card><p className="text-sm arabic-muted">إجمالي السجلات الفعلية</p><strong className="text-3xl text-brand-gold">{rows.length}</strong></Card>
        <Card><p className="text-sm arabic-muted">منشور ومفعّل</p><strong className="text-3xl text-emerald-300">{publishedCount}</strong></Card>
        <Card><p className="text-sm arabic-muted">مسودة / مخفي</p><strong className="text-3xl text-amber-300">{draftCount}</strong></Card>
        <Card><p className="text-sm arabic-muted">أنواع المحتوى</p><strong className="text-3xl text-brand-gold">{Object.keys(typeCounts).length}</strong></Card>
      </section>

      <section className="flex flex-wrap gap-2">
        {Object.entries(typeCounts).map(([type, count]) => (
          <span key={type} className="rounded-full border border-brand-gold/15 bg-black/15 px-3 py-1.5 text-xs text-brand-cream/65">
            {typeLabels[type] ?? type}: {count}
          </span>
        ))}
      </section>

      <Card className="space-y-4">
        <h2 className="text-xl text-brand-gold">إضافة محتوى جديد لقسم الأطفال</h2>
        <form action={saveKidsContentAction} className="grid gap-4 md:grid-cols-2">
          <Field name="title_ar" label="العنوان بالعربية" required placeholder="قصة سيدنا يوسف" />
          <Field name="title_en" label="العنوان بالإنجليزية" placeholder="Prophet Yusuf Story" />
          <Field name="slug" label="الرابط المختصر" required placeholder="story-yusuf" />
          <label className="space-y-1 text-sm text-brand-cream/80">
            <span>النوع</span>
            <select name="type" className="w-full rounded-lg bg-black/20 border border-brand-gold/20 p-2 text-brand-cream">
              {Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm text-brand-cream/80">
            <span>الفئة العمرية</span>
            <select name="age_group" className="w-full rounded-lg bg-black/20 border border-brand-gold/20 p-2 text-brand-cream">
              {Object.entries(ageGroupLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <CloudinaryImageUploadField name="featured_image_url" label="الصورة المميزة" folder="kids" hint="حتى 8MB — JPG/PNG/WEBP/GIF" />
          <Field name="video_url" label="رابط فيديو تعليمي" placeholder="https://www.youtube.com/embed/..." />
          <label className="space-y-1 text-sm text-brand-cream/80">
            <span>معرف اللعبة</span>
            <select name="game_id" defaultValue="zikr-runner" className="w-full rounded-lg bg-black/20 border border-brand-gold/20 p-2 text-brand-cream">
              {Object.values(GAME_REGISTRY).map(game => <option key={game.id} value={game.id}>{game.titleEn} — {game.titleAr}</option>)}
            </select>
          </label>
          <Field name="memorization_target" label="هدف الحفظ" placeholder="الفاتحة / الإخلاص / آية الكرسي" />
          <Field name="reward" label="رسالة تشجيع الطفل" placeholder="أحسنت! اقتربت من الوسام الذهبي" />
          <div className="md:col-span-2"><Field name="content_ar" label="المحتوى بالعربية" textarea required placeholder="اكتب محتوى القصة أو الدعاء هنا..." /></div>
          <div className="md:col-span-2"><Field name="quiz_data" label="بيانات اللعبة / الأسئلة (JSON اختياري)" textarea placeholder='{"questions":[{"q":"من ربك؟","answers":["الله"],"reward":"نجمة"}]}' /></div>
          <label className="flex items-center gap-2 text-sm text-brand-cream/70 md:col-span-2">
            <input name="published" type="checkbox" defaultChecked className="accent-brand-gold" />
            نشر المحتوى مباشرة
          </label>
          <div className="md:col-span-2"><Button type="submit">حفظ المحتوى في قاعدة البيانات</Button></div>
        </form>
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl text-brand-gold">المحتوى الحالي</h2>
            <p className="text-sm arabic-muted mt-1">هذه القائمة تقرأ مباشرة من جدول kids_content، وليست من بيانات ثابتة داخل الكود.</p>
          </div>
          <span className="text-xs text-brand-cream/40">{rows.length} سجل</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead><tr className="border-b border-brand-gold/20 text-brand-cream/60">
              <th className="pb-2 text-right">العنوان</th><th className="pb-2 text-right">النوع</th><th className="pb-2 text-right">العمر</th><th className="pb-2 text-right">الحالة</th><th className="pb-2 text-right">آخر تحديث</th>
            </tr></thead>
            <tbody className="divide-y divide-brand-gold/10">
              {rows.map(item => (
                <tr key={item.id} className="hover:bg-black/10">
                  <td className="py-2 text-brand-cream"><div>{item.title_ar}</div><div className="text-xs text-brand-cream/30" dir="ltr">/{item.slug}</div></td>
                  <td className="py-2"><span className="px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold text-xs">{typeLabels[item.type] ?? item.type}</span></td>
                  <td className="py-2 text-brand-cream/60">{ageGroupLabels[item.age_group ?? ""] ?? item.age_group ?? "—"}</td>
                  <td className="py-2">{item.published && item.is_active ? <span className="text-emerald-300">منشور</span> : <span className="text-amber-300">مخفي/مسودة</span>}</td>
                  <td className="py-2 text-xs text-brand-cream/40">{item.updated_at ? new Date(item.updated_at).toLocaleString("ar-EG") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <p className="py-6 text-center text-sm text-brand-cream/40">لا توجد سجلات في قاعدة البيانات حتى الآن.</p>}
      </Card>

      <Card className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-brand-gold">استعراض قسم الأطفال</h3>
          <p className="text-sm arabic-muted mt-1">افتح الواجهة العامة للتأكد من نتيجة النشر.</p>
        </div>
        <Link href="/kids"><Button variant="outline">قسم الأطفال</Button></Link>
      </Card>
    </Container>
  );
}
