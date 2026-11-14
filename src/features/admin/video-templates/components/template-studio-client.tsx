"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { redirectToAdminStepUp } from "@/features/admin/utils/step-up-client";

type Audience = "general" | "kids";
type Template = {
  id: string; slug: string; title: string; description: string; audience: Audience; asset_key: string;
};
type Version = {
  id: string; template_id: string; version: number; config: {
    assetKey?: string; defaultFormat?: "vertical" | "horizontal"; motion?: "slow" | "fade";
    fontPreset?: "auto" | "naskh" | "sans";
    palette?: "template" | "gold" | "emerald" | "monochrome";
    safeArea?: "standard" | "wide";
    captionStyle?: "classic" | "minimal" | "boxed";
    sourceCardStyle?: "standard" | "compact";
    audioPolicy?: "allow-tts" | "verified-audio-only";
  };
  status: "draft" | "approved" | "active" | "retired";
  is_system_seed: boolean; created_by: string | null; reviewed_by: string | null;
  reviewed_at: string | null; activated_at: string | null; created_at: string;
};
type Preview = {
  id: string; title: string; status: string; video_url: string | null;
  error_message: string | null; created_at: string; content: unknown;
};
type Payload = { templates: Template[]; versions: Version[]; previews: Preview[] };

const GENERAL_ASSETS = ["calm", "dawn", "emerald", "gold", "night", "paper", "rose"];
const KIDS_ASSETS = ["kids-garden", "kids-nature", "kids-neighborhood", "kids-workshop"];
const ASSET_LABELS: Record<string, string> = {
  calm: "هادئ", dawn: "الفجر", emerald: "زمردي", gold: "ذهبي",
  night: "ليلي", paper: "ورقي", rose: "وردي",
  "kids-garden": "حديقة الأطفال", "kids-nature": "طبيعة الأطفال",
  "kids-neighborhood": "حيّ الأطفال", "kids-workshop": "ورشة الأطفال",
};
const STATUS_LABELS: Record<string, string> = {
  draft: "مسودة", approved: "مراجع", active: "نشط", retired: "متوقف",
};
const STATUS_STYLES: Record<string, string> = {
  draft: "border-amber-400/30 text-amber-200",
  approved: "border-sky-400/30 text-sky-200",
  active: "border-emerald-400/30 text-emerald-200",
  retired: "border-zinc-500/30 text-zinc-400",
};

