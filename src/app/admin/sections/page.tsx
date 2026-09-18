'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// ─── Full site sections list ──────────────────────────────────────────────────
const ALL_SECTIONS = [
  { key: 'quran', label: 'القرآن الكريم', href: '/quran', desc: 'قراءة واستماع للقرآن الكريم', group: 'الأساسيات' },
  { key: 'hadith', label: 'الأحاديث النبوية', href: '/hadith', desc: 'أحاديث صحيحة موثقة', group: 'الأساسيات' },
  { key: 'adhkar', label: 'الأذكار اليومية', href: '/adhkar', desc: 'أذكار الصباح والمساء', group: 'الأساسيات' },
  { key: 'dua', label: 'الأدعية المأثورة', href: '/dua', desc: 'أدعية نبوية لكل المناسبات', group: 'الأساسيات' },
  { key: 'prayer-times', label: 'مواقيت الصلاة', href: '/prayer-times', desc: 'أوقات الصلاة حسب الموقع', group: 'الأساسيات' },
  { key: 'qibla', label: 'اتجاه القبلة', href: '/qibla', desc: 'بوصلة القبلة', group: 'الأساسيات' },
  { key: 'tasbeeh', label: 'عداد التسبيح', href: '/tasbeeh', desc: 'عداد رقمي للتسبيح', group: 'الأساسيات' },
  { key: 'prophets', label: 'قصص الأنبياء', href: '/prophets', desc: 'سير الأنبياء والمرسلين', group: 'المعرفة' },
  { key: 'companions', label: 'الصحابة الكرام', href: '/companions', desc: 'تراجم الصحابة', group: 'المعرفة' },
  { key: 'scholars', label: 'العلماء', href: '/scholars', desc: 'تراجم العلماء', group: 'المعرفة' },
  { key: 'stories', label: 'القصص الإسلامية', href: '/stories', desc: 'قصص ملهمة من التاريخ', group: 'المعرفة' },
  { key: 'articles', label: 'المقالات', href: '/articles', desc: 'مقالات دينية وثقافية', group: 'المعرفة' },
  { key: 'battles', label: 'الغزوات', href: '/battles', desc: 'غزوات النبي ﷺ', group: 'المعرفة' },
  { key: 'conquests', label: 'الفتوحات الإسلامية', href: '/conquests', desc: 'تاريخ الفتوحات', group: 'المعرفة' },
  { key: 'memorization', label: 'حفظ القرآن', href: '/memorization', desc: 'خطط وتتبع الحفظ', group: 'تفاعلي' },
  { key: 'spiritual-ai', label: 'الرفيق الروحاني', href: '/spiritual-ai', desc: 'مساعد AI للأسئلة الدينية', group: 'تفاعلي' },
  { key: 'kids', label: 'قسم الأطفال', href: '/kids', desc: 'محتوى تعليمي للأطفال', group: 'تفاعلي' },
  { key: 'competitions', label: 'المسابقات', href: '/competitions', desc: 'مسابقات دينية وإسلامية', group: 'تفاعلي' },
  { key: 'poetry', label: 'الشعر الإسلامي', href: '/poetry', desc: 'قصائد ومدائح', group: 'الإعلام' },
  { key: 'tawasheeh', label: 'المداحون والتواشيح', href: '/tawasheeh', desc: 'تواشيح دينية', group: 'الإعلام' },
  { key: 'reciters', label: 'قراء القرآن', href: '/reciters', desc: 'تلاوات القراء المميزين', group: 'الإعلام' },
  { key: 'radio', label: 'إذاعة القرآن', href: '/radio', desc: 'بث مباشر للقرآن', group: 'الإعلام' },
  { key: 'videos', label: 'الفيديوهات', href: '/videos', desc: 'فيديوهات دينية وتعليمية', group: 'الإعلام' },
  { key: 'youtube', label: 'قناة يوتيوب', href: '/youtube', desc: 'رابط لقناة يوتيوب', group: 'الإعلام' },
  { key: 'tafsir', label: 'التفسير', href: '/tafsir', desc: 'تفسير آيات القرآن', group: 'الأساسيات' },
  { key: 'favorites', label: 'المفضلة', href: '/favorites', desc: 'المحتوى المحفوظ للمستخدم', group: 'تفاعلي' },
  { key: 'search', label: 'البحث الشامل', href: '/search', desc: 'بحث في كل محتوى الموقع', group: 'تفاعلي' },
  { key: 'contact', label: 'تواصل معنا', href: '/contact', desc: 'صفحة التواصل', group: 'عام' },
  { key: 'about', label: 'عن المنصة', href: '/about', desc: 'معلومات عن ذِكرٌ', group: 'عام' },
  { key: 'faq', label: 'الأسئلة الشائعة', href: '/faq', desc: 'أجوبة الأسئلة المتكررة', group: 'عام' },
];

