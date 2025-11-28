import js from "@eslint/js";
import eslintPluginJsonc from 'eslint-plugin-jsonc';
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";

export default [
  js.configs.recommended,
  ...eslintPluginJsonc.configs["flat/recommended-with-jsonc"],
  {
    ignores: ["dist/**", "global.d.ts", "docs/**", "build/**"],
  },
  {
    files: ["**/*.{js,ts}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: {
          jsx: false,
        },
      },
      globals: {
        ...globals.node,
        Bun: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      prettier: prettier,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "prettier/prettier": "error",
      "no-unused-vars": "off",
      "simple-import-sort/imports": [
        "error",
        {
          groups: [["^\\u0000", "^@?\\w", "^[^.]", "^\\."]],
        },
      ],
      "simple-import-sort/exports": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["**/*.json"],
    plugins: {
      prettier: prettier,
    },
    rules: {
      "prettier/prettier": "error",
    }
  }
];
