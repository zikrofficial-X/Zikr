import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import { createCategoryAction, toggleCategoryVisibilityAction } from "./actions";

export const dynamic = "force-dynamic";

type CategoryRow = {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string | null;
  icon: string | null;
  is_active: boolean | null;
  published: boolean | null;
  updated_at: string | null;
  order_num?: number | null;
};

type CategoryGroup = {
  table: string;
  title: string;
  contentTable: string;
  route: string;
  rows: CategoryRow[];
  usedCounts: Map<string, number>;
  ok: boolean;
};

async function readRows<T>(path: string): Promise<{ rows: T[]; ok: boolean }> {
  try {
    const rows = await supabaseServerAdminRequest<T[]>(path, { method: "GET" });
    return { rows: rows ?? [], ok: true };
  } catch (error) {
    console.error("[admin/categories] read failed:", path.split("?")[0], error);
    return { rows: [], ok: false };
  }
}

function active(row: CategoryRow) {
  return row.is_active ?? row.published ?? true;
}

const groups = [
  { table: "article_categories", title: "تصنيفات المقالات", contentTable: "articles", route: "/articles" },
  { table: "dua_categories", title: "تصنيفات الأدعية", contentTable: "duas", route: "/dua" },
  { table: "video_categories", title: "تصنيفات الفيديو", contentTable: "videos", route: "/videos" },
  { table: "tawasheeh_categories", title: "تصنيفات التواشيح", contentTable: "tawasheeh", route: "/tawasheeh" },
] as const;

