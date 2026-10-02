"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Category = "quran" | "hadith" | "story" | "dua" | "adhkar" | "other";
type Format = "horizontal" | "vertical";
type Source = {
  id: string;
  category: Category;
  title: string;
  text: string;
  sourceLabel: string;
  sourceUrl: string;
  grade?: string | null;
};

const CATEGORIES: Array<{ id: Category; title: string; description: string }> =
  [
    {
      id: "quran",
      title: "القرآن الكريم",
      description: "آية بالنص العثماني وتلاوتها من سجل المصحف.",
    },
    {
      id: "hadith",
      title: "الحديث الشريف",
      description: "حديث منشور مع مرجعه ودرجته المسجلة.",
    },
    {
      id: "dua",
      title: "الدعاء",
      description: "دعاء منشور بمصدره من مكتبة ذِكر.",
    },
    {
      id: "adhkar",
      title: "الأذكار",
      description: "ذكر مأثور من أحاديث منشورة ذات درجة مسجلة.",
    },
    {
      id: "story",
      title: "قصص موثقة",
      description: "ملخص قصير منشور وله مصادر مذكورة.",
    },
    {
      id: "other",
      title: "رسالة عامة",
      description: "نص توعوي غير منسوب إلى القرآن أو الحديث.",
    },
  ];

const IS_SOURCE_LOCKED = (category: Category) => category !== "other";
const AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/webm",
];
const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