const GROUPS = ['الكل', 'الأساسيات', 'المعرفة', 'تفاعلي', 'الإعلام', 'عام'];

export default function AdminSectionsPage() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(ALL_SECTIONS.map((s) => [s.key, true]))
  );
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeGroup, setActiveGroup] = useState('الكل');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/sections', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json() as { visibility?: Record<string, boolean>; error?: string };
        if (!response.ok) throw new Error(payload.error || 'تعذر تحميل إعدادات الأقسام');
        if (!cancelled && payload.visibility) setEnabled((current) => ({ ...current, ...payload.visibility }));
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل إعدادات الأقسام');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const toggle = (key: string) => {
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const response = await fetch('/api/admin/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: enabled }),
      });
      const payload = await response.json() as { visibility?: Record<string, boolean>; error?: string };
      if (!response.ok) throw new Error(payload.error || 'تعذر حفظ إعدادات الأقسام');
      if (payload.visibility) setEnabled((current) => ({ ...current, ...payload.visibility }));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : 'تعذر حفظ إعدادات الأقسام');
    } finally {
      setSaving(false);
    }
  };

  const filtered = ALL_SECTIONS.filter((s) => {
    const matchGroup = activeGroup === 'الكل' || s.group === activeGroup;
    const matchSearch = !search || s.label.includes(search) || s.desc.includes(search);
    return matchGroup && matchSearch;
  });

  const enabledCount = Object.values(enabled).filter(Boolean).length;
  const disabledCount = ALL_SECTIONS.length - enabledCount;

  return (
    <div className="py-8 px-4 space-y-8 text-right" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <section className="space-y-1">
          <nav className="text-xs text-brand-cream/35 flex items-center gap-2 mb-3">
            <Link href="/admin" className="hover:text-brand-gold transition-colors">لوحة التحكم</Link>
            <span>/</span>
            <span className="text-brand-cream/60">ترتيب الأقسام</span>
          </nav>
          <h1 className="text-3xl font-bold text-brand-gold">ترتيب وإظهار الأقسام</h1>
          <p className="text-sm text-brand-cream/45 leading-relaxed">
            تحكم في ظهور كل قسم في الموقع. الأقسام المخفية لن تظهر في القوائم والصفحة الرئيسية.
          </p>
        </section>

        {error && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-xl border border-brand-gold/15 bg-black/20 px-4 py-3 text-sm text-brand-cream/60" role="status">
            جاري تحميل إعدادات الأقسام المحفوظة...
          </div>
        )}

        {/* Stats bar */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/25 bg-emerald-500/8">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-sm text-emerald-300 font-semibold">{enabledCount} قسم مفعّل</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/25 bg-red-500/8">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-sm text-red-300 font-semibold">{disabledCount} قسم مخفي</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-brand-gold/20 bg-brand-gold/5">
            <span className="text-sm text-brand-gold/70">{ALL_SECTIONS.length} قسم إجمالي</span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في الأقسام..."
              dir="rtl"
              className="pl-4 pr-9 py-2 rounded-xl border border-brand-gold/20 bg-black/30 text-sm text-brand-cream placeholder:text-brand-cream/25 focus:outline-none focus:border-brand-gold/45 w-52"
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-gold/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
            </svg>
          </div>

          {/* Group pills */}
          <div className="flex gap-2 flex-wrap">
            {GROUPS.map((g) => (
              <button
                key={g}
                onClick={() => setActiveGroup(g)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeGroup === g
                    ? 'bg-brand-gold/20 text-brand-gold border border-brand-gold/35'
                    : 'border border-brand-gold/12 text-brand-cream/45 hover:border-brand-gold/25 hover:text-brand-cream/65'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Sections grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((section) => {
            const isOn = enabled[section.key];
            return (
              <div
                key={section.key}
                className={`relative rounded-2xl border p-4 transition-all duration-200 ${
                  isOn
                    ? 'border-brand-gold/20 bg-black/20 hover:border-brand-gold/35'
                    : 'border-brand-gold/8 bg-black/10 opacity-60'
                }`}
              >
                {/* Group badge */}
                <span className="absolute top-3 left-3 text-[9px] font-bold tracking-widest text-brand-gold/35 uppercase px-2 py-0.5 rounded-full border border-brand-gold/12">
                  {section.group}
                </span>

                <div className="flex items-start justify-between gap-2 mb-2 mt-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-brand-cream/80 truncate">{section.label}</p>
                    <p className="text-xs text-brand-cream/40 mt-0.5 truncate">{section.desc}</p>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => toggle(section.key)}
                    aria-label={isOn ? `إخفاء ${section.label}` : `إظهار ${section.label}`}
                    className={`relative shrink-0 w-10 h-5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-gold/30 ${
                      isOn ? 'bg-brand-gold/70' : 'bg-black/40 border border-brand-gold/20'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${
                        isOn ? 'bg-brand-emeraldDeep right-0.5' : 'bg-brand-cream/25 left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Preview link */}
                <a
                  href={section.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-brand-gold/35 hover:text-brand-gold/65 transition-colors mt-1"
                >
                  <span>{section.href}</span>
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-2.5 h-2.5">
                    <path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75H9.75a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z" />
                    <path d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5Z" />
                  </svg>
                </a>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-brand-gold/12 bg-black/20 p-10 text-center">
            <p className="text-brand-cream/40 text-sm">لا توجد أقسام تطابق البحث</p>
          </div>
        )}

        {/* Save actions */}
        <div className="flex items-center justify-between pt-2 border-t border-brand-gold/10">
          <div className="flex gap-3">
            <button
              onClick={() => {
                setEnabled(Object.fromEntries(ALL_SECTIONS.map((s) => [s.key, true])));
                setSaved(false);
              }}
              className="px-4 py-2 rounded-xl border border-brand-gold/15 text-sm text-brand-cream/50 hover:border-brand-gold/30 hover:text-brand-cream/70 transition-colors"
            >
              تفعيل الكل
            </button>
            <button
              onClick={() => {
                const essentials = ['quran', 'hadith', 'adhkar', 'dua', 'prayer-times', 'qibla'];
                setEnabled(Object.fromEntries(ALL_SECTIONS.map((s) => [s.key, essentials.includes(s.key)])));
                setSaved(false);
              }}
              className="px-4 py-2 rounded-xl border border-brand-gold/15 text-sm text-brand-cream/50 hover:border-brand-gold/30 hover:text-brand-cream/70 transition-colors"
            >
              الأساسيات فقط
            </button>
          </div>

          <button
            onClick={() => void handleSave()}
            disabled={saving || loading}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${
              saved
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : 'bg-brand-gold text-brand-emeraldDeep hover:bg-brand-goldSoft shadow-lg shadow-brand-gold/20'
            }`}
          >
            {saving ? 'جاري الحفظ...' : saved ? 'تم الحفظ' : 'حفظ التغييرات'}
          </button>
        </div>

      </div>
    </div>
  );
}
