"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

export type KidsWorldTheme =
  | "garden"
  | "mosque"
  | "night"
  | "dawn"
  | "oasis"
  | "library"
  | "sea";

const THEME_STYLES: Record<KidsWorldTheme, CSSProperties> = {
  garden: { background: "linear-gradient(160deg,#103c3a 0%,#071c26 58%,#06121a 100%)" },
  mosque: { background: "linear-gradient(160deg,#153948 0%,#0b202b 52%,#06131a 100%)" },
  night: { background: "linear-gradient(160deg,#17224d 0%,#090f2a 54%,#050916 100%)" },
  dawn: { background: "linear-gradient(160deg,#5f4933 0%,#263049 48%,#091421 100%)" },
  oasis: { background: "linear-gradient(160deg,#174f4a 0%,#0c2d38 48%,#07131e 100%)" },
  library: { background: "linear-gradient(160deg,#3b2b48 0%,#17172c 54%,#080912 100%)" },
  sea: { background: "linear-gradient(160deg,#15516a 0%,#0a3046 50%,#06131d 100%)" },
};

const STARS = [
  [7, 14, 1], [16, 27, 0], [25, 10, 2], [33, 20, 1], [43, 8, 0],
  [52, 26, 2], [62, 13, 1], [74, 22, 0], [84, 9, 2], [94, 31, 1],
  [11, 51, 0], [28, 63, 1], [48, 55, 2], [69, 66, 0], [88, 58, 1],
] as const;

const ORBS = [
  [14, 42, 7], [38, 70, 5], [60, 36, 6], [82, 62, 8], [92, 18, 5],
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function KidsGameStage({
  theme,
  children,
  className = "",
  ariaLabel,
}: {
  theme: KidsWorldTheme;
  children: ReactNode;
  className?: string;
  ariaLabel: string;
}) {
  return (
    <div
      dir="rtl"
      role="application"
      aria-label={ariaLabel}
      className={
        "relative mx-auto min-h-[520px] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-brand-gold/20 shadow-2xl " +
        className
      }
      style={THEME_STYLES[theme]}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {STARS.map(([left, top, type], index) => (
          <span
            key={String(index)}
            className={
              "zk-twinkle " +
              (type === 2
                ? "absolute text-lg text-brand-gold/65"
                : type === 1
                  ? "absolute text-sm text-white/45"
                  : "absolute text-xs text-white/35")
            }
            style={
              {
                left: left + "%",
                top: top + "%",
                "--zk-delay": ((index * 0.37) % 3).toFixed(2) + "s",
                "--zk-dur": (2.6 + (index % 4) * 0.7).toFixed(1) + "s",
              } as CSSProperties
            }
          >
            {type === 2 ? "✦" : type === 1 ? "·" : "•"}
          </span>
        ))}
        {ORBS.map(([left, top, size], index) => (
          <span
            key={"orb-" + index}
            className="zk-float absolute rounded-full bg-brand-gold/25 blur-[2px]"
            style={
              {
                left: left + "%",
                top: top + "%",
                width: size,
                height: size,
                "--zk-delay": (index * 0.9).toFixed(1) + "s",
                "--zk-dur": (5 + index).toFixed(0) + "s",
              } as CSSProperties
            }
          />
        ))}
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-brand-gold/8 blur-3xl" />
        <div className="absolute -right-20 bottom-5 h-72 w-72 rounded-full bg-brand-emerald/10 blur-3xl" />
      </div>
      {children}
    </div>
  );
}

export function KidsGameHeader({
  eyebrow,
  title,
  description,
  themeColor = "text-brand-gold",
  right,
}: {
  eyebrow: string;
  title: string;
  description: string;
  themeColor?: string;
  right?: ReactNode;
}) {
  return (
    <header className="relative z-20 mb-4 flex flex-wrap items-start justify-between gap-4 p-5 pb-0 sm:p-6 sm:pb-0">
      <div className="max-w-3xl">
        <p className={"text-[11px] font-black tracking-[0.22em] uppercase " + themeColor}>
          {eyebrow}
        </p>
        <h3 className="mt-2 text-3xl font-black leading-tight text-brand-cream sm:text-4xl">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-7 text-brand-cream/65 sm:text-base">
          {description}
        </p>
      </div>
      {right}
    </header>
  );
}

export function KidsGameHud({
  items,
}: {
  items: Array<{ label: string; value: ReactNode; tone?: string }>;
}) {
  return (
    <div className="relative z-20 grid grid-cols-2 gap-2 px-4 sm:grid-cols-5 sm:px-6" aria-live="polite">
      {items.map(item => (
        <div
          key={item.label}
          className="rounded-2xl border border-white/10 bg-black/20 p-3 backdrop-blur-sm"
        >
          <span className="block text-[11px] text-brand-cream/45">{item.label}</span>
          <strong className={"mt-1 block text-lg font-black " + (item.tone ?? "text-brand-cream")}>
            {item.value}
          </strong>
        </div>
      ))}
    </div>
  );
}

export function KidsProgress({
  value,
  label = "التقدم",
}: {
  value: number;
  label?: string;
}) {
  const percent = clamp(Math.round(value), 0, 100);
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-center justify-between text-[11px] text-brand-cream/50">
        <span>{label}</span>
        <strong className="text-brand-gold">{percent}%</strong>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-gold via-brand-emerald to-sky-300 transition-[width] duration-200"
          style={{ width: percent + "%" }}
        />
      </div>
    </div>
  );
}

