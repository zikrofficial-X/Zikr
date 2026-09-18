export const dynamic = "force-dynamic";

import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/services/admin";
import { kidsContent } from "@/lib/data/kids-content";
import { saveKidsContentAction } from "./actions";
import { CloudinaryImageUploadField } from "@/components/admin/cloudinary-image-upload-field";
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
      <span>
        {label}
        {required && <span className="text-red-400 mr-1">*</span>}
      </span>
      {textarea ? (
        <textarea
          name={name}
          required={required}
          defaultValue={defaultValue}
          placeholder={placeholder}
          rows={4}
          className="w-full rounded-lg bg-black/20 border border-brand-gold/20 p-2 text-brand-cream focus:border-brand-gold focus:outline-none"
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="w-full rounded-lg bg-black/20 border border-brand-gold/20 p-2 text-brand-cream focus:border-brand-gold focus:outline-none"
        />
      )}
    </label>
  );
}

export default async function AdminKidsPage() {
  await requireAdmin();

  const byType = kidsContent.reduce<Record<string, typeof kidsContent>>(
    (acc, item) => {
      const t = item.type;
      if (!acc[t]) acc[t] = [];
      acc[t].push(item);
      return acc;
    },
    {}
  );

  return (
    <Container className="space-y-8 py-10 text-right">
      <div className="flex items-center gap-4">
        <Link
          href="/admin"
          className="text-brand-gold/60 hover:text-brand-gold text-sm transition-colors"
        >
          لوحة التحكم
        </Link>
        <span className="text-brand-gold/30">/</span>
        <h1 className="text-2xl font-bold text-brand-gold">
          إدارة قسم الأطفال
        </h1>
      </div>

      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-4">
        {Object.entries(byType).map(([type, items]) => (
          <Card key={type}>
            <p className="text-sm arabic-muted">{typeLabels[type] ?? type}</p>
            <strong className="text-3xl text-brand-gold">{items.length}</strong>
          </Card>
        ))}
      </section>

      {/* Add new content */}
      <Card className="space-y-4">
        <h2 className="text-xl text-brand-gold">
          إضافة محتوى جديد لقسم الأطفال
        </h2>
        <form
          action={saveKidsContentAction}
          className="grid gap-4 md:grid-cols-2"
        >
          <Field
            name="title_ar"
            label="العنوان بالعربية"
            required
            placeholder="قصة سيدنا يوسف"
          />
          <Field
            name="title_en"
            label="العنوان بالإنجليزية"
            placeholder="Prophet Yusuf Story"
          />
          <Field
            name="slug"
            label="الرابط المختصر"
            required
            placeholder="story-yusuf"
          />
          <div className="space-y-1 text-sm text-brand-cream/80">
            <span>النوع</span>
            <select
              name="type"
              className="w-full rounded-lg bg-black/20 border border-brand-gold/20 p-2 text-brand-cream focus:outline-none focus:border-brand-gold"
            >
              {Object.entries(typeLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 text-sm text-brand-cream/80">
            <span>الفئة العمرية</span>
            <select
              name="age_group"
              className="w-full rounded-lg bg-black/20 border border-brand-gold/20 p-2 text-brand-cream focus:outline-none focus:border-brand-gold"
            >
              {Object.entries(ageGroupLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <CloudinaryImageUploadField
            name="featured_image_url"
            label="الصورة المميزة"
            folder="kids"
            hint="تُرفع الصورة إلى Cloudinary وتُحفظ كرابط آمن مع المحتوى. JPG أو PNG أو WEBP أو GIF — حتى 8MB"
          />
          <Field
            name="video_url"
            label="رابط فيديو تعليمي"
            placeholder="https://www.youtube.com/embed/..."
          />
          <label className="block space-y-1 text-sm text-brand-cream/80">
            <span>معرف اللعبة (لنشاط من نوع لعبة)</span>
            <select
              name="game_id"
              defaultValue="zikr-runner"
              className="w-full rounded-lg bg-black/20 border border-brand-gold/20 p-2 text-brand-cream focus:outline-none focus:border-brand-gold"
            >
              {Object.values(GAME_REGISTRY).map(game => (
                <option key={game.id} value={game.id}>
                  {game.titleEn} — {game.titleAr}
                </option>
              ))}
            </select>
          </label>
          <Field
            name="memorization_target"
            label="هدف الحفظ"
            placeholder="الفاتحة / الإخلاص / آية الكرسي"
          />
          <Field
            name="reward"
            label="رسالة تشجيع الطفل"
            placeholder="أحسنت! اقتربت من الوسام الذهبي"
          />
          <div className="md:col-span-2">
            <Field
              name="content_ar"
              label="المحتوى بالعربية"
              textarea
              required
              placeholder="اكتب محتوى القصة أو الدعاء هنا..."
            />
          </div>
          <div className="md:col-span-2">
            <Field
              name="quiz_data"
              label="بيانات اللعبة / الأسئلة (JSON اختياري)"
              textarea
              placeholder='{"questions":[{"q":"من ربك؟","answers":["الله"],"reward":"نجمة"}]}'
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-brand-cream/70 md:col-span-2">
            <input
              name="published"
              type="checkbox"
              defaultChecked
              className="accent-brand-gold"
            />
            نشر المحتوى مباشرة في قسم الأطفال
          </label>
          <div className="md:col-span-2">
            <Button type="submit">إضافة المحتوى واللعبة</Button>
          </div>
        </form>
      </Card>

      {/* Current content list */}
      <Card className="space-y-4">
        <h2 className="text-xl text-brand-gold">
          المحتوى الحالي ({kidsContent.length} عنصر)
        </h2>
        <p className="text-sm arabic-muted">
          هذا المحتوى مضمّن في الكود المصدري. يمكنك إضافة محتوى جديد من النموذج
          أعلاه.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-gold/20 text-brand-cream/60">
                <th className="pb-2 text-right">العنوان</th>
                <th className="pb-2 text-right">النوع</th>
                <th className="pb-2 text-right">الفئة العمرية</th>
                <th className="pb-2 text-right">الـ Slug</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-gold/10">
              {kidsContent.map(item => (
                <tr key={item.id} className="hover:bg-black/10">
                  <td className="py-2 text-brand-cream">{item.title_ar}</td>
                  <td className="py-2">
                    <span className="px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold text-xs">
                      {typeLabels[item.type] ?? item.type}
                    </span>
                  </td>
                  <td className="py-2 text-brand-cream/60">
                    {ageGroupLabels[item.age_group] ?? item.age_group}
                  </td>
                  <td
                    className="py-2 text-brand-cream/40 text-xs font-mono"
                    dir="ltr"
                  >
                    {item.slug}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Link to puzzle game */}
      <Card className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-brand-gold">
            لعبة الترتيب الإسلامية
          </h3>
          <p className="text-sm arabic-muted mt-1">
            لعبة تفاعلية للأطفال بـ 5 ألغاز
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/kids/puzzle" target="_blank">
            <Button variant="outline">معاينة</Button>
          </Link>
          <Link href="/kids">
            <Button variant="ghost">قسم الأطفال</Button>
          </Link>
        </div>
      </Card>
    </Container>
  );
}
