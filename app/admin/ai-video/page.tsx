"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Category = "quran" | "hadith" | "story" | "dua" | "adhkar" | "other";
type Format = "horizontal" | "vertical";

const PRESETS: Array<{
  id: string;
  label: string;
  title: string;
  description: string;
  category: Category;
  format: Format;
  narration: string;
}> = [
  {
    id: "documentary",
    label: "وثائقي إسلامي",
    title: "قصة من القرآن الكريم",
    description: "فيديو وثائقي قصير يقدّم القصة بأسلوب هادئ وواضح.",
    category: "quran",
    format: "horizontal",
    narration:
      "في هذا الفيديو نستعرض قصة قرآنية مختارة بصورة موثقة، مع نص واضح ومراجَع قبل التوليد والنشر.",
  },
  {
    id: "short",
    label: "Short / Reel",
    title: "رسالة إيمانية قصيرة",
    description: "فيديو عمودي مناسب لـYouTube Shorts وFacebook Reels.",
    category: "other",
    format: "vertical",
    narration:
      "رسالة إيمانية قصيرة تبدأ بفكرة واضحة، ثم تقدم الفائدة الأساسية بلغة عربية سهلة ومباشرة.",
  },
  {
    id: "adhkar",
    label: "أذكار",
    title: "أذكار الصباح",
    description: "فيديو أذكار قابل للتحويل إلى نسخة أفقية أو عمودية.",
    category: "adhkar",
    format: "vertical",
    narration:
      "في هذا الفيديو نقدم أذكار الصباح بصياغة مرتبة، مع التأكيد على مراجعة النص والمصدر قبل النشر.",
  },
];

export default function AdminAiVideoPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("story");
  const [format, setFormat] = useState<Format>("horizontal");
  const [narration, setNarration] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const narrationLength = useMemo(() => narration.trim().length, [narration]);

  function applyPreset(id: string) {
    const preset = PRESETS.find(item => item.id === id);
    if (!preset) return;
    setTitle(preset.title);
    setDescription(preset.description);
    setCategory(preset.category);
    setFormat(preset.format);
    setNarration(preset.narration);
    setError(null);
    setMessage(`تم تحميل قالب: ${preset.label}`);
  }

  async function createRequest() {
    setError(null);
    setMessage(null);

    if (title.trim().length < 3) {
      setError("اكتب عنوانًا واضحًا للفيديو.");
      return;
    }
    if (description.trim().length < 5) {
      setError("اكتب وصفًا للفيديو.");
      return;
    }
    if (narrationLength < 30) {
      setError("النص الصوتي المراجع يجب أن يحتوي على 30 حرفًا على الأقل.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/videos/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          narration: narration.trim(),
          content: { videoFormat: format, workflow: "ai-video-studio" },
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "تعذر إنشاء طلب الفيديو.");
        return;
      }
      setMessage("تم إنشاء طلب الفيديو ووضعه في الطابور. سيتم توليده بواسطة الـworker.");
      setTitle("");
      setDescription("");
      setCategory("story");
      setFormat("horizontal");
      setNarration("");
    } catch {
      setError("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="py-10 space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-brand-cream/40">ZIKR AI VIDEO STUDIO</p>
          <h1 className="mt-2 text-4xl font-bold text-brand-gold">استوديو إنتاج الفيديو بالذكاء الاصطناعي</h1>
          <p className="mt-2 max-w-3xl text-brand-cream/65">
            أنشئ الطلب، راجع النص، اختر المقاس، ثم اترك الـworker يتولى التوليد والمراحل التالية بشكل آمن.
          </p>
        </div>
        <Link href="/admin/videos" className="text-sm text-brand-gold underline-offset-4 hover:underline">
          إدارة طابور الفيديوهات
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PRESETS.map(preset => (
          <Card key={preset.id} className="p-5 border-brand-gold/15">
            <div className="text-lg font-bold text-brand-gold">{preset.label}</div>
            <p className="mt-2 text-sm text-brand-cream/55">{preset.description}</p>
            <Button className="mt-4 w-full" variant="outline" onClick={() => applyPreset(preset.id)}>
              استخدام القالب
            </Button>
          </Card>
        ))}
      </div>

      <Card className="p-6 space-y-5 border-brand-gold/20">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-brand-cream/70">عنوان الفيديو</label>
            <Input value={title} onChange={event => setTitle(event.target.value)} placeholder="مثال: قصة سيدنا يوسف" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-brand-cream/70">التصنيف</label>
            <select
              value={category}
              onChange={event => setCategory(event.target.value as Category)}
              className="w-full rounded-lg border border-brand-gold/20 bg-black/20 px-4 py-2 text-brand-cream"
            >
              <option value="quran">القرآن</option>
              <option value="hadith">الحديث</option>
              <option value="story">القصة</option>
              <option value="dua">الدعاء</option>
              <option value="adhkar">الأذكار</option>
              <option value="other">أخرى</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-brand-cream/70">الوصف</label>
            <Input value={description} onChange={event => setDescription(event.target.value)} placeholder="وصف الفيديو وما سيقدمه للمشاهد" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-brand-cream/70">المقاس</label>
            <select
              value={format}
              onChange={event => setFormat(event.target.value as Format)}
              className="w-full rounded-lg border border-brand-gold/20 bg-black/20 px-4 py-2 text-brand-cream"
            >
              <option value="horizontal">16:9 — YouTube</option>
              <option value="vertical">9:16 — Shorts / Reels</option>
            </select>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-sm text-brand-cream/70">النص المراجع الذي سيُحوّل إلى فيديو</label>
            <span className={`text-xs ${narrationLength >= 30 ? "text-emerald-300" : "text-brand-cream/40"}`}>
              {narrationLength} / 30
            </span>
          </div>
          <textarea
            value={narration}
            onChange={event => setNarration(event.target.value)}
            rows={10}
            className="w-full rounded-xl border border-brand-gold/20 bg-black/20 px-4 py-3 text-brand-cream outline-none focus:border-brand-gold/50"
            placeholder="اكتب النص الذي تم مراجعته واعتماده قبل التوليد..."
          />
        </div>

        {error && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>}
        {message && <div className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{message}</div>}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="primary" className="flex-1" onClick={createRequest} disabled={loading}>
            {loading ? "جاري إنشاء الطلب..." : "إرسال إلى طابور التوليد"}
          </Button>
          <Link href="/admin/social" className="inline-flex items-center justify-center rounded-lg border border-brand-gold/20 px-5 py-2 text-sm text-brand-gold hover:bg-brand-gold/10">
            مركز النشر الاجتماعي
          </Link>
        </div>
      </Card>

      <Card className="p-5 border-brand-gold/10 bg-black/10">
        <h2 className="text-lg font-bold text-brand-gold">مسار التنفيذ</h2>
        <p className="mt-2 text-sm leading-7 text-brand-cream/55">
          الطلب ينتقل من pending إلى processing، ثم يتم إرسال مهمة HeyGen ومتابعتها بالمعرّف المحفوظ. لا تتم إعادة إنشاء مهمة المزود عند إعادة المحاولة؛ وبعد اكتمال الفيديو تبدأ طبقة النشر والتحقق.
        </p>
      </Card>
    </Container>
  );
}
