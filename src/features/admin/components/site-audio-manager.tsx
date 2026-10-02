"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { CURATED_AUDIO_LIBRARY } from "@/lib/audio/curated-library";

type Kind = "adhan" | "salawat" | "dhikr";
type Asset = {
  id: string;
  kind: Kind;
  title: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

const kinds: { id: Kind; label: string; hint: string }[] = [
  { id: "adhan", label: "أذان الصلاة", hint: "تسجيلات بشرية متعددة مع مصدر وترخيص ظاهرين." },
  { id: "salawat", label: "الصلاة على النبي ﷺ", hint: "مقاطع بشرية مستقلة للتذكير، مع إمكانية إضافة تسجيلاتك." },
  { id: "dhikr", label: "التسبيح والذكر", hint: "مقاطع بشرية مستقلة للذكر والتسبيح، مع دعم عدة تسجيلات." },
];

const accepted = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/ogg", "audio/mp4", "audio/aac", "audio/webm"];

function curatedInfo(asset: Asset) {
  if (!asset.storage_path.startsWith("curated:")) return null;
  const key = asset.storage_path.slice("curated:".length);
  return CURATED_AUDIO_LIBRARY.find(item => item.key === key) ?? null;
}

export function SiteAudioManager() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [kind, setKind] = useState<Kind>("adhan");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const response = await fetch("/api/admin/site-audio", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "تعذر تحميل المقاطع.");
    setAssets(payload.assets);
  };

  useEffect(() => {
    void load().catch(error => setStatus(error instanceof Error ? error.message : "تعذر التحميل."));
  }, []);

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!accepted.includes(file.type) || file.size > 50 * 1024 * 1024) {
      setStatus("استخدم MP3 أو WAV أو OGG أو M4A أو WebM بحجم لا يتجاوز 50MB.");
      event.target.value = "";
      return;
    }

    setBusy(true);
    setStatus("جارٍ رفع المقطع…");
    try {
      const presign = await fetch("/api/admin/site-audio/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          contentLength: file.size,
        }),
      });
      const signed = await presign.json();
      if (!presign.ok) throw new Error(signed.error ?? "تعذر تجهيز الرفع.");

      const uploadResponse = await fetch(signed.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadResponse.ok) throw new Error("تعذر رفع ملف الصوت إلى التخزين.");

      const save = await fetch("/api/admin/site-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          title: title.trim() || file.name.replace(/\.[^.]+$/, ""),
          storagePath: signed.path,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });
      const payload = await save.json();
      if (!save.ok) throw new Error(payload.error ?? "تعذر حفظ المقطع.");

      setAssets(current => [payload.asset, ...current]);
      setTitle("");
      setStatus("تم رفع المقطع. اختر «جعله الأساسي» لتفعيله.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "فشل رفع المقطع.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  const makePrimary = async (asset: Asset) => {
    setBusy(true);
    setStatus("جارٍ تفعيل المقطع…");
    try {
      const response = await fetch("/api/admin/site-audio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: asset.id, kind: asset.kind }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "تعذر تفعيل المقطع.");
      setAssets(current => current.map(item => ({
        ...item,
        is_primary: item.kind === asset.kind ? item.id === asset.id : item.is_primary,
      })));
      setStatus("تم تعيين المقطع الأساسي.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "تعذر تفعيل المقطع.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (asset: Asset) => {
    if (asset.storage_path.startsWith("curated:")) return;
    if (!window.confirm("حذف «" + asset.title + "» نهائيًا؟")) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/site-audio?id=" + encodeURIComponent(asset.id), { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "تعذر حذف المقطع.");
      setAssets(current => current.filter(item => item.id !== asset.id));
      setStatus("تم حذف المقطع.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "تعذر حذف المقطع.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-7" dir="rtl">
      <section className="rounded-2xl border border-brand-gold/20 bg-black/25 p-5 shadow-xl shadow-black/15">
        <h2 className="text-xl font-bold text-brand-gold">مكتبة الصوت البشري</h2>
        <p className="mt-1 text-sm leading-7 text-brand-cream/55">
          الأذان والتذكير بالصلاة على النبي ﷺ والتسبيح لها مكتبات منفصلة. لا يُوصف أي ملف مرفوع بأنه بشري إلا على مسؤولية الإدارة.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm text-brand-cream/75">
            النوع
            <select value={kind} onChange={event => setKind(event.target.value as Kind)} disabled={busy} className="rounded-xl border border-brand-gold/25 bg-black/35 px-3 py-2.5 text-brand-cream">
              {kinds.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-brand-cream/75">
            اسم المقطع
            <input value={title} onChange={event => setTitle(event.target.value)} maxLength={120} disabled={busy} placeholder="مثال: أذان الشيخ …" className="rounded-xl border border-brand-gold/25 bg-black/35 px-3 py-2.5 text-brand-cream placeholder:text-brand-cream/30" />
          </label>
        </div>

        <input ref={inputRef} className="sr-only" type="file" accept={accepted.join(",")} onChange={upload} />
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="mt-5 rounded-xl bg-brand-gold px-5 py-2.5 text-sm font-bold text-brand-emeraldDeep disabled:opacity-50">
          {busy ? "جارٍ المعالجة…" : "اختيار ورفع ملف صوتي"}
        </button>
        <p className="mt-3 text-xs leading-5 text-brand-cream/45">MP3، WAV، OGG، M4A، AAC، WebM — الحد الأقصى 50MB.</p>
        {status && <p role="status" className="mt-3 text-sm text-brand-gold/90">{status}</p>}
      </section>

      {kinds.map(group => (
        <section key={group.id} className="rounded-2xl border border-brand-cream/10 bg-black/20 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-brand-cream">{group.label}</h2>
              <p className="mt-1 text-sm text-brand-cream/50">{group.hint}</p>
            </div>
            <span className="rounded-full border border-brand-gold/15 px-3 py-1 text-xs text-brand-gold">
              {assets.filter(asset => asset.kind === group.id).length} مقاطع
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {assets.filter(asset => asset.kind === group.id).map(asset => {
              const curated = curatedInfo(asset);
              return (
                <article key={asset.id} className="rounded-xl border border-brand-gold/10 bg-black/25 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-brand-cream">{asset.title}</h3>
                        {asset.is_primary && <span className="rounded-full bg-brand-gold/15 px-2 py-0.5 text-xs font-bold text-brand-gold">الأساسي</span>}
                        {curated && <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-bold text-emerald-200">مصدر مفتوح</span>}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-brand-cream/40">
                        {curated ? curated.sourceName + " · " + curated.license : ((asset.size_bytes / 1024 / 1024).toFixed(1) + " MB · " + new Date(asset.created_at).toLocaleDateString("ar-EG"))}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button disabled={busy || asset.is_primary} onClick={() => void makePrimary(asset)} className="rounded-lg border border-brand-gold/35 px-3 py-1.5 text-xs text-brand-gold disabled:opacity-40">جعله الأساسي</button>
                      {!curated && <button disabled={busy} onClick={() => void remove(asset)} className="rounded-lg border border-red-300/25 px-3 py-1.5 text-xs text-red-200 disabled:opacity-40">حذف</button>}
                    </div>
                  </div>
                </article>
              );
            })}
            {assets.every(asset => asset.kind !== group.id) && <p className="rounded-xl border border-dashed border-brand-cream/15 p-4 text-sm text-brand-cream/40">لا توجد مقاطع لهذا النوع بعد.</p>}
          </div>
        </section>
      ))}
    </div>
  );
}
