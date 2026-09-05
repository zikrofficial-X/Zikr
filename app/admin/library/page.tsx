import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/services/admin';

async function mutate(formData: FormData) {
  'use server';
  await requireAdmin();
  const db = createAdminClient();
  const action = String(formData.get('_action') ?? '');
  const id = String(formData.get('id') ?? '');
  const user = await requireAdmin();

  if (action === 'create') {
    const titleAr = String(formData.get('title_ar') ?? '').trim();
    const bodyAr = String(formData.get('body_ar') ?? '').trim();
    const type = String(formData.get('content_type') ?? 'article');
    const category = String(formData.get('category') ?? 'general');
    if (!titleAr || !bodyAr) return;
    const slug = `${titleAr.toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, '-').replace(/^-|-$/g, '') || 'item'}-${Date.now()}`;
    const { data, error } = await db.from('content_library').insert({ slug, title_ar: titleAr, body_ar: bodyAr, content_type: type, category, tags: [], review_status: 'draft', published: false }).select('id').single();
    if (!error && data) await db.from('admin_audit_log').insert({ user_id: user.id, action: 'create', entity_type: 'content_library', entity_id: data.id, meta: { title_ar: titleAr } });
  }

  if (id && action === 'status') {
    const status = String(formData.get('review_status') ?? 'draft');
    await db.from('content_library').update({ review_status: status }).eq('id', id);
    await db.from('admin_audit_log').insert({ user_id: user.id, action: 'review_status', entity_type: 'content_library', entity_id: id, meta: { status } });
  }

  if (id && action === 'publish') {
    const sourceId = String(formData.get('source_id') ?? '');
    if (!sourceId) return;
    await db.from('content_library').update({ review_status: 'approved', source_id: sourceId, published: true }).eq('id', id);
    await db.from('admin_audit_log').insert({ user_id: user.id, action: 'publish', entity_type: 'content_library', entity_id: id, meta: { source_id: sourceId } });
  }

  if (id && action === 'unpublish') {
    await db.from('content_library').update({ published: false }).eq('id', id);
    await db.from('admin_audit_log').insert({ user_id: user.id, action: 'unpublish', entity_type: 'content_library', entity_id: id, meta: {} });
  }

  if (id && action === 'delete') {
    await db.from('content_library').delete().eq('id', id);
    await db.from('admin_audit_log').insert({ user_id: user.id, action: 'delete', entity_type: 'content_library', entity_id: id, meta: {} });
  }

  revalidatePath('/admin/library');
  revalidatePath('/library');
}

