"use client";

import { useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Job = {
  id: string;
  source_video_id: string;
  title: string;
  status: string;
  source_media_url: string | null;
  source_media_path: string | null;
  facebook_post_id: string | null;
};

type UploadResult = {
  name: string;
  sourceVideoId: string;
  ok: boolean;
  message: string;
};

const ALLOWED = new Set(["video/mp4", "video/quicktime", "video/x-m4v", "video/webm"]);
const MAX_BYTES = 50 * 1024 * 1024;

function extractYoutubeId(name: string) {
  const matches = name.match(/(?:^|[^A-Za-z0-9_-])([A-Za-z0-9_-]{11})(?:[^A-Za-z0-9_-]|$)/g);
  if (!matches?.length) return null;
  const candidate = matches[0].replace(/[^A-Za-z0-9_-]/g, "");
  return /^[A-Za-z0-9_-]{11}$/.test(candidate) ? candidate : null;
}

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleScore(filename: string, title: string) {
  const stem = normalize(filename.replace(/\.[^/.]+$/, ""));
  const target = normalize(title);
  if (!stem || !target) return 0;
  if (stem === target) return 1;
  const tokens = [...new Set(target.split(" ").filter((x) => x.length > 2))];
  if (!tokens.length) return 0;
  const matched = tokens.filter((token) => stem.includes(token)).length;
  return matched / tokens.length;
}

export default function YoutubeMediaImporter({ initialJobs }: { initialJobs: Job[] }) {
  const supabase = createClient();
  const [jobs, setJobs] = useState(initialJobs);
  const [uploads, setUploads] = useState<UploadResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const singleInputRef = useRef<HTMLInputElement | null>(null);

  const waiting = useMemo(
    () => jobs.filter((job) => job.status !== "published" && !job.facebook_post_id),
    [jobs],
  );

  const refresh = async () => {
    const { data, error: queryError } = await supabase
      .from("social_sync_jobs")
      .select("id,source_video_id,title,status,source_media_url,source_media_path,facebook_post_id")
      .order("source_published_at", { ascending: true, nullsFirst: false });
    if (!queryError && data) setJobs(data as Job[]);
  };

  const uploadForJob = async (job: Job, file: File) => {
    setError(null);
    if (!ALLOWED.has(file.type)) throw new Error("صيغة الملف غير مدعومة. استخدم MP4 أو MOV أو M4V أو WebM.");
    if (file.size > MAX_BYTES) throw new Error("حجم الملف أكبر من 50 MB، وهذا هو حد Supabase Free الحالي.");

    const urlResponse = await fetch("/api/admin/youtube-facebook/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        size: file.size,
        youtubeVideoId: job.source_video_id,
      }),
    });
    const urlBody = await urlResponse.json();
    if (!urlResponse.ok) throw new Error(urlBody.error || "تعذر تجهيز الرفع.");

    const { error: uploadError } = await supabase.storage
      .from(urlBody.bucket)
      .uploadToSignedUrl(urlBody.path, urlBody.token, file, { contentType: file.type });
    if (uploadError) throw new Error(uploadError.message);

    const registerResponse = await fetch("/api/admin/youtube-facebook/register-media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceVideoId: job.source_video_id,
        path: urlBody.path,
        publicUrl: urlBody.publicUrl,
        filename: urlBody.path.split("/").pop(),
        mimeType: file.type,
        size: file.size,
        matchMethod: "manual-row-upload",
        matchScore: 1,
      }),
    });
    const registerBody = await registerResponse.json();
    if (!registerResponse.ok) throw new Error(registerBody.error || "تم رفع الملف لكن تعذر ربطه بالفيديو.");
  };

  const handleSingle = async (file: File) => {
    if (!selectedJob) throw new Error("اختر فيديو YouTube أولًا.");
    setBusy(true);
    try {
      await uploadForJob(selectedJob, file);
      setUploads((current) => [{ name: file.name, sourceVideoId: selectedJob.source_video_id, ok: true, message: "تم الرفع والربط وإضافته إلى Queue." }, ...current]);
      await refresh();
      setSelectedJob(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setUploads((current) => [{ name: file.name, sourceVideoId: selectedJob.source_video_id, ok: false, message }, ...current]);
      setError(message);
    } finally {
      setBusy(false);
      if (singleInputRef.current) singleInputRef.current.value = "";
    }
  };

  const handleBulk = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    setBusy(true);
    const results: UploadResult[] = [];

    try {
      for (const file of Array.from(files)) {
        const sourceVideoId = extractYoutubeId(file.name);
        if (!sourceVideoId) {
          const ranked = waiting
            .map((job) => ({ job, score: titleScore(file.name, job.title) }))
            .sort((a, b) => b.score - a.score);
          const best = ranked[0];
          if (!best || best.score < 0.8) {
            results.push({ name: file.name, sourceVideoId: "—", ok: false, message: "لم يمكن تحديد فيديو YouTube بأمان. أعد تسمية الملف ليحتوي Video ID من YouTube أو استخدم الرفع اليدوي." });
            continue;
          }
          await uploadForJob(best.job, file);
          results.push({ name: file.name, sourceVideoId: best.job.source_video_id, ok: true, message: `تمت المطابقة تلقائيًا (${Math.round(best.score * 100)}%).` });
          continue;
        }

        const job = waiting.find((item) => item.source_video_id === sourceVideoId);
        if (!job) {
          results.push({ name: file.name, sourceVideoId, ok: false, message: "Video ID غير موجود في Queue أو تم نشره بالفعل." });
          continue;
        }
        await uploadForJob(job, file);
        results.push({ name: file.name, sourceVideoId, ok: true, message: "تم الرفع والربط وإضافته إلى Queue." });
      }
      setUploads((current) => [...results.reverse(), ...current]);
      await refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-brand-gold/15 bg-black/10 p-4">
          <div className="text-sm text-brand-cream/55">بحاجة إلى ملف</div>
          <div className="mt-1 text-3xl font-bold text-brand-gold">{waiting.length}</div>
        </div>
        <div className="rounded-xl border border-brand-gold/15 bg-black/10 p-4">
          <div className="text-sm text-brand-cream/55">تم ربطه بملف</div>
          <div className="mt-1 text-3xl font-bold text-emerald-300">{jobs.filter((j) => !!j.source_media_url && !j.facebook_post_id).length}</div>
        </div>
        <div className="rounded-xl border border-brand-gold/15 bg-black/10 p-4">
          <div className="text-sm text-brand-cream/55">منشور على Facebook</div>
          <div className="mt-1 text-3xl font-bold text-sky-300">{jobs.filter((j) => !!j.facebook_post_id || j.status === "published").length}</div>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-gold/20 bg-brand-night/40 p-5 space-y-3">
        <h2 className="text-xl font-bold text-brand-gold">رفع دفعة واحدة</h2>
        <p className="text-sm text-brand-cream/60">
          الأفضل تسمية كل ملف بحيث يحتوي على <code className="text-brand-gold">YouTube Video ID</code> (11 حرفًا)، مثل <code className="text-brand-gold">dQw4w9WgXcQ.mp4</code>. سيتم الربط تلقائيًا.
        </p>
        <label className="inline-flex cursor-pointer rounded-lg bg-brand-gold px-4 py-2 font-semibold text-black transition hover:opacity-90">
          {busy ? "جارٍ الرفع…" : "اختيار ملفات الفيديو"}
          <input
            type="file"
            className="hidden"
            multiple
            accept="video/mp4,video/quicktime,video/x-m4v,video/webm"
            disabled={busy}
            onChange={(event) => void handleBulk(event.target.files)}
          />
        </label>
        <p className="text-xs text-brand-cream/45">حد الملف في Supabase Free هو 50 MB. الملفات الأكبر ستُرفض.</p>
      </section>

      <section className="rounded-2xl border border-brand-gold/20 bg-brand-night/40 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-brand-gold">رفع يدوي لفيديو محدد</h2>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-lg border border-brand-gold/25 px-3 py-2 text-sm text-brand-cream/75 hover:bg-brand-gold/10"
          >
            تحديث
          </button>
        </div>
        <div className="space-y-3">
          {waiting.map((job) => (
            <div key={job.id} className="grid gap-3 rounded-xl border border-brand-gold/10 bg-black/10 p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="font-semibold text-brand-cream">{job.title}</div>
                <div className="mt-1 text-xs text-brand-cream/45" dir="ltr">{job.source_video_id}</div>
                <div className="mt-2 text-xs text-amber-300/80">{job.source_media_url ? "تم رفع الملف وينتظر المعالجة" : "بانتظار ملف فيديو"}</div>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setSelectedJob(job);
                  setTimeout(() => singleInputRef.current?.click(), 0);
                }}
                className="rounded-lg border border-brand-gold/25 px-4 py-2 text-sm text-brand-cream hover:bg-brand-gold/10 disabled:opacity-50"
              >
                رفع ملف لهذا الفيديو
              </button>
            </div>
          ))}
          {!waiting.length && <p className="text-sm text-brand-cream/50">لا توجد فيديوهات تنتظر ملفًا حاليًا.</p>}
        </div>
        <input
          ref={singleInputRef}
          type="file"
          className="hidden"
          accept="video/mp4,video/quicktime,video/x-m4v,video/webm"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleSingle(file);
          }}
        />
      </section>

      {(error || uploads.length > 0) && (
        <section className="rounded-2xl border border-brand-gold/20 bg-black/10 p-5 space-y-3">
          {error && <div className="rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
          {uploads.map((result, index) => (
            <div key={`${result.name}-${index}`} className={`rounded-lg border p-3 text-sm ${result.ok ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200" : "border-red-400/20 bg-red-500/10 text-red-200"}`}>
              <div className="font-medium">{result.name}</div>
              <div className="mt-1 opacity-80" dir="ltr">{result.sourceVideoId}</div>
              <div className="mt-1">{result.message}</div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
