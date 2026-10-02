"use client";

import type { ReactNode } from "react";
import type { GameId } from "@/lib/games/registry";

const SKY_STARS = Array.from({ length: 18 }, (_, index) => ({
  x: 40 + ((index * 83) % 1120),
  y: 32 + ((index * 47) % 170),
  r: 1.5 + (index % 3),
}));

function Stars({ accent = "#f3c969" }: { accent?: string }) {
  return (
    <g opacity=".65">
      {SKY_STARS.map((star) => (
        <circle key={star.x + ":" + star.y} cx={star.x} cy={star.y} r={star.r} fill={accent} />
      ))}
    </g>
  );
}

function WindowGlow({ x, y, w = 38, h = 54 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="9" fill="#f3c969" fillOpacity=".16" />
      <rect x={x + 7} y={y + 7} width={w - 14} height={h - 14} rx="6" fill="#f3c969" fillOpacity=".52" />
      <path d={`M${x + w / 2} ${y + 7}v${h - 14}`} stroke="#0b1d24" strokeOpacity=".55" strokeWidth="3" />
    </g>
  );
}

function SceneShell({
  children,
  topGlow = "#f3c969",
}: {
  children: ReactNode;
  topGlow?: string;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden="true">
      <svg viewBox="0 0 1200 480" className="h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="kids-world-glow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={topGlow} stopOpacity=".09" />
            <stop offset="56%" stopColor="#071b24" stopOpacity="0" />
            <stop offset="100%" stopColor="#02090d" stopOpacity=".55" />
          </linearGradient>
          <radialGradient id="kids-world-mist" cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor={topGlow} stopOpacity=".1" />
            <stop offset="100%" stopColor={topGlow} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1200" height="480" fill="url(#kids-world-glow)" />
        <rect width="1200" height="480" fill="url(#kids-world-mist)" />
        {children}
      </svg>
      <div className="absolute -left-14 top-10 h-32 w-32 rounded-full bg-white/5 blur-3xl animate-pulse" />
      <div className="absolute -right-12 bottom-8 h-40 w-40 rounded-full bg-brand-emerald/10 blur-3xl animate-pulse" />
    </div>
  );
}

function WorldLabel({ children }: { children: ReactNode }) {
  return (
    <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-black tracking-[.18em] text-brand-cream/55 backdrop-blur-sm">
      {children}
    </div>
  );
}

function RunnerWorld() {
  return (
    <>
      <SceneShell topGlow="#5fd1a6">
        <Stars accent="#e6ffef" />
        <circle cx="1000" cy="82" r="48" fill="#f3c969" fillOpacity=".85" />
        <circle cx="1018" cy="67" r="44" fill="#0c2730" />
        <path d="M0 330 C160 258 260 360 410 314 S720 252 890 316 S1060 274 1200 312V480H0Z" fill="#0a252a" />
        <path d="M0 378 C190 334 330 420 520 370 S840 330 1200 382V480H0Z" fill="#07181f" />
        <path d="M64 394h1072" stroke="#f3c969" strokeOpacity=".22" strokeWidth="5" strokeDasharray="24 28" />
        {[150, 420, 690, 960].map((x) => (
          <g key={x}>
            <rect x={x} y="300" width="18" height="88" rx="9" fill="#0b3438" />
            <circle cx={x + 9} cy="293" r="22" fill="#5fd1a6" fillOpacity=".35" />
            <circle cx={x + 9} cy="293" r="10" fill="#5fd1a6" fillOpacity=".85" />
          </g>
        ))}
        <path d="M0 446Q110 400 220 446T440 446T660 446T880 446T1200 446V480H0Z" fill="#06121a" />
      </SceneShell>
      <WorldLabel>RUNNER WORLD</WorldLabel>
    </>
  );
}

function MemoryWorld() {
  return (
    <>
      <SceneShell topGlow="#8e7be0">
        <Stars accent="#fff4cb" />
        <circle cx="1010" cy="78" r="52" fill="#f3c969" fillOpacity=".9" />
        <circle cx="1032" cy="64" r="46" fill="#0a1230" />
        <path d="M0 340Q120 292 240 340t240 0t240 0t240 0t240 0v140H0Z" fill="#0a1733" />
        {[110, 290, 470, 650, 830].map((x, index) => (
          <g key={x}>
            <rect x={x} y={245 - (index % 2) * 16} width="104" height="110" rx="22" fill="#162951" stroke="#8e7be0" strokeOpacity=".22" strokeWidth="3" />
            <rect x={x + 12} y={257 - (index % 2) * 16} width="80" height="86" rx="16" fill="#f3c969" fillOpacity=".06" />
          </g>
        ))}
        <path d="M0 405c180-40 280 34 448-4s260 44 412 2s220 26 340 2v75H0z" fill="#06111e" />
      </SceneShell>
      <WorldLabel>MEMORY GARDEN</WorldLabel>
    </>
  );
}

function WuduWorld() {
  return (
    <>
      <SceneShell topGlow="#69c7ec">
        <Stars accent="#dff7ff" />
        <path d="M0 328q140-70 280 0t280 0t280 0t280 0v152H0Z" fill="#0a3445" />
        <path d="M0 362q150-48 300 0t300 0t300 0t300 0v118H0Z" fill="#08242f" />
        {[120, 330, 540, 750, 960].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy="356" rx="48" ry="14" fill="#69c7ec" fillOpacity=".18" />
            <circle cx={x} cy="348" r="18" fill="#69c7ec" fillOpacity=".58" />
            <path d={`M${x - 10} 348q10-18 20 0q-10 20-20 0Z`} fill="#dff7ff" fillOpacity=".7" />
          </g>
        ))}
        <path d="M595 110c-42 66-72 104-72 146a72 72 0 00144 0c0-42-30-80-72-146Z" fill="#69c7ec" fillOpacity=".24" stroke="#bcefff" strokeOpacity=".35" strokeWidth="4" />
        <path d="M595 170c-26 40-40 59-40 84a40 40 0 0080 0c0-25-14-44-40-84Z" fill="#69c7ec" fillOpacity=".5" />
      </SceneShell>
      <WorldLabel>WATER STATION</WorldLabel>
    </>
  );
}

