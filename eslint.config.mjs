import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const ignores = [
  ".next/**",
  "node_modules/**",
  "dist/**",
  "out/**",
  "coverage/**",
  "android/**",
  "ios/**",
  "public/sw.js",
  "supabase/migrations/**",
  "supabase/migrations_archive/**",
];

const config = [
  { ignores },
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      // Keep deployment logs actionable by failing on true errors while avoiding
      // noisy warnings from legacy client hydration patterns and content strings.
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/error-boundaries": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
];

export default config;