export default function AdminAiVideoPage() {
  const [category, setCategory] = useState<Category>("story");
  const [format, setFormat] = useState<Format>("vertical");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [narration, setNarration] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [surahId, setSurahId] = useState("1");
  const [ayahNumber, setAyahNumber] = useState("1");
  const [sourceLoading, setSourceLoading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLocked = IS_SOURCE_LOCKED(category);
  const narrationLength = useMemo(() => narration.trim().length, [narration]);

  const selectSource = useCallback((source: Source) => {
    setSourceId(source.id);
    setTitle(source.title);
    setDescription(source.sourceLabel);
    setNarration(source.text);
    setError(null);
    setMessage(`تم تحميل نص المصدر: ${source.title}`);
  }, []);

  useEffect(() => {
    setSourceId("");
    setSources([]);
    setNarration("");
    setTitle("");
    setDescription("");
    setMessage(null);
    setError(null);
    if (category === "quran" || category === "other") return;

    const controller = new AbortController();
    setSourcesLoading(true);
    void fetch(`/api/admin/video-generation/sources?category=${category}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "تعذر تحميل المصادر.");
        setSources(Array.isArray(data.sources) ? data.sources : []);
      })
      .catch(cause => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error ? cause.message : "تعذر تحميل المصادر."
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setSourcesLoading(false);
      });
    return () => controller.abort();
  }, [category]);

  async function loadQuranSource() {
    setError(null);
    setMessage(null);
    setSourceLoading(true);
    try {
      const query = new URLSearchParams({
        category: "quran",
        surahId,
        ayahNumber,
      });
      const response = await fetch(
        `/api/admin/video-generation/sources?${query}`,
        { cache: "no-store" }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "تعذر العثور على الآية.");
      selectSource(data.source as Source);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "تعذر تحميل الآية من المصدر."
      );
    } finally {
      setSourceLoading(false);
    }
  }

  function chooseAudio(file: File | null) {
    setError(null);
    setUploadedAudioUrl("");
    if (!file) {
      setAudioFile(null);
      return;
    }
    if (!AUDIO_TYPES.includes(file.type)) {
      setError("اختر تسجيلًا بصيغة MP3 أو M4A أو WAV أو OGG أو WebM.");
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      setError("حجم التسجيل يجب ألا يتجاوز 15 ميغابايت.");
      return;
    }
    setAudioFile(file);
  }

  async function uploadHumanAudio() {
    if (!audioFile) return "";
    if (uploadedAudioUrl) return uploadedAudioUrl;
    const response = await fetch(
      "/api/admin/video-generation/narration-upload",
      {
        method: "POST",
        headers: { "Content-Type": audioFile.type },
        body: audioFile,
      }
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || typeof payload.audioUrl !== "string") {
      throw new Error(payload.error || "تعذر رفع التسجيل الصوتي.");
    }
    setUploadedAudioUrl(payload.audioUrl);
    return payload.audioUrl as string;
  }

  async function createRequest() {
    setError(null);
    setMessage(null);
    if (title.trim().length < 3)
      return setError("اكتب عنوانًا واضحًا للفيديو.");
    if (description.trim().length < 5)
      return setError("أضف وصفًا موجزًا للفيديو.");
    if (isLocked && !sourceId)
      return setError(
        category === "quran"
          ? "حمّل آية من المصحف أولًا."
          : "اختر نصًا منشورًا من قائمة المصادر أولًا."
      );
    if (!isLocked && narrationLength < 30)
      return setError("اكتب رسالة عامة لا تقل عن 30 حرفًا.");
    if (category === "quran" && audioFile)
      return setError("لا يمكن استبدال تلاوة الآية بتسجيل صوتي غير مرتبط بها.");

    setLoading(true);
    try {
      const humanAudioUrl = audioFile ? await uploadHumanAudio() : "";
      const response = await fetch("/api/admin/videos/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          sourceId: isLocked ? sourceId : undefined,
          narration: isLocked
            ? undefined
            : narration.trim().replace(/\s+/g, " "),
          humanAudioUrl: humanAudioUrl || undefined,
          content: {
            renderer: "template",
            workflow: "ai-video-studio",
            videoFormat: format,
            language: "ar",
            resolution: format === "vertical" ? "1080x1920" : "1920x1080",
          },
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(payload.error || "تعذر إنشاء طلب الفيديو.");
      setMessage(
        humanAudioUrl
          ? "تم حفظ الطلب بالتسجيل البشري الذي رفعته. سيفحص العامل صلاحية الصوت والفيديو قبل اعتماد الناتج."
          : category === "quran"
            ? "تم حفظ الطلب بنص الآية وتلاوتها من المصدر."
            : "تم حفظ الطلب. سيُستخدم صوت عربي إلكتروني طبيعي ما لم ترفع تسجيلًا بشريًا."
      );
      setTitle("");
      setDescription("");
      setNarration("");
      setSourceId("");
      setAudioFile(null);
      setUploadedAudioUrl("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "تعذر الاتصال بالخادم. حاول مرة أخرى."
      );
    } finally {
      setLoading(false);
    }
  }

  async function createVerifiedBatch() {
    setError(null);
    setMessage(null);
    setBatchLoading(true);
    const plans: Array<{ category: Category; title: string; description: string; sourceId?: string; narration?: string }> = [
      { category: "quran", title: "تدبر سورة الفاتحة: خريطة العبودية والهداية", description: "إنتاج تعليمي من نص المصحف ومصدر التفسير المرفق.", sourceId: "quran:1:1" },
      { category: "quran", title: "سورة العصر: رأس مال الوقت والعمل الصالح", description: "إنتاج تعليمي من نص المصحف ومصدر التفسير المرفق.", sourceId: "quran:103:1" },
      { category: "other", title: "رسالة عامة: تثبت قبل أن تشارك", description: "رسالة توعوية أصلية عن التثبت قبل نشر المحتوى الديني.", narration: "قبل أن تشارك أي نص ديني، اسأل عن مصدره ونصه الكامل وسياقه. الشهرة لا تساوي الصحة، والصورة الجميلة لا تثبت نسبة الكلام إلى عالم. إذا وجدت خطأً بعد النشر فصححه بوضوح، واجعل التثبت عادة تحمي القارئ وتحفظ قيمة الكلمة." },
      { category: "other", title: "رسالة عامة: اجعل التقنية خادمة للعبادة", description: "رسالة توعوية أصلية عن الاستخدام الهادئ للتقنية.", narration: "اجعل التقنية خادمة للعبادة لا بديلًا عنها. اختر وردًا واحدًا، قلل الإشعارات، واقرأ النص كاملًا قبل تشغيل العداد. الأرقام تساعد على التذكير لكنها لا تقيس الخشوع، والمحتوى التعليمي لا يغني عن سؤال أهل العلم في المسائل الخاصة." },
    ];
    try {
      for (const category of ["hadith", "story", "dua", "adhkar"] as const) {
        const response = await fetch(`/api/admin/video-generation/sources?category=${category}`, { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        const firstTwo = Array.isArray(data.sources) ? data.sources.slice(0, 2) as Source[] : [];
        for (const source of firstTwo) plans.push({ category, title: source.title, description: source.sourceLabel, sourceId: source.id });
      }
      let created = 0;
      for (const plan of plans) {
        const response = await fetch("/api/admin/videos/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
          title: plan.title, description: plan.description, category: plan.category, sourceId: plan.sourceId, narration: plan.narration,
          content: { renderer: "template", workflow: "verified-batch", videoFormat: "vertical", language: "ar", resolution: "1080x1920" },
        }) });
        if (response.ok) created += 1;
      }
      setMessage(`تم إنشاء ${created} طلبًا موثقًا من الأقسام المتاحة. افتح طابور الفيديوهات لمتابعة الرندر.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر إنشاء دفعة الفيديوهات.");
    } finally {
      setBatchLoading(false);
    }
  }

  return (
    <Container className="space-y-8 py-10 text-right" dir="rtl">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-brand-cream/40">
            ZIKR VIDEO STUDIO
          </p>
          <h1 className="mt-2 text-3xl font-bold text-brand-gold md:text-4xl">
            استوديو إنتاج الفيديو
          </h1>
          <p className="mt-2 max-w-3xl leading-7 text-brand-cream/65">
            اختر مصدرًا منشورًا للنصوص الدينية؛ لا يكتب الذكاء الاصطناعي آية أو
            حديثًا من تلقاء نفسه. يمكن إرفاق تسجيل بشري حقيقي بدل الصوت
            الإلكتروني.
          </p>
        </div>
        <Link
          href="/admin/videos"
          className="text-sm text-brand-gold underline-offset-4 hover:underline"
        >
          متابعة طابور الفيديوهات
        </Link>
      </header>

      <section
        aria-label="نوع المحتوى"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {CATEGORIES.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCategory(item.id)}
            aria-pressed={category === item.id}
            className={`rounded-2xl border p-4 text-right transition ${category === item.id ? "border-brand-gold/45 bg-brand-gold/10" : "border-brand-gold/10 bg-black/15 hover:border-brand-gold/25"}`}
          >
            <span className="font-bold text-brand-gold">{item.title}</span>
            <span className="mt-1 block text-sm leading-6 text-brand-cream/55">
              {item.description}
            </span>
          </button>
        ))}
      </section>

      <Card className="space-y-5 border-brand-gold/20 p-6">
        {category === "quran" ? (
          <div className="rounded-xl border border-brand-gold/15 bg-black/15 p-4">
            <p className="font-semibold text-brand-gold">
              تحديد آية من قاعدة المصحف
            </p>
            <p className="mt-1 text-sm leading-6 text-brand-cream/55">
              سيُحمّل النص العثماني والتلاوة المرتبطة به من مصدر المشروع؛ لا
              يمكن تعديل نص الآية يدويًا.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <label className="text-sm text-brand-cream/70">
                رقم السورة
                <Input
                  inputMode="numeric"
                  min={1}
                  max={114}
                  value={surahId}
                  onChange={event => setSurahId(event.target.value)}
                  className="mt-2"
                />
              </label>
              <label className="text-sm text-brand-cream/70">
                رقم الآية
                <Input
                  inputMode="numeric"
                  min={1}
                  value={ayahNumber}
                  onChange={event => setAyahNumber(event.target.value)}
                  className="mt-2"
                />
              </label>
              <Button
                variant="outline"
                className="self-end"
                onClick={() => void loadQuranSource()}
                disabled={sourceLoading}
              >
                {sourceLoading ? "جارٍ التحميل…" : "تحميل من المصحف"}
              </Button>
            </div>
          </div>
        ) : category !== "other" ? (
          <div>
            <label
              htmlFor="source-select"
              className="mb-2 block text-sm text-brand-cream/70"
            >
              اختر محتوى منشورًا ذا مصدر
            </label>
            <select
              id="source-select"
              value={sourceId}
              onChange={event => {
                const source = sources.find(
                  item => item.id === event.target.value
                );
                if (source) selectSource(source);
                else {
                  setSourceId("");
                  setNarration("");
                }
              }}
              disabled={sourcesLoading || sources.length === 0}
              className="w-full rounded-lg border border-brand-gold/20 bg-black/30 px-4 py-3 text-brand-cream disabled:opacity-50"
            >
              <option value="">
                {sourcesLoading
                  ? "جارٍ تحميل المصادر المنشورة…"
                  : sources.length
                    ? "اختر مصدرًا"
                    : "لا توجد مصادر منشورة مطابقة حاليًا"}
              </option>
              {sources.map(source => (
                <option key={source.id} value={source.id}>
                  {source.title} — {source.sourceLabel}
                  {source.grade ? ` (${source.grade})` : ""}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-6 text-brand-cream/45">
              النص المعروض للقراءة فقط؛ لا تُقبل صياغة يدوية بديلة للنص المنسوب
              إلى مصدر ديني.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-sky-500/15 bg-sky-500/5 p-4 text-sm leading-7 text-sky-100/80">
            هذا المسار للرسائل العامة فقط، وليس لإضافة آيات أو أحاديث أو أذكار
            من دون مصدر. لا يضيف النظام اقتباسًا دينيًا من تلقاء نفسه.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label
              className="mb-2 block text-sm text-brand-cream/70"
              htmlFor="video-title"
            >
              عنوان الفيديو
            </label>
            <Input
              id="video-title"
              value={title}
              onChange={event => setTitle(event.target.value)}
              maxLength={180}
              placeholder="عنوان واضح وجذاب من دون وعود مضللة"
            />
          </div>
          <div>
            <label
              className="mb-2 block text-sm text-brand-cream/70"
              htmlFor="video-description"
            >
              الوصف والمصدر
            </label>
            <Input
              id="video-description"
              value={description}
              onChange={event => setDescription(event.target.value)}
              maxLength={1000}
              placeholder="ملخص قصير أو مرجع المصدر"
            />
          </div>
          <div>
            <label
              className="mb-2 block text-sm text-brand-cream/70"
              htmlFor="video-format"
            >
              مقاس الفيديو
            </label>
            <select
              id="video-format"
              value={format}
              onChange={event => setFormat(event.target.value as Format)}
              className="w-full rounded-lg border border-brand-gold/20 bg-black/30 px-4 py-3 text-brand-cream"
            >
              <option value="vertical">9:16 — Shorts / Reels</option>
              <option value="horizontal">16:9 — YouTube</option>
            </select>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              className="block text-sm text-brand-cream/70"
              htmlFor="narration"
            >
              {isLocked
                ? "النص الأصلي من المصدر (للقراءة فقط)"
                : "نص الرسالة العامة"}
            </label>
            <span className="text-xs text-brand-cream/45">
              {narrationLength} حرفًا
            </span>
          </div>
          <textarea
            id="narration"
            value={narration}
            onChange={event => setNarration(event.target.value)}
            readOnly={isLocked}
            rows={8}
            maxLength={8000}
            className="w-full rounded-xl border border-brand-gold/20 bg-black/20 px-4 py-3 leading-8 text-brand-cream outline-none focus:border-brand-gold/50 read-only:opacity-90"
            placeholder={
              isLocked
                ? "اختر مصدرًا منشورًا ليظهر النص هنا…"
                : "اكتب رسالة عامة أصيلة؛ لا تنسبها إلى القرآن أو الحديث."
            }
          />
          {sourceId && isLocked && (
            <a
              href={
                sources.find(source => source.id === sourceId)?.sourceUrl ||
                (category === "quran"
                  ? `https://quran.com/${surahId}/${ayahNumber}`
                  : "#")
              }
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-xs text-brand-gold hover:underline"
            >
              فتح مرجع المحتوى
            </a>
          )}
        </div>

        {category !== "quran" && (
          <div className="rounded-xl border border-brand-gold/15 bg-black/10 p-4">
            <label
              className="block text-sm font-semibold text-brand-cream/80"
              htmlFor="human-audio"
            >
              صوت بشري اختياري
            </label>
            <p className="mt-1 text-xs leading-6 text-brand-cream/50">
              ارفع تسجيلًا بشريًا حقيقيًا لقراءة النص أعلاه
              (MP3/M4A/WAV/OGG/WebM، حتى 15 MB). من دون تسجيل، سيستخدم العامل
              صوتًا عربيًا إلكترونيًا طبيعيًا — وليس صوت إنسان.
            </p>
            <input
              id="human-audio"
              type="file"
              accept="audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/wav,audio/x-wav,audio/ogg,audio/webm"
              onChange={event => chooseAudio(event.target.files?.[0] ?? null)}
              className="mt-3 block w-full text-sm text-brand-cream file:ml-3 file:rounded-lg file:border file:border-brand-gold/20 file:bg-brand-gold/10 file:px-4 file:py-2 file:text-brand-gold"
            />
            {audioFile && (
              <p className="mt-2 text-xs text-emerald-200">
                التسجيل المختار: {audioFile.name}
                {uploadedAudioUrl ? " — تم رفعه" : ""}
              </p>
            )}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100"
          >
            {error}
          </div>
        )}
        {message && (
          <div
            role="status"
            className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
          >
            {message}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => void createRequest()}
            disabled={loading || sourceLoading || sourcesLoading}
          >
            {loading
              ? "جارٍ رفع التسجيل وإنشاء الطلب…"
              : "إرسال إلى طابور التوليد"}
          </Button>
          <Link
            href="/admin/social"
            className="inline-flex items-center justify-center rounded-lg border border-brand-gold/20 px-5 py-2 text-sm text-brand-gold hover:bg-brand-gold/10"
          >
            مركز النشر الاجتماعي
          </Link>
        </div>
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-bold text-emerald-200">إنتاج دفعة موثقة من كل الأقسام</h2>
              <p className="mt-1 text-sm leading-6 text-brand-cream/55">ينشئ النظام فيديوهين من القرآن، والحديث، والقصص، والدعاء، والأذكار، ورسالتين عامتين، مع إعادة التحقق من المصدر قبل الحفظ.</p>
            </div>
            <Button variant="outline" onClick={() => void createVerifiedBatch()} disabled={batchLoading || loading}>
              {batchLoading ? "جارٍ إنشاء الدفعة…" : "إنشاء دفعة موثقة"}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-brand-gold/10 bg-black/10 p-5">
        <h2 className="text-lg font-bold text-brand-gold">ضمانات المسار</h2>
        <ul className="mt-2 list-disc space-y-1 pr-5 text-sm leading-7 text-brand-cream/55">
          <li>
            مصادر القرآن والحديث والدعاء والقصص تُعاد قراءتها من قاعدة البيانات
            عند الطلب وعند الرندر؛ أي اختلاف في النص يوقف الفيديو.
          </li>
          <li>
            يُفحص ملف الفيديو للتأكد من وجود صورة وصوت، ودقة الأبعاد، وترميز
            MP4، ومستوى صوت غير صامت قبل تسجيل النجاح.
          </li>
          <li>
            التسجيل الذي ترفعه يُستخدم كما هو بعد فحصه تقنيًا؛ جودة الإلقاء
            ومطابقة الصوت للنص تحتاج مراجعة بشرية قبل النشر.
          </li>
          <li>
            لا يمكن ضمان عدد المشاهدات أو الانتشار؛ تُستخدم أبعاد Shorts/Reels
            ولقطات نصية متحركة، وتظل مراجعة العنوان والصورة المصغرة والنشر
            ضرورية.
          </li>
        </ul>
      </Card>
    </Container>
  );
}