function VerseWorld() {
  return (
    <>
      <SceneShell topGlow="#d7a7e8">
        <Stars accent="#fff4cb" />
        <rect x="92" y="104" width="1016" height="244" rx="48" fill="#0d1021" stroke="#d7a7e8" strokeOpacity=".2" strokeWidth="3" />
        <path d="M150 318h900" stroke="#f3c969" strokeOpacity=".18" strokeWidth="10" strokeLinecap="round" />
        {["ن", "و", "ر", "ذ", "ك", "ر"].map((letter, index) => (
          <g key={letter + index}>
            <rect x={180 + index * 135} y="170" width="90" height="90" rx="24" fill="#7e62c6" fillOpacity=".3" stroke="#f3c969" strokeOpacity=".24" strokeWidth="3" />
            <text x={225 + index * 135} y="228" textAnchor="middle" fontSize="46" fill="#fff4cb">{letter}</text>
          </g>
        ))}
        <path d="M70 396q170-72 340 0t340 0t340 0v84H70Z" fill="#07111b" />
      </SceneShell>
      <WorldLabel>VERSE LIBRARY</WorldLabel>
    </>
  );
}

function QuizWorld() {
  return (
    <>
      <SceneShell topGlow="#77b8ff">
        <Stars accent="#dff2ff" />
        <circle cx="1000" cy="82" r="44" fill="#f3c969" fillOpacity=".8" />
        <g>
          <rect x="110" y="132" width="980" height="190" rx="38" fill="#07172a" stroke="#77b8ff" strokeOpacity=".22" strokeWidth="3" />
          {["أ", "ب", "ج", "د"].map((text, index) => (
            <g key={text}>
              <rect x={164 + index * 220} y="198" width="166" height="62" rx="20" fill={index === 1 ? "#f3c969" : "#5d8dd6"} fillOpacity={index === 1 ? ".74" : ".22"} />
              <text x={247 + index * 220} y="238" textAnchor="middle" fontSize="28" fill={index === 1 ? "#071721" : "#dff2ff"}>{text}</text>
            </g>
          ))}
        </g>
        <path d="M0 418q170-58 340 0t340 0t340 0t180 0v62H0Z" fill="#07131f" />
      </SceneShell>
      <WorldLabel>KNOWLEDGE HALL</WorldLabel>
    </>
  );
}

