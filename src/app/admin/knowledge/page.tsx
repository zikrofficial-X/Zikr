import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { requireAdminPermission } from '@/features/admin/services/admin';
import { getKnowledgeAdminData } from '@/features/admin/services/knowledge';
import { saveCompanionAction, saveHadithAction, saveScholarAction, saveSurahAction } from './actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'إدارة المعرفة الإسلامية | الأدمن', robots: { index: false, follow: false } };

type FieldProps = { name: string; label: string; type?: string; defaultValue?: string | number | null; required?: boolean; textarea?: boolean; placeholder?: string };
function Field({ name, label, type, defaultValue, required, textarea, placeholder }: FieldProps) {
  const common = { name, defaultValue: defaultValue ?? '', required, placeholder, dir: 'rtl' as const, className: 'w-full rounded-xl border border-brand-gold/20 bg-black/25 px-3 py-2 text-sm text-brand-cream placeholder:text-brand-cream/25 focus:border-brand-gold/50 focus:outline-none' };
  return <label className="grid gap-1 text-sm text-brand-cream/75"><span>{label}</span>{textarea ? <textarea {...common} rows={4} /> : <input {...common} type={type ?? 'text'} />}</label>;
}
function Published({ checked = true }: { checked?: boolean }) { return <label className="flex items-center gap-2 text-sm text-brand-cream/70"><input name="published" type="checkbox" defaultChecked={checked} className="accent-brand-gold" /> نشر المحتوى</label>; }

