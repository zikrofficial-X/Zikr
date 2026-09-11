import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAdminClient, supabaseServerAdminRequest } from '@/lib/supabase/server';
import { requireAdminPermission } from '@/lib/services/admin';
import { requireAdminStepUp } from '@/lib/services/admin-security';
import { recordAdminAuditEvent } from '@/lib/services/admin-audit';

type LibraryAction = 'create' | 'status' | 'publish' | 'unpublish' | 'delete';

async function mutate(formData: FormData) {
  'use server';

  const action = String(formData.get('_action') ?? '') as LibraryAction;
  const id = String(formData.get('id') ?? '').trim();

  if (!['create', 'status', 'publish', 'unpublish', 'delete'].includes(action)) {
    redirect('/admin/library?error=إجراء غير صالح.');
  }

  if (action === 'create') {
    const admin = await requireAdminPermission('library.manage');
    const titleAr = String(formData.get('title_ar') ?? '').trim();
    const bodyAr = String(formData.get('body_ar') ?? '').trim();
    const type = String(formData.get('content_type') ?? 'article').trim() || 'article';
    const category = String(formData.get('category') ?? 'general').trim() || 'general';
    if (!titleAr || !bodyAr) redirect('/admin/library?error=العنوان والمحتوى العربي مطلوبان.');

    const slug = `${titleAr.toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, '-').replace(/^-|-$/g, '') || 'item'}-${crypto.randomUUID().slice(0, 8)}`;
    try {
      const rows = await supabaseServerAdminRequest<Array<{ id: string }>>('/rest/v1/content_library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({
          slug,
          title_ar: titleAr,
          body_ar: bodyAr,
          content_type: type,
          category,
          tags: [],
          review_status: 'draft',
          published: false,
          updated_at: new Date().toISOString(),
        }),
      });
      const createdId = rows?.[0]?.id;
      if (createdId) {
        await recordAdminAuditEvent({
          action: 'library.content.create',
          permission: 'library.manage',
          resourceType: 'content_library',
          resourceId: createdId,
          metadata: { title_ar: titleAr, content_type: type, category, actor: admin.id },
        });
      }
    } catch (error) {
      console.error('[admin/library] create failed', error);
      redirect('/admin/library?error=تعذر إنشاء المادة.');
    }
  }

  if (!id && action !== 'create') redirect('/admin/library?error=معرّف المادة مطلوب.');

  if (id && action === 'status') {
    const admin = await requireAdminStepUp('knowledge.manage', '/admin/library');
    const status = String(formData.get('review_status') ?? 'draft').trim();
    const allowed = new Set(['draft', 'editorial_review', 'scholarly_review', 'approved', 'rejected']);
    if (!allowed.has(status)) redirect('/admin/library?error=حالة مراجعة غير صالحة.');
    try {
      const patch: Record<string, unknown> = {
        review_status: status,
        updated_at: new Date().toISOString(),
      };
      if (status !== 'approved') patch.published = false;
      await supabaseServerAdminRequest(`/rest/v1/content_library?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(patch),
      });
      await recordAdminAuditEvent({
        action: 'library.content.review_status.update',
        permission: 'knowledge.manage',
        resourceType: 'content_library',
        resourceId: id,
        metadata: { status, actor: admin.id },
      });
    } catch (error) {
      console.error('[admin/library] status failed', error);
      redirect('/admin/library?error=تعذر تحديث حالة المراجعة.');
    }
  }

  if (id && action === 'publish') {
    await requireAdminStepUp('content.publish', '/admin/library');
    const sourceId = String(formData.get('source_id') ?? '').trim();
    if (!sourceId) redirect('/admin/library?error=اختر مصدرًا موثوقًا قبل النشر.');
    try {
      const source = await supabaseServerAdminRequest<Array<{ id: string; verified: boolean }>>(
        `/rest/v1/content_sources?select=id,verified&id=eq.${encodeURIComponent(sourceId)}&limit=1`,
        { method: 'GET' },
      );
      if (!source[0]?.verified) redirect('/admin/library?error=المصدر المختار غير موثّق.');

      const now = new Date().toISOString();
      await supabaseServerAdminRequest(`/rest/v1/content_library?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ review_status: 'approved', source_id: sourceId, published: true, published_at: now, updated_at: now }),
      });
      await recordAdminAuditEvent({
        action: 'library.content.publish',
        permission: 'content.publish',
        resourceType: 'content_library',
        resourceId: id,
        metadata: { source_id: sourceId },
      });
    } catch (error) {
      console.error('[admin/library] publish failed', error);
      redirect('/admin/library?error=تعذر نشر المادة. تحقق من الاعتماد والمصدر.');
    }
  }

  if (id && action === 'unpublish') {
    await requireAdminStepUp('content.publish', '/admin/library');
    try {
      await supabaseServerAdminRequest(`/rest/v1/content_library?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ published: false, updated_at: new Date().toISOString() }),
      });
      await recordAdminAuditEvent({
        action: 'library.content.unpublish',
        permission: 'content.publish',
        resourceType: 'content_library',
        resourceId: id,
      });
    } catch (error) {
      console.error('[admin/library] unpublish failed', error);
      redirect('/admin/library?error=تعذر إلغاء النشر.');
    }
  }

  if (id && action === 'delete') {
    await requireAdminStepUp('content.delete', '/admin/library');
    try {
      const current = await supabaseServerAdminRequest<Array<{ published: boolean }>>(
        `/rest/v1/content_library?select=published&id=eq.${encodeURIComponent(id)}&limit=1`,
        { method: 'GET' },
      );
      if (!current[0]) redirect('/admin/library?error=المادة غير موجودة.');
      if (current[0].published) redirect('/admin/library?error=لا يمكن حذف مادة منشورة. ألغِ النشر أولًا.');

      await supabaseServerAdminRequest(`/rest/v1/content_library?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' },
      });
      await recordAdminAuditEvent({
        action: 'library.content.delete',
        permission: 'content.delete',
        resourceType: 'content_library',
        resourceId: id,
      });
    } catch (error) {
      console.error('[admin/library] delete failed', error);
      redirect('/admin/library?error=تعذر حذف المادة.');
    }
  }

  revalidatePath('/admin/library');
  revalidatePath('/library');
  redirect('/admin/library?success=تم تنفيذ العملية بنجاح.');
}