function MosqueWorld() {
  return (
    <>
      <SceneShell topGlow="#f3c969">
        <Stars accent="#fff4cb" />
        <rect y="322" width="1200" height="158" fill="#07151c" />
        {[70, 285, 500, 720, 940].map((x) => (
          <g key={x}>
            <rect x={x} y="196" width="118" height="126" rx="24" fill="#10323c" stroke="#f3c969" strokeOpacity=".16" strokeWidth="4" />
            <path d={`M${x + 16} 196q43-85 86 0Z`} fill="#0d2933" stroke="#f3c969" strokeOpacity=".14" strokeWidth="4" />
            <WindowGlow x={x + 36} y={224} w={46} h={70} />
          </g>
        ))}
        <rect x="112" y="145" width="22" height="176" rx="11" fill="#0b2630" />
        <path d="M91 145q32-44 64 0" fill="#0b2630" />
        <rect x="1060" y="145" width="22" height="176" rx="11" fill="#0b2630" />
        <path d="M1038 145q32-44 64 0" fill="#0b2630" />
        <circle cx="597" cy="96" r="30" fill="#f3c969" fillOpacity=".75" />
        <path d="M0 404h1200" stroke="#5fd1a6" strokeOpacity=".18" strokeWidth="8" />
      </SceneShell>
      <WorldLabel>MOSQUE COURTYARD</WorldLabel>
    </>
  );
}

function RoadWorld() {
  return (
    <>
      <SceneShell topGlow="#5fd1a6">
        <Stars accent="#fff4cb" />
        <path d="M250 0h700l130 480H120Z" fill="#17262c" />
        <path d="M480 0h240l44 480H436Z" fill="#253238" />
        <path d="M596 0v480" stroke="#f3c969" strokeOpacity=".34" strokeWidth="8" strokeDasharray="28 24" />
        <path d="M300 480l80-480M900 480L820 0" stroke="#5fd1a6" strokeOpacity=".18" strokeWidth="8" />
        {[80, 250, 990, 1110].map((x, i) => (
          <g key={x}>
            <rect x={x} y="180" width="20" height="165" rx="10" fill="#0b2b32" />
            <rect x={x - 8} y="176" width="36" height="22" rx="11" fill={i % 2 === 0 ? "#f3c969" : "#5fd1a6"} fillOpacity=".7" />
          </g>
        ))}
        <path d="M0 430q180-58 360 0t360 0t360 0t120 0v50H0Z" fill="#07131a" />
      </SceneShell>
      <WorldLabel>ROAD OF CHOICES</WorldLabel>
    </>
  );
}

function JumpWorld() {
  return (
    <>
      <SceneShell topGlow="#8ab6e2">
        <Stars accent="#fff4cb" />
        <circle cx="1000" cy="76" r="48" fill="#f3c969" fillOpacity=".78" />
        <circle cx="1020" cy="58" r="44" fill="#29345c" />
        {[[100, 350, 180], [310, 300, 220], [550, 365, 180], [770, 276, 220], [1010, 338, 150]].map(([x, y, w], index) => (
          <g key={index}>
            <rect x={x} y={y} width={w} height="22" rx="11" fill={index === 3 ? "#f3c969" : "#5fd1a6"} fillOpacity=".82" />
            <rect x={x + 16} y={y + 22} width={w - 32} height="12" rx="6" fill="#091b22" />
          </g>
        ))}
        <path d="M0 428q170-64 340 0t340 0t340 0t180 0v52H0Z" fill="#061118" />
      </SceneShell>
      <WorldLabel>STAR PLATFORMS</WorldLabel>
    </>
  );
}

function GoodDeedsWorld() {
  return (
    <>
      <SceneShell topGlow="#d7a7e8">
        <Stars accent="#fff4cb" />
        <path d="M0 360q140-74 280 0t280 0t280 0t280 0t80 0v120H0Z" fill="#17372f" />
        <path d="M0 402q120-56 240 0t240 0t240 0t240 0t240 0v78H0Z" fill="#0b221d" />
        {[120, 380, 650, 920].map((x, i) => (
          <g key={x}>
            <circle cx={x} cy={304} r="34" fill={i % 2 === 0 ? "#5fd1a6" : "#d7a7e8"} fillOpacity=".35" />
            <path d={`M${x - 46} 366q46-68 92 0`} stroke={i % 2 === 0 ? "#5fd1a6" : "#d7a7e8"} strokeOpacity=".4" strokeWidth="18" strokeLinecap="round" />
          </g>
        ))}
        <circle cx="600" cy="116" r="50" fill="#f3c969" fillOpacity=".28" />
        <path d="M565 116h70M600 81v70" stroke="#f3c969" strokeOpacity=".65" strokeWidth="8" strokeLinecap="round" />
      </SceneShell>
      <WorldLabel>GOOD DEEDS VILLAGE</WorldLabel>
    </>
  );
}