export default function TemplateStudioClient() {
  const [data, setData] = useState<Payload>({ templates: [], versions: [], previews: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [assetKey, setAssetKey] = useState("calm");
  const [defaultFormat, setDefaultFormat] = useState<"vertical" | "horizontal">("vertical");
  const [motion, setMotion] = useState<"slow" | "fade">("slow");
  const [fontPreset, setFontPreset] = useState<"auto" | "naskh" | "sans">("auto");
  const [palette, setPalette] = useState<"template" | "gold" | "emerald" | "monochrome">("template");
  const [safeArea, setSafeArea] = useState<"standard" | "wide">("standard");
  const [captionStyle, setCaptionStyle] = useState<"classic" | "minimal" | "boxed">("classic");
  const [sourceCardStyle, setSourceCardStyle] = useState<"standard" | "compact">("standard");
  const [audioPolicy, setAudioPolicy] = useState<"allow-tts" | "verified-audio-only">("allow-tts");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/video/templates", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "تعذر تحميل مكتبة القوالب.");
      const next = payload as Payload;
      setData({
        templates: Array.isArray(next.templates) ? next.templates : [],
        versions: Array.isArray(next.versions) ? next.versions : [],
        previews: Array.isArray(next.previews) ? next.previews : [],
      });
      setSelectedTemplateId((current) => current || next.templates?.[0]?.id || "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر الاتصال بمكتبة القوالب.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const selectedTemplate = useMemo(
    () => data.templates.find((item) => item.id === selectedTemplateId) ?? null,
    [data.templates, selectedTemplateId],
  );
  const availableAssets = useMemo(() => selectedTemplate?.audience === "kids" ? KIDS_ASSETS : GENERAL_ASSETS, [selectedTemplate?.audience]);
  const versionsByTemplate = useMemo(() => {
    const grouped = new Map<string, Version[]>();
    for (const version of data.versions) {
      const items = grouped.get(version.template_id) ?? [];
      items.push(version);
      grouped.set(version.template_id, items);
    }
    return grouped;
  }, [data.versions]);

  useEffect(() => {
    if (!selectedTemplate) return;
    const active = (versionsByTemplate.get(selectedTemplate.id) ?? []).find((version) => version.status === "active");
    const configAsset = active?.config?.assetKey;
    setAssetKey(configAsset && availableAssets.includes(configAsset) ? configAsset : selectedTemplate.asset_key);
    setDefaultFormat(active?.config?.defaultFormat === "horizontal" ? "horizontal" : "vertical");
    setMotion(active?.config?.motion === "fade" ? "fade" : "slow");
    setFontPreset(active?.config?.fontPreset === "naskh" || active?.config?.fontPreset === "sans" ? active.config.fontPreset : "auto");
    setPalette(active?.config?.palette === "gold" || active?.config?.palette === "emerald" || active?.config?.palette === "monochrome" ? active.config.palette : "template");
    setSafeArea(active?.config?.safeArea === "wide" ? "wide" : "standard");
    setCaptionStyle(active?.config?.captionStyle === "minimal" || active?.config?.captionStyle === "boxed" ? active.config.captionStyle : "classic");
    setSourceCardStyle(active?.config?.sourceCardStyle === "compact" ? "compact" : "standard");
    setAudioPolicy(active?.config?.audioPolicy === "verified-audio-only" ? "verified-audio-only" : "allow-tts");
  }, [selectedTemplate, versionsByTemplate, availableAssets]);

  const mutate = useCallback(async (action: string, values: Record<string, unknown> = {}) => {
    setBusy(action + ":" + String(values.versionId ?? ""));
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/video/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...values }),
      });
      const payload = await response.json().catch(() => ({}));
      if (payload.error === "step_up_required" && redirectToAdminStepUp(payload.nextPath)) return;
      if (!response.ok) throw new Error(payload.error || "تعذر تنفيذ العملية.");
      setMessage(
        action === "create-version" ? "تم إنشاء مسودة إصدار جديدة. اختبرها ثم اطلب مراجعتها من مسؤول آخر." :
        action === "approve-version" ? "تم تسجيل المراجعة." :
        action === "activate-version" ? "تم التفعيل أو الاسترجاع بنجاح." :
        "تم إنشاء طلب المعاينة الداخلي. لا يُرسل إلى منصات التواصل.",
      );
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تنفيذ العملية.");
    } finally {
      setBusy("");
    }
  }, [load]);

  const createVersion = () => {
    if (!selectedTemplate) return;
    void mutate("create-version", {
      templateId: selectedTemplate.id,
      config: { assetKey, defaultFormat, motion, fontPreset, palette, safeArea, captionStyle, sourceCardStyle, audioPolicy },
    });
  };

  const runPreview = (version: Version) => {
    void mutate("preview-version", { versionId: version.id });
  };

  const approve = (version: Version) => {
    void mutate("approve-version", { versionId: version.id });
  };

  const activate = (version: Version) => {
    void mutate("activate-version", { versionId: version.id });
  };

  return (
    <div className="space-y-8" dir="rtl">
      <header className="space-y-2">
        <p className="text-xs tracking-[0.2em] text-brand-cream/35">VIDEO FACTORY / VERSIONED TEMPLATE STUDIO</p>
        <h1 className="text-3xl font-bold text-brand-gold">استوديو قوالب الفيديو</h1>
        <p className="max-w-4xl text-sm leading-7 text-brand-cream/60">
          كل تعديل ينشئ إصدارًا جديدًا غير قابل للتعديل. المعاينة تُنفذ بمحرك الفيديو الفعلي وتُحفظ كطلب داخلي مع تعطيل النشر الاجتماعي، ولا يصبح الإصدار نشطًا إلا بعد مراجعة مسؤول آخر.
        </p>
      </header>

      {message && <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-200">{message}</p>}
      {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-200">{error}</p>}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.75fr)]">
        <div className="rounded-2xl border border-brand-gold/15 bg-black/15 p-5">
          <h2 className="text-lg font-bold text-brand-gold">إنشاء إصدار جديد</h2>
          <p className="mt-1 text-xs leading-6 text-brand-cream/45">الأصول محصورة في ملفات SVG الموجودة داخل المشروع؛ لا يقبل النظام مسارات ملفات خارج القائمة المسموح بها.</p>
          <div className="mt-4 space-y-4">
            <label className="block text-sm text-brand-cream/75">
              القالب
              <select value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)} className="mt-2 w-full rounded-xl border border-brand-gold/15 bg-black/30 p-3">
                {data.templates.map((template) => <option key={template.id} value={template.id}>{template.title} — {template.audience === "kids" ? "أطفال" : "عام"}</option>)}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-sm text-brand-cream/75">
                الأصل المرئي
                <select value={assetKey} onChange={(event) => setAssetKey(event.target.value)} className="mt-2 w-full rounded-xl border border-brand-gold/15 bg-black/30 p-3">
                  {availableAssets.map((asset) => <option key={asset} value={asset}>{ASSET_LABELS[asset] ?? asset}</option>)}
                </select>
              </label>
              <label className="block text-sm text-brand-cream/75">
                الاتجاه
                <select value={defaultFormat} onChange={(event) => setDefaultFormat(event.target.value as "vertical" | "horizontal")} className="mt-2 w-full rounded-xl border border-brand-gold/15 bg-black/30 p-3">
                  <option value="vertical">رأسي 9:16</option>
                  <option value="horizontal">أفقي 16:9</option>
                </select>
              </label>
              <label className="block text-sm text-brand-cream/75">
                الحركة
                <select value={motion} onChange={(event) => setMotion(event.target.value as "slow" | "fade")} className="mt-2 w-full rounded-xl border border-brand-gold/15 bg-black/30 p-3">
                  <option value="slow">حركة هادئة</option>
                  <option value="fade">تلاشي تدريجي</option>
                </select>
              </label>
            </div>
            <div className="space-y-3 rounded-xl border border-brand-gold/10 bg-black/15 p-3">
              <h3 className="text-sm font-semibold text-brand-gold">التحكم في الإخراج البصري</h3>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <label className="block text-sm text-brand-cream/75">
                  الخط العربي
                  <select value={fontPreset} onChange={(event) => setFontPreset(event.target.value as typeof fontPreset)} className="mt-2 w-full rounded-xl border border-brand-gold/15 bg-black/30 p-3">
                    <option value="auto">تلقائي حسب الجمهور</option>
                    <option value="naskh">نسخ واضح</option>
                    <option value="sans">Sans حديث</option>
                  </select>
                </label>
                <label className="block text-sm text-brand-cream/75">
                  لوحة الألوان
                  <select value={palette} onChange={(event) => setPalette(event.target.value as typeof palette)} className="mt-2 w-full rounded-xl border border-brand-gold/15 bg-black/30 p-3">
                    <option value="template">ألوان القالب الأساسية</option>
                    <option value="gold">ذهبي دافئ</option>
                    <option value="emerald">زمردي</option>
                    <option value="monochrome">أحادي هادئ</option>
                  </select>
                </label>
                <label className="block text-sm text-brand-cream/75">
                  المنطقة الآمنة
                  <select value={safeArea} onChange={(event) => setSafeArea(event.target.value as typeof safeArea)} className="mt-2 w-full rounded-xl border border-brand-gold/15 bg-black/30 p-3">
                    <option value="standard">قياسية</option>
                    <option value="wide">هوامش أوسع للنص والمنصات</option>
                  </select>
                </label>
                <label className="block text-sm text-brand-cream/75">
                  شكل الترجمة
                  <select value={captionStyle} onChange={(event) => setCaptionStyle(event.target.value as typeof captionStyle)} className="mt-2 w-full rounded-xl border border-brand-gold/15 bg-black/30 p-3">
                    <option value="classic">كلاسيكي بحد خفيف</option>
                    <option value="minimal">بسيط قليل الظل</option>
                    <option value="boxed">بطاقة خلفية للنص</option>
                  </select>
                </label>
                <label className="block text-sm text-brand-cream/75">
                  بطاقة المصدر
                  <select value={sourceCardStyle} onChange={(event) => setSourceCardStyle(event.target.value as typeof sourceCardStyle)} className="mt-2 w-full rounded-xl border border-brand-gold/15 bg-black/30 p-3">
                    <option value="standard">قياسية وواضحة</option>
                    <option value="compact">مختصرة لتوفير المساحة</option>
                  </select>
                </label>
                <label className="block text-sm text-brand-cream/75">
                  سياسة الصوت
                  <select value={audioPolicy} onChange={(event) => setAudioPolicy(event.target.value as typeof audioPolicy)} className="mt-2 w-full rounded-xl border border-brand-gold/15 bg-black/30 p-3">
                    <option value="allow-tts">السماح بالتعليق العربي عند غياب تسجيل المصدر</option>
                    <option value="verified-audio-only">صوت مصدر موثق أو تسجيل بشري فقط</option>
                  </select>
                </label>
              </div>
              <p className="text-xs leading-6 text-brand-cream/45">
                بطاقة المصدر لا يمكن إخفاؤها. وضع الصوت الموثق يمنع التعليق الصناعي في الإنتاج عند غياب تسجيل المصدر؛ المعاينة الداخلية تستخدم صوتًا تجريبيًا ولا تُنشر.
              </p>
            </div>
            <button type="button" onClick={createVersion} disabled={!selectedTemplate || Boolean(busy)} className="rounded-xl bg-brand-gold px-5 py-3 text-sm font-bold text-black disabled:opacity-50">
              {busy.startsWith("create-version:") ? "جارٍ إنشاء المسودة…" : "إنشاء مسودة إصدار"}
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-brand-gold/15 bg-black/15 p-5">
          <h2 className="text-lg font-bold text-brand-gold">قواعد الاعتماد</h2>
          <ol className="mt-3 list-decimal space-y-2 pr-5 text-sm leading-6 text-brand-cream/65">
            <li>أنشئ نسخة جديدة؛ النسخ السابقة لا تُعدَّل.</li>
            <li>ولّد معاينة من نفس محرك FFmpeg المستخدم في الإنتاج.</li>
            <li>راجع الصوت والنص والخلفية والمقاس.</li>
            <li>مسؤول آخر يعتمد الإصدار، ثم يتم تفعيله ذريًا.</li>
            <li>يمكن استرجاع نسخة سابقة دون تغيير إعداداتها.</li>
          </ol>
          <p className="mt-4 text-xs leading-6 text-brand-cream/40">المعاينات لا تُضاف إلى social_publish_queue، ويُمنع عامل الفيديو من إعادة مصالحتها كمنشورات.</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-brand-gold">كتالوج القوالب والإصدارات</h2>
          <button onClick={() => void load()} disabled={loading || Boolean(busy)} className="rounded-lg border border-brand-gold/20 px-3 py-2 text-xs text-brand-cream/70 disabled:opacity-40">تحديث القائمة</button>
        </div>
        {loading ? <p className="text-sm text-brand-cream/50">جارٍ تحميل القوالب…</p> : (
          <div className="grid gap-4 xl:grid-cols-2">
            {data.templates.map((template) => {
              const versions = versionsByTemplate.get(template.id) ?? [];
              const active = versions.find((version) => version.status === "active");
              const activeAsset = active?.config?.assetKey || template.asset_key;
              return (
                <article key={template.id} className="overflow-hidden rounded-2xl border border-brand-gold/15 bg-black/15">
                  <div className="grid gap-4 p-4 sm:grid-cols-[120px_1fr]">
                    <div className="relative aspect-[9/16] max-h-56 overflow-hidden rounded-xl bg-black/30">
                      <Image src={`/video/templates/${activeAsset}.svg`} alt={`معاينة ${template.title}`} fill unoptimized sizes="120px" className="object-contain" />
                    </div>
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-brand-gold">{template.title}</h3>
                        <span className="rounded-full border border-brand-gold/15 px-2 py-1 text-[10px] text-brand-cream/55">{template.audience === "kids" ? "أطفال" : "عام"}</span>
                      </div>
                      <p className="text-xs leading-6 text-brand-cream/45">{template.description}</p>
                      <p className="text-xs text-brand-cream/50">الإصدار النشط: {active ? `v${active.version}` : "لا يوجد"}</p>
                      <p className="text-xs text-brand-cream/50">الأصل: {ASSET_LABELS[activeAsset] ?? activeAsset}</p>
                      <button onClick={() => setSelectedTemplateId(template.id)} className="text-xs text-brand-gold underline">تعديل إصدار جديد لهذا القالب</button>
                    </div>
                  </div>
                  <div className="border-t border-brand-gold/10 p-4">
                    <h4 className="mb-3 text-sm font-semibold text-brand-cream/80">سجل النسخ ({versions.length})</h4>
                    <div className="space-y-3">
                      {versions.map((version) => (
                        <div key={version.id} className="rounded-xl border border-white/5 bg-black/20 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-semibold">الإصدار v{version.version}</span>
                            <span className={`rounded-full border px-2 py-1 text-[10px] ${STATUS_STYLES[version.status] ?? STATUS_STYLES.retired}`}>{STATUS_LABELS[version.status] ?? version.status}</span>
                          </div>
                          <p className="mt-1 text-[11px] text-brand-cream/40">{ASSET_LABELS[version.config?.assetKey ?? ""] ?? version.config?.assetKey} · {version.config?.defaultFormat === "horizontal" ? "أفقي" : "رأسي"} · {version.config?.motion === "fade" ? "تلاشي" : "حركة هادئة"}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button onClick={() => runPreview(version)} disabled={Boolean(busy)} className="rounded-lg border border-brand-gold/25 px-3 py-2 text-xs text-brand-gold disabled:opacity-40">معاينة داخلية</button>
                            {version.status === "draft" && <button onClick={() => approve(version)} disabled={Boolean(busy)} className="rounded-lg border border-sky-400/25 px-3 py-2 text-xs text-sky-200 disabled:opacity-40">اعتماد المراجعة</button>}
                            {(version.status === "approved" || version.status === "retired") && (
                              <button onClick={() => activate(version)} disabled={Boolean(busy)} className="rounded-lg border border-emerald-400/25 px-3 py-2 text-xs text-emerald-200 disabled:opacity-40">{version.status === "retired" ? "استرجاع الإصدار" : "تفعيل الإصدار"}</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-gold">معاينات الرندر الأخيرة</h2>
        {data.previews.length === 0 ? <p className="text-sm text-brand-cream/45">لا توجد معاينات محفوظة بعد.</p> : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.previews.map((preview) => (
              <article key={preview.id} className="space-y-2 rounded-2xl border border-brand-gold/15 bg-black/15 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-brand-cream">{preview.title}</h3>
                  <span className="text-xs text-brand-cream/50">{preview.status}</span>
                </div>
                {preview.video_url ? (
                  <video className="w-full rounded-xl bg-black" controls playsInline preload="metadata" src={preview.video_url} />
                ) : <p className="text-xs text-brand-cream/45">{preview.error_message || "المعاينة قيد التجهيز. حدّث القائمة لاحقًا."}</p>}
                <p className="text-[10px] text-brand-cream/30" dir="ltr">{preview.id}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
