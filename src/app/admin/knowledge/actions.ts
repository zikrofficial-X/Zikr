'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/services/admin';
import { supabaseServerAdminRequest } from '@/lib/supabase/server';

function text(formData: FormData, key: string, required = false) {
  const value = String(formData.get(key) ?? '').trim();
  if (required && !value) throw new Error(`الحقل ${key} مطلوب.`);
  return value || null;
}

function id(formData: FormData) {
  const value = text(formData, 'id');
  return value && /^[0-9a-f-]{8,}$/i.test(value) ? value : null;
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
}

export async function saveCompanionAction(formData: FormData) {
  await requireAdmin();
  const nameAr = text(formData, 'name_ar', true)!;
  const nameEn = text(formData, 'name_en') ?? nameAr;
  const normalizedSlug = slug(text(formData, 'slug') ?? nameAr);
  if (!normalizedSlug) throw new Error('الرابط المختصر للصحابي مطلوب.');
  await supabaseServerAdminRequest('/rest/v1/companions?on_conflict=slug', {
    method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ id: id(formData) ?? undefined, name_ar: nameAr, name_en: nameEn, slug: normalizedSlug, bio_ar: text(formData, 'bio_ar'), bio_en: text(formData, 'bio_en'), category: text(formData, 'category'), thumbnail_url: text(formData, 'thumbnail_url'), featured_image_url: text(formData, 'featured_image_url'), order_num: Number(text(formData, 'order_num') ?? 0) || null, published: formData.has('published'), metadata: { source: text(formData, 'source') }, updated_at: new Date().toISOString() }),
  });
  revalidatePath('/companions'); revalidatePath('/admin/knowledge');
}

export async function saveScholarAction(formData: FormData) {
  await requireAdmin();
  const nameAr = text(formData, 'name_ar', true)!;
  const nameEn = text(formData, 'name_en') ?? nameAr;
  const normalizedSlug = slug(text(formData, 'slug') ?? nameAr);
  if (!normalizedSlug) throw new Error('الرابط المختصر للعالم مطلوب.');
  await supabaseServerAdminRequest('/rest/v1/scholars?on_conflict=slug', {
    method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ id: id(formData) ?? undefined, name_ar: nameAr, name_en: nameEn, slug: normalizedSlug, bio_ar: text(formData, 'bio_ar'), bio_en: text(formData, 'bio_en'), thumbnail_url: text(formData, 'thumbnail_url'), website_url: text(formData, 'website_url'), youtube_url: text(formData, 'youtube_url'), published: formData.has('published'), updated_at: new Date().toISOString() }),
  });
  revalidatePath('/scholars'); revalidatePath('/admin/knowledge');
}

export async function saveSurahAction(formData: FormData) {
  await requireAdmin();
  const surahId = Number(text(formData, 'id'));
  const order = Number(text(formData, 'order'));
  const ayahsCount = Number(text(formData, 'ayahs_count'));
  if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114) throw new Error('رقم السورة يجب أن يكون بين 1 و114.');
  if (!Number.isInteger(order) || order < 1) throw new Error('ترتيب السورة غير صحيح.');
  if (!Number.isInteger(ayahsCount) || ayahsCount < 1) throw new Error('عدد الآيات غير صحيح.');
  const nameAr = text(formData, 'name_ar', true)!;
  await supabaseServerAdminRequest(`/rest/v1/quran_surahs?id=eq.${surahId}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ name_ar: nameAr, name_en: text(formData, 'name_en') ?? nameAr, name_translation: text(formData, 'name_translation'), slug: slug(text(formData, 'slug') ?? nameAr), order, ayahs_count: ayahsCount, revelation_place: text(formData, 'revelation_place'), updated_at: new Date().toISOString() }) });
  revalidatePath('/quran'); revalidatePath(`/quran/${slug(text(formData, 'slug') ?? nameAr)}`); revalidatePath('/admin/knowledge');
}

export async function saveHadithAction(formData: FormData) {
  await requireAdmin();
  const bookId = text(formData, 'book_id', true)!;
  const hadithNumber = text(formData, 'hadith_number', true)!;
  const textAr = text(formData, 'text_ar', true)!;
  const payload = { book_id: bookId, hadith_number: hadithNumber, text_ar: textAr, text_en: text(formData, 'text_en'), narrator_ar: text(formData, 'narrator_ar'), narrator_en: text(formData, 'narrator_en'), chapter: text(formData, 'chapter'), grade_ar: text(formData, 'grade_ar'), grade_en: text(formData, 'grade_en'), ref: text(formData, 'ref'), published: formData.has('published'), updated_at: new Date().toISOString() };
  const hadithId = id(formData);
  await supabaseServerAdminRequest(hadithId ? `/rest/v1/hadiths?id=eq.${encodeURIComponent(hadithId)}` : '/rest/v1/hadiths', { method: hadithId ? 'PATCH' : 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(payload) });
  revalidatePath('/hadith'); revalidatePath('/admin/knowledge');
}