const getData = getKnowledgeAdminData;
export default async function KnowledgeAdminPage() {
  await requireAdminPermission("knowledge.manage");
  const data = await getData();
  return <Container className="space-y-10 py-8 text-right" dir="rtl">
    <header className="space-y-2"><Link href="/admin" className="text-xs text-brand-gold/60 hover:text-brand-gold">← العودة إلى لوحة التحكم</Link><h1 className="text-3xl font-bold text-brand-gold">إدارة المعرفة الإسلامية</h1><p className="max-w-3xl text-sm leading-7 text-brand-cream/55">نماذج موحّدة لإضافة وتحرير الصحابة والعلماء والسور والأحاديث. لا تُنشئ نصوصًا دينية تلقائيًا؛ أدخل النص الموثق ومصدره ثم راجعه قبل النشر.</p></header>

    <section className="grid gap-6 xl:grid-cols-2">
      <Card className="space-y-4"><h2 className="text-xl font-bold text-brand-gold">إضافة صحابي أو تحريره</h2><form action={saveCompanionAction} className="grid gap-3 sm:grid-cols-2"><Field name="id" label="معرّف السجل للتحرير (اختياري)" placeholder="UUID" /><Field name="name_ar" label="الاسم بالعربية" required /><Field name="name_en" label="الاسم بالإنجليزية" /><Field name="slug" label="الرابط المختصر" required /><Field name="category" label="التصنيف" placeholder="خليفة / مبشّر / صحابي" /><Field name="order_num" label="الترتيب" type="number" /><Field name="thumbnail_url" label="رابط الصورة المصغرة" /><Field name="featured_image_url" label="رابط الصورة الرئيسية" /><div className="sm:col-span-2"><Field name="bio_ar" label="السيرة بالعربية" textarea required /></div><div className="sm:col-span-2"><Field name="bio_en" label="السيرة بالإنجليزية" textarea /></div><div className="sm:col-span-2"><Field name="source" label="المصدر / المرجع" placeholder="اسم الكتاب أو الرابط" /></div><Published /><Button type="submit" className="sm:col-span-2">حفظ الصحابي</Button></form></Card>
      <Card className="space-y-4"><h2 className="text-xl font-bold text-brand-gold">إضافة عالم أو تحريره</h2><form action={saveScholarAction} className="grid gap-3 sm:grid-cols-2"><Field name="id" label="معرّف السجل للتحرير (اختياري)" placeholder="UUID" /><Field name="name_ar" label="الاسم بالعربية" required /><Field name="name_en" label="الاسم بالإنجليزية" /><Field name="slug" label="الرابط المختصر" required /><div className="sm:col-span-2"><Field name="bio_ar" label="السيرة بالعربية" textarea required /></div><div className="sm:col-span-2"><Field name="bio_en" label="السيرة بالإنجليزية" textarea /></div><Field name="thumbnail_url" label="رابط الصورة المصغرة" /><Field name="website_url" label="الموقع الرسمي" /><Field name="youtube_url" label="قناة YouTube" /><Published /><Button type="submit" className="sm:col-span-2">حفظ العالم</Button></form></Card>
      <Card className="space-y-4"><h2 className="text-xl font-bold text-brand-gold">تحرير بيانات السور</h2><p className="text-xs leading-6 text-brand-cream/45">يتم تعديل البيانات الوصفية فقط. نص الآيات لا يُنشأ من هذه الشاشة ولا يُستبدل دون مصدر موثوق.</p><div className="grid gap-4">{data.surahs.map((surah) => <form key={surah.id} action={saveSurahAction} className="grid gap-2 rounded-xl border border-brand-gold/10 bg-black/15 p-3 sm:grid-cols-2"><Field name="id" label="رقم السورة" defaultValue={surah.id} required /><Field name="order" label="الترتيب" defaultValue={surah.order} required /><Field name="name_ar" label="الاسم بالعربية" defaultValue={surah.name_ar} required /><Field name="name_en" label="الاسم بالإنجليزية" defaultValue={surah.name_en} /><Field name="slug" label="الرابط المختصر" defaultValue={surah.slug} required /><Field name="ayahs_count" label="عدد الآيات" defaultValue={surah.ayahs_count} required /><Field name="name_translation" label="الترجمة" defaultValue={surah.name_translation} /><Field name="revelation_place" label="مكان النزول" defaultValue={surah.revelation_place} /><Button type="submit" className="sm:col-span-2">حفظ سورة {surah.name_ar}</Button></form>)}</div></Card>
      <Card className="space-y-4"><h2 className="text-xl font-bold text-brand-gold">إضافة أو تحرير حديث</h2><form action={saveHadithAction} className="grid gap-3 sm:grid-cols-2"><Field name="id" label="معرّف الحديث للتحرير (اختياري)" placeholder="UUID" /><label className="grid gap-1 text-sm text-brand-cream/75"><span>كتاب الحديث</span><select name="book_id" required className="w-full rounded-xl border border-brand-gold/20 bg-black/25 px-3 py-2 text-sm text-brand-cream">{data.books.map((book) => <option key={book.id} value={book.id}>{book.name_ar} — {book.name_en}</option>)}</select></label><Field name="hadith_number" label="رقم الحديث" required /><Field name="chapter" label="الباب" /><Field name="narrator_ar" label="الراوي بالعربية" /><Field name="narrator_en" label="الراوي بالإنجليزية" /><div className="sm:col-span-2"><Field name="text_ar" label="نص الحديث بالعربية" textarea required /></div><div className="sm:col-span-2"><Field name="text_en" label="نص الحديث بالإنجليزية" textarea /></div><Field name="grade_ar" label="الدرجة بالعربية" placeholder="صحيح / حسن..." /><Field name="grade_en" label="الدرجة بالإنجليزية" /><Field name="ref" label="المصدر والمرجع" placeholder="الكتاب / الموضع / الرابط" /><Published /><Button type="submit" className="sm:col-span-2">حفظ الحديث</Button></form></Card>
    </section>

    <section className="space-y-4">
      <h2 className="text-xl font-bold text-brand-gold">تحرير السجلات الموجودة</h2>
      <p className="text-sm leading-6 text-brand-cream/50">افتح السجل المطلوب، عدّل الحقول، ثم احفظ. الحقول العربية والمصدر مطلوبة للمحتوى الديني قبل النشر.</p>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card><details><summary className="cursor-pointer font-semibold text-brand-gold">تحرير الصحابة ({data.companions.length})</summary><div className="mt-4 space-y-4">{data.companions.map((item) => <form key={item.id} action={saveCompanionAction} className="space-y-2 border-t border-brand-gold/10 pt-3"><input type="hidden" name="id" value={item.id} /><Field name="name_ar" label="الاسم" defaultValue={item.name_ar} required /><Field name="name_en" label="الاسم بالإنجليزية" defaultValue={item.name_en} /><Field name="slug" label="الرابط" defaultValue={item.slug} required /><Field name="bio_ar" label="السيرة" defaultValue={item.bio_ar} textarea required /><Field name="category" label="التصنيف" defaultValue={item.category} /><Field name="source" label="المصدر" defaultValue={item.metadata && typeof item.metadata === 'object' && 'source' in item.metadata ? String(item.metadata.source ?? '') : ''} /><Published checked={item.published} /><Button type="submit" size="sm">حفظ التعديل</Button></form>)}</div></details></Card>
        <Card><details><summary className="cursor-pointer font-semibold text-brand-gold">تحرير العلماء ({data.scholars.length})</summary><div className="mt-4 space-y-4">{data.scholars.map((item) => <form key={item.id} action={saveScholarAction} className="space-y-2 border-t border-brand-gold/10 pt-3"><input type="hidden" name="id" value={item.id} /><Field name="name_ar" label="الاسم" defaultValue={item.name_ar} required /><Field name="name_en" label="الاسم بالإنجليزية" defaultValue={item.name_en} /><Field name="slug" label="الرابط" defaultValue={item.slug} required /><Field name="bio_ar" label="السيرة" defaultValue={item.bio_ar} textarea required /><Field name="website_url" label="الموقع الرسمي" defaultValue={item.website_url} /><Field name="youtube_url" label="قناة YouTube" defaultValue={item.youtube_url} /><Published checked={item.published} /><Button type="submit" size="sm">حفظ التعديل</Button></form>)}</div></details></Card>
        <Card><details><summary className="cursor-pointer font-semibold text-brand-gold">تحرير الأحاديث ({data.hadiths.length})</summary><div className="mt-4 space-y-4">{data.hadiths.map((item) => <form key={item.id} action={saveHadithAction} className="space-y-2 border-t border-brand-gold/10 pt-3"><input type="hidden" name="id" value={item.id} /><label className="grid gap-1 text-sm text-brand-cream/75"><span>كتاب الحديث</span><select name="book_id" defaultValue={item.book_id} required className="w-full rounded-xl border border-brand-gold/20 bg-black/25 px-3 py-2 text-sm text-brand-cream">{data.books.map((book) => <option key={book.id} value={book.id}>{book.name_ar}</option>)}</select></label><Field name="hadith_number" label="الرقم" defaultValue={item.hadith_number} required /><Field name="chapter" label="الباب" defaultValue={item.chapter} /><Field name="text_ar" label="النص العربي" defaultValue={item.text_ar} textarea required /><Field name="narrator_ar" label="الراوي" defaultValue={item.narrator_ar} /><Field name="grade_ar" label="الدرجة" defaultValue={item.grade_ar} /><Field name="ref" label="المصدر" defaultValue={item.ref} /><Published checked={item.published} /><Button type="submit" size="sm">حفظ التعديل</Button></form>)}</div></details></Card>
      </div>
    </section>

    <section className="space-y-4"><h2 className="text-xl font-bold text-brand-gold">آخر السجلات للمراجعة</h2><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {([
        { label: 'الصحابة', values: data.companions.map((x) => x.name_ar) },
        { label: 'العلماء', values: data.scholars.map((x) => x.name_ar) },
        { label: 'السور', values: data.surahs.map((x) => x.name_ar) },
        { label: 'الأحاديث', values: data.hadiths.map((x) => `#${x.hadith_number ?? ''}`) },
      ] as Array<{ label: string; values: string[] }>).map(({ label, values }) => (
        <Card key={label}>
          <h3 className="font-semibold text-brand-gold">{label}</h3>
          <p className="mt-2 text-sm text-brand-cream/55">{values.join('، ') || 'لا توجد سجلات'}</p>
        </Card>
      ))}
    </div></section>
  </Container>;
}