export default async function AdminLibraryPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  await requireAdminPermission('library.manage');
  const params = searchParams ? await searchParams : {};
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

      {(params.error || params.success) && (
        <div role={params.error ? 'alert' : 'status'} className={`rounded-2xl border px-4 py-3 text-sm ${params.error ? 'border-red-500/25 bg-red-500/10 text-red-100' : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100'}`}>
          {params.error ?? params.success}
        </div>
      )}

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
        <table className="w-full min-w-[1050px] text-sm">
          <thead className="bg-black/30 text-brand-gold"><tr><th className="p-3 text-right">المادة</th><th className="p-3">النوع</th><th className="p-3">التصنيف</th><th className="p-3">المراجعة</th><th className="p-3">المصدر</th><th className="p-3">النشر</th><th className="p-3">إجراء</th></tr></thead>
          <tbody>{rows.map((item) => <tr key={item.id} className="border-t border-brand-gold/10"><td className="p-3 text-brand-cream">{item.title_ar}</td><td className="p-3 text-brand-cream/60">{item.content_type}</td><td className="p-3 text-brand-cream/60">{item.category}</td><td className="p-3 text-brand-cream/60">{item.review_status}</td><td className="p-3 text-xs">{item.source_id ? <span className="text-emerald-300">مرتبط</span> : <span className="text-amber-300">غير مرتبط</span>}</td><td className="p-3">{item.published ? <span className="text-emerald-300">منشور</span> : <span className="text-amber-300">مسودة</span>}</td><td className="p-3"><div className="flex flex-wrap gap-2 justify-center">
            <form action={mutate}><input type="hidden" name="_action" value="status"/><input type="hidden" name="id" value={item.id}/><select name="review_status" defaultValue={item.review_status} className="rounded-lg bg-black/30 border border-brand-gold/15 p-2"><option value="draft">Draft</option><option value="editorial_review">Editorial review</option><option value="scholarly_review">Scholarly review</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select><button className="mr-1 rounded-lg border border-brand-gold/20 px-2 py-1">حفظ</button></form>
            {!item.published && <form action={mutate}><input type="hidden" name="_action" value="publish"/><input type="hidden" name="id" value={item.id}/><select required name="source_id" defaultValue={item.source_id ?? ''} className="rounded-lg bg-black/30 border border-brand-gold/15 p-2"><option value="">المصدر</option>{(sources ?? []).filter((s) => s.verified).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select><button className="mr-1 rounded-lg border border-emerald-500/20 text-emerald-300 px-2 py-1">نشر</button></form>}
            {item.published && <form action={mutate}><input type="hidden" name="_action" value="unpublish"/><input type="hidden" name="id" value={item.id}/><button className="rounded-lg border border-amber-500/20 text-amber-300 px-2 py-1">إلغاء النشر</button></form>}
            <form action={mutate}><input type="hidden" name="_action" value="delete"/><input type="hidden" name="id" value={item.id}/><button className="rounded-lg border border-red-500/20 text-red-300 px-2 py-1">حذف</button></form>
          </div></td></tr>)}</tbody>
        </table>
      </section>
    </main>
  );
}