function HilalWorld() {
  return (
    <>
      <SceneShell topGlow="#6b9cff">
        <Stars accent="#fff4cb" />
        <circle cx="1000" cy="100" r="70" fill="#f3c969" fillOpacity=".9" />
        <circle cx="1030" cy="82" r="62" fill="#101c49" />
        {[[150,110],[290,180],[470,88],[660,156],[830,92]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 2 === 0 ? 28 : 18} fill="#ffffff" fillOpacity=".05" />
        ))}
        <path d="M80 350q140-90 280 0t280 0t280 0t200 0" fill="none" stroke="#6b9cff" strokeOpacity=".2" strokeWidth="40" strokeLinecap="round" />
        <path d="M0 430q160-58 320 0t320 0t320 0t240 0v50H0Z" fill="#07101f" />
      </SceneShell>
      <WorldLabel>HILAL SKY</WorldLabel>
    </>
  );
}

function CleanupWorld() {
  return (
    <>
      <SceneShell topGlow="#5fd1a6">
        <Stars accent="#fff4cb" />
        <rect x="100" y="118" width="1000" height="250" rx="42" fill="#0a2525" stroke="#5fd1a6" strokeOpacity=".16" strokeWidth="4" />
        {[170, 390, 610, 830].map((x, i) => (
          <g key={x}>
            <rect x={x} y="184" width="112" height="110" rx="24" fill={i % 2 === 0 ? "#f3c969" : "#69c7ec"} fillOpacity=".15" stroke={i % 2 === 0 ? "#f3c969" : "#69c7ec"} strokeOpacity=".25" strokeWidth="3" />
            <text x={x + 56} y="250" textAnchor="middle" fontSize="38" fill="#fff4cb">{i % 2 === 0 ? "⌂" : "✦"}</text>
          </g>
        ))}
        <path d="M130 396h940" stroke="#5fd1a6" strokeOpacity=".4" strokeWidth="12" strokeLinecap="round" />
        <path d="M130 420h940" stroke="#5fd1a6" strokeOpacity=".1" strokeWidth="28" strokeLinecap="round" />
      </SceneShell>
      <WorldLabel>CLEAN & ORGANIZE</WorldLabel>
    </>
  );
}

function ColoringWorld() {
  return (
    <>
      <SceneShell topGlow="#f26e9a">
        <Stars accent="#fff4cb" />
        <rect x="100" y="86" width="620" height="288" rx="40" fill="#0a2029" stroke="#f3c969" strokeOpacity=".2" strokeWidth="4" />
        <circle cx="852" cy="160" r="46" fill="#f26e9a" fillOpacity=".74" />
        <circle cx="970" cy="212" r="52" fill="#72d0ae" fillOpacity=".74" />
        <circle cx="880" cy="286" r="42" fill="#72b9ee" fillOpacity=".74" />
        <circle cx="1045" cy="100" r="34" fill="#d7a7e8" fillOpacity=".76" />
        <path d="M170 310q120-160 240 0q130-160 240 0" fill="none" stroke="#f3c969" strokeOpacity=".5" strokeWidth="10" strokeLinecap="round" />
        <path d="M0 430q180-60 360 0t360 0t360 0t120 0v50H0Z" fill="#08151c" />
      </SceneShell>
      <WorldLabel>CREATIVE STUDIO</WorldLabel>
    </>
  );
}

export function KidsGameWorld({ gameId }: { gameId: GameId }) {
  switch (gameId) {
    case "zikr-runner":
      return <RunnerWorld />;
    case "zikr-memory":
      return <MemoryWorld />;
    case "wudu-challenge":
      return <WuduWorld />;
    case "verse-puzzle":
      return <VerseWorld />;
    case "zikr-quiz":
      return <QuizWorld />;
    case "mosque-adventure":
      return <MosqueWorld />;
    case "zikr-road":
      return <RoadWorld />;
    case "zikr-jump":
      return <JumpWorld />;
    case "good-deeds":
      return <GoodDeedsWorld />;
    case "hilal-fly":
      return <HilalWorld />;
    case "mosque-cleanup":
      return <CleanupWorld />;
    case "zikr-coloring":
      return <ColoringWorld />;
    default:
      return null;
  }
}

export function GameObjectiveBadge({
  title,
  value,
  completed = false,
}: {
  title: string;
  value: string;
  completed?: boolean;
}) {
  return (
    <div className={
      "rounded-2xl border px-3 py-2 backdrop-blur-sm " +
      (completed
        ? "border-brand-emerald/25 bg-brand-emerald/10 text-brand-emerald"
        : "border-brand-gold/20 bg-black/20 text-brand-cream/65")
    }>
      <span className="block text-[10px] font-black tracking-[.14em] text-brand-gold/65">{title}</span>
      <strong className="mt-0.5 block text-xs">{value}</strong>
    </div>
  );
}
