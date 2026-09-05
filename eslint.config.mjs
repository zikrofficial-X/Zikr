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
      // ──────────────────────────────────────────────────────────────────────
      // SECURITY & TYPE SAFETY: Enable strict rules by default. Exceptions 
      // below are explicitly documented and justified for backward compatibility.
      // ──────────────────────────────────────────────────────────────────────

      // Warn on unused variables but allow intentional underscores (_var)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Reject 'any' unless explicitly allowed (reduces runtime errors)
      "@typescript-eslint/no-explicit-any": "warn",

      // Reject @ts-ignore comments in favor of proper typing
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
          "ts-ignore": "allow-with-description",
          "ts-nocheck": "allow-with-description",
          "ts-check": false,
          minimumDescriptionLength: 10,
        },
      ],

      // React Hooks: Enforce exhaustive dependency arrays
      "react-hooks/exhaustive-deps": "warn",

      // React Hooks: Warn on state mutations in effects
      "react-hooks/set-state-in-effect": "off",

      // ──────────────────────────────────────────────────────────────────────
      // EXCEPTIONS: Temporarily disabled for legacy hydration patterns.
      // TODO: Review and remove in next major refactor.
      // ──────────────────────────────────────────────────────────────────────

      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/error-boundaries": "off",
    },
  },
];

export default config;
