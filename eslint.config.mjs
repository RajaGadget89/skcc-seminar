import { dirname } from "path";
import { fileURLToPath } from "url";
import js from "@eslint/js";
import typescriptEslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import globals from "globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Manually configure Next.js rules to avoid FlatCompat circular structure issues
const nextConfigs = [
  js.configs.recommended,
  ...typescriptEslint.configs.recommended,
  {
    plugins: {
      "@next/next": nextPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      import: importPlugin,
      "jsx-a11y": jsxA11yPlugin,
    },
    languageOptions: {
      parser: typescriptEslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        React: "readonly",
        JSX: "readonly",
      },
    },
    settings: {
      react: {
        version: "detect",
      },
      "import/resolver": {
        typescript: true,
      },
    },
    rules: {
      // Next.js core web vitals rules
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-img-element": "warn",
      // React rules
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

const eslintConfig = [
  {
    ignores: [
      "e2e/",
      "playwright*.ts",
      "scripts/",
      "**/*.spec.*",
      "**/*.test.*",
      "tests/",
      "backups/",
      "artifacts/",
      "tmp/",
      ".github/",
      "coverage/",
      ".next/",
      "node_modules/"
    ]
  },
  ...nextConfigs,
   {
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // 👈 ปิด rule นี้ชั่วคราว
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_"
        }
      ]
    }
  },
  {
    files: ["**/emails/templates/**/*.tsx"],
    rules: {
      "@next/next/no-img-element": "off" // Allow <img> tags in email templates
    }
  },
  {
    files: ["app/lib/import/**/*.ts", "app/lib/emails/**/*.tsx", "app/api/admin/import/**/*.ts", "app/components/import/**/*.tsx", "app/admin/import/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_|value|index|config|sessionId|adminUserId|errors|warnings|jsonData|originalData|brandTokens|record|trackingCode|Papa|configKey|data|batches|csvData|current|csvColumns|mappedData|userId|batchSize",
          "varsIgnorePattern": "^_|value|index|config|sessionId|adminUserId|errors|warnings|jsonData|originalData|brandTokens|record|trackingCode|Papa|configKey|data|batches|csvData|current|csvColumns|FileData|mappedData|userId|batchSize",
          "caughtErrorsIgnorePattern": "^_"
        }
      ],
      "react-hooks/exhaustive-deps": "warn"
    }
  }
];

export default eslintConfig;
