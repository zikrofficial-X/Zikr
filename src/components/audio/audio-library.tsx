"use client";

import { useEffect, useMemo, useState } from "react";
import { AudioLines, ExternalLink, Headphones, Mic2, Sparkles } from "lucide-react";
import {
  getAudioSettingsFromStorage,
  persistAudioSettings,
  registerAudioChoices,
  type AudioChoice,
  type AudioSlot,
} from "@/lib/audio/config";

type AudioKind = "adhan" | "salawat" | "dhikr";
type AudioAsset = {
  id: string;
  kind: AudioKind;
  title: string | null;
  url: string;
  isPrimary: boolean;
  isHuman: boolean;
  sourceUrl: string | null;
  sourceName: string | null;
  license: string | null;
  attribution: string | null;
};

type AudioResponse = {
  library?: AudioAsset[];
};

const slotFor = (kind: AudioKind): AudioSlot => kind === "adhan" ? "prayer" : kind;

function toChoice(asset: AudioAsset): AudioChoice {
  return {
    key: "site:id:" + asset.id,
    label: asset.title ?? "مقطع صوتي",
    webUrl: asset.url,
    nativeFile: null,
    slot: slotFor(asset.kind),
    human: asset.isHuman,
    sourceUrl: asset.sourceUrl ?? undefined,
    license: asset.license ?? undefined,
  };
}

const GROUPS = [
  { kind: "adhan" as const, label: "الأذان", icon: Mic2, description: "اختَر من تسجيلات أذان بشرية متعددة، مع مصدر واضح لكل تسجيل." },
  { kind: "salawat" as const, label: "الصلاة على النبي ﷺ", icon: AudioLines, description: "اختَر التذكير الصوتي الذي تريد سماعه عند تشغيل هذه الخاصية." },
  { kind: "dhikr" as const, label: "التسبيح والذكر", icon: Sparkles, description: "عدة صيغ صوتية بشرية، مع إمكانية إضافة تسجيلات كاملة من الإدارة." },
];

export function AudioLibrary() {
  const [library, setLibrary] = useState<AudioAsset[]>([]);
  const [selected, setSelected] = useState<Record<AudioSlot, string>>(() => getAudioSettingsFromStorage());
  const [failedAssets, setFailedAssets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    fetch("/api/site-audio", { cache: "no-store" })
      .then(response => response.ok ? response.json() as Promise<AudioResponse> : { library: [] })
      .then(payload => {
        if (!active) return;
        const choices = (payload.library ?? []).map(toChoice);
        registerAudioChoices(choices);
        setLibrary(payload.library ?? []);
        setSelected(getAudioSettingsFromStorage());
      })
      .catch(() => {
        if (active) setLibrary([]);
      });
    return () => { active = false; };
  }, []);

  const grouped = useMemo(
    () => new Map(GROUPS.map(group => [group.kind, library.filter(asset => asset.kind === group.kind)])),
    [library],
  );

  const choose = (asset: AudioAsset) => {
    const slot = slotFor(asset.kind);
    const next = persistAudioSettings({ ...selected, [slot]: "site:id:" + asset.id });
    setSelected(next);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {GROUPS.map(group => {
        const Icon = group.icon;
        const items = grouped.get(group.kind) ?? [];
        return (
          <section key={group.kind} className="rounded-3xl border border-brand-gold/15 bg-black/20 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-brand-gold"><Icon className="h-5 w-5" /><span className="text-xs font-bold tracking-[0.18em]">{group.label}</span></div>
                <p className="mt-2 text-sm leading-7 text-brand-cream/60">{group.description}</p>
              </div>
              <span className="rounded-full border border-brand-gold/15 bg-brand-gold/5 px-3 py-1 text-[11px] text-brand-gold">{items.length} مقاطع</span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {items.map(asset => {
                const slot = slotFor(asset.kind);
                const key = "site:id:" + asset.id;
                const activeChoice = selected[slot] === key;
                return (
                  <article key={asset.id} className={"rounded-2xl border p-4 transition " + (activeChoice ? "border-brand-gold/45 bg-brand-gold/5" : "border-brand-cream/10 bg-black/15")}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-brand-cream">{asset.title ?? "مقطع صوتي"}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-brand-cream/45">
                          {asset.isHuman && <span>صوت بشري</span>}
                          {asset.sourceName && <span>· {asset.sourceName}</span>}
                          {asset.license && <span>· {asset.license}</span>}
                        </div>
                      </div>
                      {asset.isPrimary && <span className="rounded-full bg-brand-gold/15 px-2 py-0.5 text-[10px] font-bold text-brand-gold">الافتراضي</span>}
                    </div>

                    <audio
                      controls
                      preload="metadata"
                      src={asset.url}
                      className="mt-4 h-10 w-full rounded-lg"
                      aria-label={"تشغيل " + (asset.title ?? "المقطع")}
                      onError={() => setFailedAssets(current => ({ ...current, [asset.id]: true }))}
                      onCanPlay={() => setFailedAssets(current => {
                        if (!current[asset.id]) return current;
                        const next = { ...current };
                        delete next[asset.id];
                        return next;
                      })}
                    />
                    {failedAssets[asset.id] ? (
                      <p role="alert" className="mt-2 text-xs leading-6 text-red-300">
                        تعذر تحميل هذا التسجيل من مصدره الحالي. جرّب مصدرًا آخر أو أبلغ الإدارة عن الرابط.
                      </p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => choose(asset)}
                        disabled={Boolean(failedAssets[asset.id])}
                        className={"rounded-xl px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 " + (activeChoice ? "bg-brand-gold text-brand-emeraldDeep" : "border border-brand-gold/30 text-brand-gold")}
                      >
                        {activeChoice ? "مفعّل لهذا النوع" : "استخدام هذا الصوت"}
                      </button>
                      {asset.sourceUrl && (
                        <a href={asset.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-brand-gold hover:text-brand-goldSoft">
                          المصدر <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
              {!items.length && <div className="rounded-2xl border border-dashed border-brand-cream/15 p-5 text-sm text-brand-cream/45 md:col-span-2">لم تُضف مقاطع لهذا النوع بعد.</div>}
            </div>
          </section>
        );
      })}
      <p className="inline-flex items-center gap-2 rounded-2xl border border-brand-cream/10 bg-white/[0.02] px-4 py-3 text-xs leading-6 text-brand-cream/55">
        <Headphones className="h-4 w-4" />
        الاختيار يُحفظ على الجهاز ويُستخدم في التشغيل الأمامي. إشعارات Android تحتفظ بملف bundled احتياطي عندما لا يكون للصوت المختار نسخة محلية.
      </p>
    </div>
  );
}
