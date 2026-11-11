// Root ESLint flat config for the whole pnpm workspace.
// ESLint 9+ uses this format by default; each package runs `eslint .` and
// resolves this config by walking up to the repo root.

import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/coverage/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "**/next-env.d.ts",
    ],
  },

  // Plain JS files (Node scripts)
  {
    files: ["**/*.{js,mjs,cjs}"],
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
      },
    },
  },

  // TypeScript files
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // Keep the build useful: unused symbols are surfaced but do not fail CI.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Tests may use patterns that are noisy in production code.
  {
    files: [
      "**/__tests__/**",
      "**/*.test.{ts,tsx}",
      "**/e2e/**",
      "**/vitest.config.*",
      "**/playwright.config.*",
      "**/tailwind.config.*",
      "**/next.config.*",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  }
);