export default async function AdminCategoriesPage() {
  await requireAdminPermission("content.manage");

  const loaded = await Promise.all(groups.map(async (group) => {
    const [categoryResult, contentResult] = await Promise.all([
      readRows<CategoryRow>(
        `/rest/v1/${group.table}?select=id,name_ar,name_en,slug,description_ar,icon,is_active,published,updated_at${group.table === "tawasheeh_categories" ? ",order_num" : ""}&order=name_ar.asc&limit=500`,
      ),
      readRows<{ category_id: string | null }>(
        `/rest/v1/${group.contentTable}?select=category_id&limit=10000`,
      ),
    ]);
    const usedCounts = new Map<string, number>();
    for (const row of contentResult.rows) {
      if (row.category_id) usedCounts.set(row.category_id, (usedCounts.get(row.category_id) ?? 0) + 1);
    }
    return {
      ...group,
      rows: categoryResult.rows,
      usedCounts,
      ok: categoryResult.ok && contentResult.ok,
    } satisfies CategoryGroup;
  }));

  const totalCategories = loaded.reduce((sum, group) => sum + group.rows.length, 0);
  const activeCategories = loaded.reduce((sum, group) => sum + group.rows.filter(active).length, 0);
  const categoriesWithUsage = loaded.reduce(
    (sum, group) => sum + group.rows.filter((row) => (group.usedCounts.get(row.id) ?? 0) > 0).length,
    0,
  );
  const readFailures = loaded.filter((group) => !group.ok);

  return (
    <Container className="space-y-8 py-10 text-right" dir="rtl">
      <header className="space-y-2">
        <Link href="/admin/content" className="text-xs text-brand-gold/60 hover:text-brand-gold">← إدارة المحتوى</Link>
        <p className="mt-4 text-xs tracking-[0.2em] text-brand-cream/30">CONTENT / TAXONOMY GOVERNANCE</p>
        <h1 className="text-3xl font-bold text-brand-gold">إدارة التصنيفات</h1>
        <p className="max-w-4xl text-sm leading-7 text-brand-cream/55">
          مركز موحد لأربع مجموعات تصنيف مرتبطة بالمحتوى الفعلي. الإنشاء يبدأ كمسودة غير منشورة، والإيقاف أرشفة قابلة للعكس؛ لا يوجد حذف مباشر حتى لا تنكسر علاقات المحتوى.
        </p>
      </header>

      {readFailures.length > 0 && (
        <div role="alert" className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm leading-7 text-red-100">
          تعذر تحميل بعض مجموعات التصنيفات أو بيانات الاستخدام: {readFailures.map((group) => group.title).join("، ")}. تعرض هذه المجموعات كغير متاحة، ولا تُعامل كأنها فارغة.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-xs text-brand-cream/40">التصنيفات المقروءة</p><p className="mt-2 text-3xl font-bold text-brand-gold">{totalCategories.toLocaleString("ar-EG-u-nu-latn")}</p></Card>
        <Card><p className="text-xs text-brand-cream/40">نشطة حسب البيانات</p><p className="mt-2 text-3xl font-bold text-emerald-300">{activeCategories.toLocaleString("ar-EG-u-nu-latn")}</p></Card>
        <Card><p className="text-xs text-brand-cream/40">لها محتوى مرتبط</p><p className="mt-2 text-3xl font-bold text-sky-200">{categoriesWithUsage.toLocaleString("ar-EG-u-nu-latn")}</p></Card>
        <Card><p className="text-xs text-brand-cream/40">مجموعات التصنيف</p><p className="mt-2 text-3xl font-bold text-brand-cream">{groups.length}</p></Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {loaded.map((group) => {
          const enabled = group.rows.filter(active).length;
          const usage = group.rows.reduce((sum, row) => sum + (group.usedCounts.get(row.id) ?? 0), 0);
          return (
            <article key={group.table} className="overflow-hidden rounded-2xl border border-brand-gold/10 bg-black/15">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-brand-gold/10 p-5">
                <div>
                  <h2 className="text-lg font-bold text-brand-gold">{group.title}</h2>
                  <p className="mt-1 text-xs text-brand-cream/40" dir="ltr">{group.table} · {group.contentTable}</p>
                </div>
                <div className="text-left text-xs text-brand-cream/45">
                  <p>{group.ok ? `${group.rows.length} تصنيف` : "قراءة غير مكتملة"}</p>
                  <p>{group.ok ? `${enabled} نشط · ${usage} عنصر مرتبط` : "لا يمكن تأكيد الأرقام"}</p>
                </div>
              </div>

              <form action={createCategoryAction} className="grid gap-2 border-b border-brand-gold/10 bg-black/10 p-4 sm:grid-cols-2">
                <input type="hidden" name="table" value={group.table} />
                <label className="grid gap-1 text-xs text-brand-cream/50">
                  الاسم بالعربية
                  <input required maxLength={180} name="name_ar" className="rounded-lg border border-brand-gold/15 bg-black/30 px-3 py-2 text-sm text-brand-cream" />
                </label>
                <label className="grid gap-1 text-xs text-brand-cream/50">
                  الاسم بالإنجليزية
                  <input required maxLength={180} name="name_en" className="rounded-lg border border-brand-gold/15 bg-black/30 px-3 py-2 text-sm text-brand-cream" />
                </label>
                <label className="grid gap-1 text-xs text-brand-cream/50">
                  Slug
                  <input required maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" name="slug" placeholder="category-name" dir="ltr" className="rounded-lg border border-brand-gold/15 bg-black/30 px-3 py-2 text-sm text-brand-cream" />
                </label>
                <label className="grid gap-1 text-xs text-brand-cream/50">
                  الوصف المختصر
                  <input maxLength={500} name="description_ar" className="rounded-lg border border-brand-gold/15 bg-black/30 px-3 py-2 text-sm text-brand-cream" />
                </label>
                {group.table === "tawasheeh_categories" && (
                  <label className="grid gap-1 text-xs text-brand-cream/50">
                    ترتيب العرض
                    <input name="order_num" type="number" min="0" max="100000" defaultValue="0" className="rounded-lg border border-brand-gold/15 bg-black/30 px-3 py-2 text-sm text-brand-cream" />
                  </label>
                )}
                <label className="grid gap-1 text-xs text-brand-cream/50">
                  الأيقونة (اختياري)
                  <input maxLength={80} name="icon" className="rounded-lg border border-brand-gold/15 bg-black/30 px-3 py-2 text-sm text-brand-cream" />
                </label>
                <div className="flex items-end">
                  <button type="submit" className="w-full rounded-lg border border-brand-gold/25 bg-brand-gold/10 px-4 py-2 text-sm font-semibold text-brand-gold hover:bg-brand-gold/15">
                    إنشاء كمسودة
                  </button>
                </div>
              </form>

              {!group.ok ? (
                <p className="p-6 text-sm text-red-200">بيانات هذه المجموعة غير متاحة حاليًا.</p>
              ) : group.rows.length === 0 ? (
                <p className="p-6 text-sm text-brand-cream/40">لا توجد تصنيفات في هذه المجموعة.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-sm">
                    <thead className="bg-black/20 text-brand-gold/70">
                      <tr>{["التصنيف", "المحتوى المرتبط", "الحالة", "الإجراء"].map((label) => <th key={label} className="px-4 py-3 text-right">{label}</th>)}</tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row) => {
                        const isActive = active(row);
                        return (
                          <tr key={row.id} className="border-t border-brand-gold/8">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-brand-cream/85">{row.name_ar}</p>
                              <p className="mt-1 text-[11px] text-brand-cream/35" dir="ltr">{row.slug}</p>
                            </td>
                            <td className="px-4 py-3 text-brand-cream/65">{(group.usedCounts.get(row.id) ?? 0).toLocaleString("ar-EG-u-nu-latn")}</td>
                            <td className="px-4 py-3">{isActive ? <span className="text-emerald-300">نشط</span> : <span className="text-amber-300">مؤرشف / مخفي</span>}</td>
                            <td className="px-4 py-3">
                              <form action={toggleCategoryVisibilityAction}>
                                <input type="hidden" name="table" value={group.table} />
                                <input type="hidden" name="id" value={row.id} />
                                <button type="submit" className="rounded-lg border border-brand-gold/15 px-3 py-1.5 text-xs text-brand-cream/70 hover:border-brand-gold/35 hover:text-brand-gold">
                                  {isActive ? "أرشفة" : "إعادة تفعيل"}
                                </button>
                              </form>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </Container>
  );
}
