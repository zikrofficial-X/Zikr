"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

type Asset = {
  id: string;
  name: string;
  title: string | null;
  media_type: string;
  asset_type: string | null;
  url: string;
  mime_type: string | null;
  size_bytes: number | null;
  license: string | null;
  attribution: string | null;
  rights_verified: boolean;
  verified_rights: boolean;
  published: boolean;
  source_id: string | null;
};

const folders = ["media", "homepage", "stories", "articles", "videos", "competitions", "branding", "kids"];

export default function AdminMediaPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [altText, setAltText] = useState("");
  const [license, setLicense] = useState("");
  const [attribution, setAttribution] = useState("");
  const [folder, setFolder] = useState("media");
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/media", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as { assets?: Asset[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "تعذر تحميل مكتبة الوسائط.");
      setAssets(Array.isArray(payload.assets) ? payload.assets : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تحميل مكتبة الوسائط.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const pendingRights = useMemo(() => assets.filter((a) => !(a.rights_verified && a.verified_rights)).length, [assets]);
  const published = useMemo(() => assets.filter((a) => a.published).length, [assets]);

  async function upload() {
    setError(""); setMessage("");
    if (!file) return setError("اختر صورة أولًا.");
    if (!license.trim() && !attribution.trim()) return setError("أدخل الترخيص أو بيانات النسب.");
    setBusy(true);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("title", title.trim() || file.name);
      form.set("alt_text_ar", altText.trim());
      form.set("license", license.trim());
      form.set("attribution", attribution.trim());
      form.set("folder", folder);
      const response = await fetch("/api/admin/media", { method: "POST", body: form });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "فشل رفع الأصل.");
      setMessage("تم رفع الأصل وتسجيله كغير منشور حتى توثيق الحقوق.");
      setTitle(""); setAltText(""); setLicense(""); setAttribution(""); setFile(null);
      const input = document.getElementById("media-file") as HTMLInputElement | null;
      if (input) input.value = "";
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "فشل رفع الأصل.");
    } finally { setBusy(false); }
  }

  async function mutate(id: string, action: "verify_rights" | "publish" | "unpublish") {
    setError(""); setMessage(""); setBusy(true);
    try {
      const response = await fetch("/api/admin/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "تعذر تنفيذ الإجراء.");
      setMessage("تم تنفيذ الإجراء.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تنفيذ الإجراء.");
    } finally { setBusy(false); }
  }

  return (
    <Container className="py-10 space-y-6" dir="rtl">
      <header>
        <p className="text-xs tracking-[0.2em] text-brand-cream/30">MEDIA LIBRARY</p>
        <h1 className="mt-2 text-3xl font-bold text-brand-gold">مكتبة الوسائط والحقوق</h1>
        <p className="mt-2 text-sm leading-7 text-brand-cream/50">رفع الأصول، تسجيل الترخيص والنسب، توثيق الحقوق، ثم نشر الأصل بعد اكتمال المراجعة.</p>
      </header>

      {error && <div role="alert" className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>}
      {message && <div role="status" className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{message}</div>}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5"><p className="text-xs text-brand-cream/35">إجمالي الأصول</p><p className="mt-2 text-3xl font-bold text-brand-cream">{assets.length}</p></div>
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5"><p className="text-xs text-brand-cream/35">حقوق تحتاج مراجعة</p><p className="mt-2 text-3xl font-bold text-amber-200">{pendingRights}</p></div>
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5"><p className="text-xs text-brand-cream/35">منشور</p><p className="mt-2 text-3xl font-bold text-emerald-200">{published}</p></div>
      </section>

      <section className="rounded-2xl border border-brand-gold/15 bg-black/20 p-5 space-y-4">
        <h2 className="text-lg font-bold text-brand-gold">رفع أصل جديد</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان الأصل" className="rounded-xl border border-brand-gold/15 bg-black/30 p-3 text-brand-cream" />
          <input value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="النص البديل بالعربية" className="rounded-xl border border-brand-gold/15 bg-black/30 p-3 text-brand-cream" />
          <input value={license} onChange={(e) => setLicense(e.target.value)} placeholder="الترخيص" className="rounded-xl border border-brand-gold/15 bg-black/30 p-3 text-brand-cream" />
          <input value={attribution} onChange={(e) => setAttribution(e.target.value)} placeholder="النسب / صاحب الحقوق" className="rounded-xl border border-brand-gold/15 bg-black/30 p-3 text-brand-cream" />
          <select value={folder} onChange={(e) => setFolder(e.target.value)} className="rounded-xl border border-brand-gold/15 bg-black/30 p-3 text-brand-cream">{folders.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <input id="media-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="rounded-xl border border-brand-gold/15 bg-black/30 p-2 text-xs text-brand-cream" />
        </div>
        <Button variant="primary" disabled={busy || !file} onClick={() => void upload()}>{busy ? "جاري التنفيذ..." : "رفع وتسجيل الأصل"}</Button>
      </section>

      <section className="rounded-2xl border border-brand-gold/10 bg-black/15 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] text-sm">
            <thead className="bg-black/20"><tr>{["الأصل","المجلد","الرابط","الترخيص","الحقوق","الحالة","الإجراء"].map((h) => <th key={h} className="px-4 py-3 text-right text-brand-gold/70">{h}</th>)}</tr></thead>
            <tbody>{assets.map((a) => {
              const rightsOk = a.rights_verified && a.verified_rights;
              return <tr key={a.id} className="border-t border-brand-gold/8">
                <td className="px-4 py-3"><div className="font-medium text-brand-cream/80">{a.title ?? a.name}</div><div className="text-[11px] text-brand-cream/25">{a.mime_type ?? a.media_type}</div></td>
                <td className="px-4 py-3 text-brand-cream/45">{a.asset_type ?? "media"}</td>
                <td className="px-4 py-3 max-w-[280px] truncate text-brand-cream/40">{a.url}</td>
                <td className="px-4 py-3 text-brand-cream/45">{[a.license, a.attribution].filter(Boolean).join(" · ") || "—"}</td>
                <td className="px-4 py-3">{rightsOk ? <span className="text-emerald-300">موثقة</span> : <span className="text-amber-300">تحتاج توثيق</span>}</td>
                <td className="px-4 py-3">{a.published ? <span className="text-emerald-300">منشور</span> : <span className="text-amber-300">مخفي</span>}</td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-2">
                  {!rightsOk && <Button variant="outline" disabled={busy} onClick={() => void mutate(a.id, "verify_rights")}>توثيق الحقوق</Button>}
                  {rightsOk && !a.published && <Button variant="outline" disabled={busy} onClick={() => void mutate(a.id, "publish")}>نشر</Button>}
                  {a.published && <Button variant="outline" disabled={busy} onClick={() => void mutate(a.id, "unpublish")}>إلغاء النشر</Button>}
                </div></td>
              </tr>;
            })}</tbody>
          </table>
        </div>
        {!loading && assets.length === 0 && <p className="p-8 text-center text-sm text-brand-cream/40">لا توجد أصول حتى الآن. استخدم نموذج الرفع بالأعلى.</p>}
      </section>
    </Container>
  );
}
