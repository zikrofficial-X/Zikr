import { readFile } from "node:fs/promises";

const source = await readFile("src/components/layout/mobile-nav.tsx", "utf8");
const requirements = [
  ['dialog semantics', 'role="dialog"'],
  ['modal state', 'aria-modal="true"'],
  ['labelled dialog', 'aria-labelledby="zikr-mobile-nav-title"'],
  ['dialog control relationship', 'aria-controls="zikr-mobile-navigation-dialog"'],
  ['dynamic viewport sizing', 'h-[100dvh]'],
  ['keyboard focus trap', 'event.key !== "Tab"'],
  ['Escape dismissal', 'event.key === "Escape"'],
  ['focus restoration', 'menuButtonRef.current?.focus()'],
  ['body scroll lock', 'document.body.style.overflow = "hidden"'],
  ['scrollable drawer content', 'overflow-y-auto overscroll-contain'],
  ['desktop breakpoint cleanup', 'window.matchMedia("(min-width: 1024px)")'],
  ['focus restoration guard', 'menuButtonRef.current.offsetParent !== null'],
];

const failures = requirements.filter(([, token]) => !source.includes(token));
if (failures.length) {
  console.error("Mobile navigation contract failed:");
  for (const [label] of failures) console.error(`- Missing ${label}`);
  process.exit(1);
}

console.log("Mobile navigation contract passed.");