export function StarToken({
  size = 34,
  active = true,
  pulse = false,
}: {
  size?: number;
  active?: boolean;
  pulse?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={
        "grid shrink-0 place-items-center rounded-full border-2 border-brand-gold/80 bg-brand-gold/20 text-brand-gold shadow-[0_0_24px_rgba(243,201,105,0.18)] " +
        (pulse ? "animate-pulse " : "") +
        (active ? "" : "opacity-20 grayscale")
      }
      style={{ width: size, height: size, fontSize: size * 0.52 }}
    >
      ★
    </span>
  );
}

export function GemToken({ tone = "emerald", size = 34 }: { tone?: "emerald" | "sky" | "violet"; size?: number }) {
  const toneClass =
    tone === "sky"
      ? "border-sky-200/70 bg-sky-200/15 text-sky-200"
      : tone === "violet"
        ? "border-violet-200/70 bg-violet-200/15 text-violet-200"
        : "border-brand-emerald/70 bg-brand-emerald/15 text-brand-emerald";
  return (
    <span
      aria-hidden="true"
      className={"grid shrink-0 place-items-center rounded-2xl border-2 " + toneClass}
      style={{ width: size, height: size, fontSize: size * 0.46 }}
    >
      ◆
    </span>
  );
}

export function KidCharacter({
  state = "idle",
  variant = "runner",
  size = 82,
}: {
  state?: "idle" | "run" | "jump" | "fall" | "hit" | "celebrate" | "think" | "help";
  variant?: "runner" | "explorer" | "reader" | "helper";
  size?: number;
}) {
  const body =
    variant === "explorer"
      ? "#5fd1a6"
      : variant === "reader"
        ? "#8ab6e2"
        : variant === "helper"
          ? "#d7a7e8"
          : "#f3c969";
  const scarf =
    variant === "explorer"
      ? "#f3c969"
      : variant === "reader"
        ? "#d7a7e8"
        : variant === "helper"
          ? "#5fd1a6"
          : "#8ab6e2";
  const motion =
    state === "run"
      ? "animate-[bounce_0.6s_ease-in-out_infinite]"
      : state === "jump"
        ? "translate-y-[-8px] rotate-[-4deg]"
        : state === "fall"
          ? "rotate-[7deg]"
          : state === "hit"
            ? "scale-95 rotate-[-8deg] opacity-70"
            : state === "celebrate"
              ? "animate-bounce scale-105"
              : "zk-breathe";

  return (
    <div
      className={"relative select-none transition-transform duration-150 " + motion}
      style={{ width: size, height: size * 1.12 }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 96 108" className="h-full w-full overflow-visible drop-shadow-[0_14px_18px_rgba(0,0,0,0.25)]">
        <ellipse cx="48" cy="100" rx="29" ry="7" fill="rgba(0,0,0,.25)" />
        <path d="M30 63c3-15 13-22 18-22s15 7 18 22l5 29H25z" fill={body} />
        <path d="M34 69c6 4 21 5 28 0l3 23H31z" fill="#f7f1df" opacity=".86" />
        <circle cx="48" cy="35" r="23" fill="#f5cfad" />
        <path d="M28 33c1-17 11-27 27-27 11 0 20 6 24 19-8-5-15-7-23-7-9 0-17 5-28 15z" fill={scarf} />
        <path d="M65 17c7 6 11 13 11 23-3 4-7 7-11 8 4-8 4-18 0-31z" fill={scarf} opacity=".92" />
        <circle cx="34" cy="43" r="4.2" fill="#ff8f8f" opacity=".28" />
        <circle cx="62" cy="43" r="4.2" fill="#ff8f8f" opacity=".28" />
        {state === "celebrate" ? (
          <>
            <path d="M37 37q4-6 8 0M51 37q4-6 8 0" fill="none" stroke="#18303a" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M40 46q8 11 16 0z" fill="#8f3f46" stroke="#8f5f53" strokeWidth="1.6" strokeLinejoin="round" />
          </>
        ) : (
          <>
            <g className="zk-blink">
              <circle cx="41" cy="36" r="2.9" fill="#18303a" />
              <circle cx="55" cy="36" r="2.9" fill="#18303a" />
              <circle cx="42" cy="35" r="1" fill="#fff" />
              <circle cx="56" cy="35" r="1" fill="#fff" />
            </g>
            {state === "think" && (
              <path d="M36 30q5-3 9 0M51 30q4-3 9 0" fill="none" stroke="#18303a" strokeWidth="1.8" strokeLinecap="round" />
            )}
            {state === "hit" || state === "fall" ? (
              <ellipse cx="48" cy="50" rx="3.2" ry="3.8" fill="#8f3f46" />
            ) : state === "think" ? (
              <path d="M44 49h8" fill="none" stroke="#8f5f53" strokeWidth="2.5" strokeLinecap="round" />
            ) : (
              <path d="M42 48c4 4 8 4 12 0" fill="none" stroke="#8f5f53" strokeWidth="2.5" strokeLinecap="round" />
            )}
          </>
        )}
        <path d="M22 72c-10 5-14 13-9 19 5 6 13-1 21-10" fill="none" stroke={body} strokeWidth="10" strokeLinecap="round" />
        <path d="M74 72c10 5 14 13 9 19-5 6-13-1-21-10" fill="none" stroke={body} strokeWidth="10" strokeLinecap="round" />
        <path d="M34 91c-2 8-7 12-12 12M62 91c2 8 7 12 12 12" fill="none" stroke="#21353d" strokeWidth="7" strokeLinecap="round" />
        {state === "think" && <path d="M72 8c11-7 17 4 9 8-3 2-5 6-3 9-8 1-12-4-12-9 0-4 2-6 6-8z" fill="#fff4cb" stroke="#f3c969" strokeWidth="2" />}
        {state === "help" && <path d="M67 5h21v15H67z" rx="4" fill="#fff4cb" stroke="#f3c969" strokeWidth="2" />}
        {state === "celebrate" && (
          <>
            <path d="M12 26l10-5M84 26l-10-5M14 48l-9 0M82 48l9 0" stroke="#f3c969" strokeWidth="3" strokeLinecap="round" />
            <path d="M18 8l5 8M78 8l-5 8" stroke="#5fd1a6" strokeWidth="3" strokeLinecap="round" />
            <path d="M8 40l2 4 4 2-4 2-2 4-2-4-4-2 4-2zM88 40l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#fff4cb" className="zk-twinkle" />
          </>
        )}
      </svg>
    </div>
  );
}

export function MosqueBackdrop({ compact = false }: { compact?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden" aria-hidden="true">
      <div className={(compact ? "h-32" : "h-44") + " relative"}>
        <div className="absolute inset-x-0 bottom-0 h-20 bg-[#061018]/85" />
        <div className="absolute bottom-16 left-[6%] h-24 w-24 rounded-t-[2rem] bg-[#0b202a] border border-brand-gold/10" />
        <div className="absolute bottom-16 left-[16%] h-40 w-10 rounded-t-full bg-[#0b202a] border border-brand-gold/10" />
        <div className="absolute bottom-16 left-[22%] h-28 w-44 rounded-t-[3rem] bg-[#0b202a] border border-brand-gold/10" />
        <div className="absolute bottom-16 right-[21%] h-28 w-44 rounded-t-[3rem] bg-[#0b202a] border border-brand-gold/10" />
        <div className="absolute bottom-16 right-[8%] h-40 w-10 rounded-t-full bg-[#0b202a] border border-brand-gold/10" />
        <div className="absolute bottom-40 left-1/2 h-32 w-56 -translate-x-1/2 rounded-t-full bg-[#0b202a] border border-brand-gold/10" />
        <div className="absolute bottom-[8.75rem] left-1/2 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-brand-gold/55" />
        <span className="absolute bottom-[14.4rem] left-[17.6%] text-sm leading-none text-brand-gold/70">☪&#xFE0E;</span>
        <span className="absolute bottom-[14.4rem] right-[9.6%] text-sm leading-none text-brand-gold/70">☪&#xFE0E;</span>
        {[[19, 9.2], [19, 11.4], [10, 13.6], [88, 9.2], [88, 11.4], [47, 17.4], [53, 17.4]].map(([left, bottom], index) => (
          <span
            key={"window-" + index}
            className="zk-glow absolute h-3 w-2 rounded-t-full bg-brand-gold/70"
            style={
              {
                left: left + "%",
                bottom: bottom + "rem",
                "--zk-delay": (index * 0.6).toFixed(1) + "s",
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}

export function GardenBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#06141b] to-transparent" />
      {[6,18,31,68,81,94].map((left, index) => (
        <div
          key={left}
          className="absolute bottom-7"
          style={{ left: left + "%", transform: "scale(" + (0.7 + (index % 3) * 0.13) + ")" }}
        >
          <div className="h-14 w-14 rounded-full bg-[#0d3a36]/90" />
          <div className="mx-auto -mt-4 h-16 w-10 rounded-t-full bg-[#123f3a]" />
        </div>
      ))}
      <div className="absolute bottom-0 inset-x-0 h-9 bg-[#0a2c28]" />
    </div>
  );
}

export function Moon({ size = 118 }: { size?: number }) {
  return (
    <div
      className="pointer-events-none absolute right-[8%] top-[7%] opacity-95"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 rounded-full bg-brand-gold/90"
        style={{ boxShadow: "0 0 55px rgba(243,201,105,.22)" }}
      />
      <div className="absolute left-[26%] top-[8%] h-[83%] w-[83%] rounded-full bg-[#0f213b]" />
    </div>
  );
}

export function Cloud({
  left,
  top,
  scale = 1,
  tone = "light",
}: {
  left: number;
  top: number;
  scale?: number;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={"pointer-events-none absolute " + (tone === "light" ? "text-white/10" : "text-black/15")}
      style={{ left: left + "%", top: top + "%", transform: "scale(" + scale + ")" }}
      aria-hidden="true"
    >
      <div className="relative h-10 w-28 rounded-full bg-current">
        <div className="absolute -left-3 -top-5 h-12 w-12 rounded-full bg-current" />
        <div className="absolute left-8 -top-7 h-16 w-16 rounded-full bg-current" />
        <div className="absolute right-1 -top-4 h-10 w-10 rounded-full bg-current" />
      </div>
    </div>
  );
}

export function GameToast({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "emerald" | "rose" }) {
  const toneClass =
    tone === "rose"
      ? "border-rose-300/20 bg-rose-300/10 text-rose-100"
      : tone === "emerald"
        ? "border-brand-emerald/20 bg-brand-emerald/10 text-brand-emerald"
        : "border-brand-gold/20 bg-brand-gold/10 text-brand-cream";
  return (
    <div className={"relative z-30 mx-4 mt-4 rounded-2xl border px-4 py-3 text-sm leading-7 " + toneClass} role="status" aria-live="polite">
      {children}
    </div>
  );
}

export function ResultCard({
  complete,
  title,
  subtitle,
  score,
  collectibles,
  level,
}: {
  complete: boolean;
  title: string;
  subtitle: string;
  score: number;
  collectibles: number;
  level: number;
}) {
  return (
    <div className="relative z-50 mx-auto w-full max-w-xl rounded-[2rem] border border-brand-gold/20 bg-[#091722]/95 p-6 text-center shadow-2xl backdrop-blur-xl">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-brand-gold/40 bg-brand-gold/10 text-4xl shadow-[0_0_50px_rgba(243,201,105,.12)]">
        {complete ? "✦" : "↻"}
      </div>
      <h4 className="mt-4 text-3xl font-black text-brand-cream">{title}</h4>
      <p className="mt-2 text-sm leading-7 text-brand-cream/65">{subtitle}</p>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <span className="block text-xs text-brand-cream/45">النقاط</span>
          <strong className="mt-1 block text-lg text-brand-gold">{score}</strong>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <span className="block text-xs text-brand-cream/45">النجوم</span>
          <strong className="mt-1 block text-lg text-brand-emerald">{collectibles}</strong>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <span className="block text-xs text-brand-cream/45">المستوى</span>
          <strong className="mt-1 block text-lg text-violet-200">{level}</strong>
        </div>
      </div>
    </div>
  );
}

export function TouchArrows({
  onLeft,
  onRight,
  onAction,
  actionLabel = "قفز",
}: {
  onLeft: () => void;
  onRight: () => void;
  onAction: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <button type="button" onPointerDown={onRight} className="min-h-14 min-w-20 rounded-2xl border border-brand-cream/15 bg-black/25 px-5 text-2xl text-brand-cream active:scale-95">
        →
      </button>
      <button type="button" onPointerDown={onAction} className="min-h-14 min-w-24 rounded-2xl border-2 border-brand-gold/50 bg-brand-gold/10 px-5 text-sm font-black text-brand-gold active:scale-95">
        {actionLabel}
      </button>
      <button type="button" onPointerDown={onLeft} className="min-h-14 min-w-20 rounded-2xl border border-brand-cream/15 bg-black/25 px-5 text-2xl text-brand-cream active:scale-95">
        ←
      </button>
    </div>
  );
}

export function useElapsedSeconds(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setSeconds(value => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return seconds;
}

export function formatSeconds(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
}

export function levelPercent(current: number, total: number) {
  if (total <= 0) return 0;
  return clamp(Math.round((current / total) * 100), 0, 100);
}

export function shuffle<T>(items: readonly T[], seed = 1): T[] {
  const list = [...items];
  let value = (seed >>> 0) || 1;
  for (let i = list.length - 1; i > 0; i -= 1) {
    value = (value * 1664525 + 1013904223) >>> 0;
    const j = value % (i + 1);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export function seededNumber(seed: number) {
  const next = ((seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  return next;
}

export function useStableList<T>(items: readonly T[]) {
  return useMemo(() => [...items], [items]);
}