export default async function AdminLibraryPage() {
  await requireAdmin();
  const db = createAdminClient();
  const [{ data: items }, { data: sources }, { count: mediaCount }, { count: gamesCount }] = await Promise.all([
    db.from('content_library').select('id,title_ar,title_en,content_type,category,review_status,published,source_id,updated_at').order('updated_at', { ascending: false }).limit(100),
    db.from('content_sources').select('id,name,verified,authority_level').order('name'),
    db.from('media_assets').select('id', { count: 'exact', head: true }),
    db.from('kids_games').select('id', { count: 'exact', head: true }),
  ]);
  const rows = items ?? [];
  const published = rows.filter((x) => x.published).length;
  const review = rows.filter((x) => x.review_status !== 'draft').length;

  return (
    <main className="mx-auto max-w-[1600px] space-y-8 p-4 md:p-8 text-right" dir="rtl">
      <header>
        <p className="text-xs tracking-[0.2em] text-brand-cream/35 uppercase">ZIKR CONTENT OPERATIONS</p>
        <h1 className="mt-2 text-3xl font-bold text-brand-gold">المكتبة الإسلامية ومركز المحتوى</h1>
        <p className="mt-2 max-w-4xl text-sm leading-7 text-brand-cream/55">إدارة المحتوى والمصادر والمراجعة والنشر من مكان واحد. المواد التأسيسية لا تُنشر تلقائيًا.</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ['إجمالي المواد', rows.length],
          ['منشور', published],
          ['قيد المراجعة', review],
          ['وسائط / ألعاب', `${mediaCount ?? 0} / ${gamesCount ?? 0}`],
        ].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-brand-gold/15 bg-black/20 p-5"><div className="text-2xl font-bold text-brand-gold">{value}</div><div className="mt-1 text-sm text-brand-cream/55">{label}</div></div>)}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <form action={mutate} className="rounded-2xl border border-brand-gold/15 bg-black/20 p-5 space-y-4">
          <h2 className="text-lg font-bold text-brand-gold">إضافة مادة جديدة</h2>
          <input type="hidden" name="_action" value="create" />
          <input name="title_ar" required placeholder="العنوان بالعربية" className="w-full rounded-xl border border-brand-gold/15 bg-black/30 p-3 text-brand-cream" />
          <div className="grid grid-cols-2 gap-3">
            <input name="content_type" defaultValue="article" placeholder="نوع المحتوى" className="rounded-xl border border-brand-gold/15 bg-black/30 p-3 text-brand-cream" />
            <input name="category" defaultValue="general" placeholder="التصنيف" className="rounded-xl border border-brand-gold/15 bg-black/30 p-3 text-brand-cream" />
          </div>
          <textarea name="body_ar" required rows={8} placeholder="المحتوى العربي" className="w-full rounded-xl border border-brand-gold/15 bg-black/30 p-3 text-brand-cream" />
          <button className="rounded-xl bg-brand-gold px-5 py-2.5 font-bold text-black">حفظ كمسودة</button>
        </form>

        <section className="rounded-2xl border border-brand-gold/15 bg-black/20 p-5 space-y-4">
          <h2 className="text-lg font-bold text-brand-gold">مصادر النشر المعتمدة</h2>
          {(sources ?? []).map((s) => <div key={s.id} className="flex items-center justify-between rounded-xl border border-brand-gold/10 bg-black/20 p-3"><div><div className="font-semibold text-brand-cream">{s.name}</div><div className="text-xs text-brand-cream/40">Authority {s.authority_level}</div></div><span className={`text-xs rounded-full border px-2 py-1 ${s.verified ? 'text-emerald-300 border-emerald-500/20' : 'text-amber-300 border-amber-500/20'}`}>{s.verified ? 'موثّق' : 'غير موثّق'}</span></div>)}
          <p className="text-xs leading-6 text-brand-cream/40">لا يمكن نشر مادة إلا بعد اعتمادها وربطها بمصدر موثّق.</p>
        </section>
      </section>

      <section className="rounded-2xl border border-brand-gold/15 overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-black/30 text-brand-gold"><tr><th className="p-3 text-right">المادة</th><th className="p-3">النوع</th><th className="p-3">التصنيف</th><th className="p-3">المراجعة</th><th className="p-3">النشر</th><th className="p-3">إجراء</th></tr></thead>
          <tbody>{rows.map((item) => <tr key={item.id} className="border-t border-brand-gold/10"><td className="p-3 text-brand-cream">{item.title_ar}</td><td className="p-3 text-brand-cream/60">{item.content_type}</td><td className="p-3 text-brand-cream/60">{item.category}</td><td className="p-3 text-brand-cream/60">{item.review_status}</td><td className="p-3">{item.published ? <span className="text-emerald-300">منشور</span> : <span className="text-amber-300">مسودة</span>}</td><td className="p-3"><div className="flex flex-wrap gap-2 justify-center">
            <form action={mutate}><input type="hidden" name="_action" value="status"/><input type="hidden" name="id" value={item.id}/><select name="review_status" defaultValue={item.review_status} className="rounded-lg bg-black/30 border border-brand-gold/15 p-2"><option value="draft">Draft</option><option value="editorial_review">Editorial review</option><option value="scholarly_review">Scholarly review</option><option value="rejected">Rejected</option></select><button className="mr-1 rounded-lg border border-brand-gold/20 px-2 py-1">حفظ</button></form>
            {!item.published && <form action={mutate}><input type="hidden" name="_action" value="publish"/><input type="hidden" name="id" value={item.id}/><select required name="source_id" defaultValue={item.source_id ?? ''} className="rounded-lg bg-black/30 border border-brand-gold/15 p-2"><option value="">المصدر</option>{(sources ?? []).filter((s) => s.verified).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select><button className="mr-1 rounded-lg border border-emerald-500/20 text-emerald-300 px-2 py-1">نشر</button></form>}
            {item.published && <form action={mutate}><input type="hidden" name="_action" value="unpublish"/><input type="hidden" name="id" value={item.id}/><button className="rounded-lg border border-amber-500/20 text-amber-300 px-2 py-1">إلغاء النشر</button></form>}
            <form action={mutate}><input type="hidden" name="_action" value="delete"/><input type="hidden" name="id" value={item.id}/><button className="rounded-lg border border-red-500/20 text-red-300 px-2 py-1">حذف</button></form>
          </div></td></tr>)}</tbody>
        </table>
      </section>
    </main>
  );
}
