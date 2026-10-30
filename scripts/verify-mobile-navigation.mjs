import { readFile } from "node:fs/promises";

const source = await readFile("src/components/layout/mobile-nav.tsx", "utf8");
const requirements = [
  ['dialog semantics', 'role="dialog"'],
  ['modal state', 'aria-modal="true"'],
  ['labelled dialog', ['aria-labelledby="zikr-mobile-nav-title"', 'aria-labelledby="mobile-navigation-dialog-title"']],
  ['dialog control relationship', ['aria-controls="zikr-mobile-navigation-dialog"', 'aria-controls="mobile-navigation-dialog"']],
  ['dynamic viewport sizing', 'h-[100dvh]'],
  ['keyboard focus trap', 'event.key !== "Tab"'],
  ['Escape dismissal', 'event.key === "Escape"'],
  ['focus restoration', ['menuButtonRef.current.focus()', 'menuButton.focus()']],
  ['body scroll lock', 'document.body.style.overflow = "hidden"'],
  ['scrollable drawer content', 'overflow-y-auto overscroll-contain'],
  ['desktop breakpoint cleanup', 'window.matchMedia("(min-width: 1024px)")'],
  ['focus restoration guard', ['menuButtonRef.current.offsetParent !== null', 'menuButton.offsetParent !== null']],
  // The trigger must come from the ref (captured at effect start is fine), never from a DOM query.
  ['trigger ref capture', ['const menuButton = menuButtonRef.current', 'menuButtonRef.current']],
];

const failures = requirements.filter(([, token]) =>
  Array.isArray(token) ? !token.some((candidate) => source.includes(candidate)) : !source.includes(token),
);
if (failures.length) {
  console.error("Mobile navigation contract failed:");
  for (const [label] of failures) console.error(`- Missing ${label}`);
  process.exit(1);
}

console.log("Mobile navigation contract passed.");
