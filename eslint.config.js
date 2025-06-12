import process from "node:process";
import gitignore from "eslint-config-flat-gitignore";
import js from "@eslint/js";
import globals from "globals";
import astroESLintParser from "astro-eslint-parser";
import prettierConfig from "eslint-config-prettier";
import pluginImportX from "eslint-plugin-import-x";
import pluginAstro from "eslint-plugin-astro";
import pluginJSXA11y from "eslint-plugin-jsx-a11y";
import pluginTypeScript from "typescript-eslint";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";

/**
 * @type {import('eslint').Linter.Config}
 */
const config = [
  // Ignores
  gitignore({ strict: false }),
  {
    ignores: [
      "**/.astro",
      "**/.vercel",
      "**/coverage",
      "**/dist",
      "**/node_modules",
      "**/package-lock.json",
      "**/pnpm-lock.yaml",
      "**/public",
      "**/scripts/migration",
      "**/nextra-migration",
      "middleware.js", // Ignore the generated middleware file
    ],
  },

  // Imports
  {
    plugins: {
      "import-x": pluginImportX,
    },
    rules: {
      "import-x/export": "error",
      "import-x/first": "error",
      "import-x/named": "error",
      "import-x/no-anonymous-default-export": "error",
      "import-x/no-duplicates": "warn",
      "import-x/no-mutable-exports": "error",
      "import-x/no-named-default": "error",
      "import-x/no-self-import": "error",
      "import-x/no-webpack-loader-syntax": "error",
      "import-x/order": "error",
    },
  },

  // Javascript
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        document: "readonly",
        navigator: "readonly",
        window: "readonly",
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2024,
        sourceType: "module",
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
  },

  // Typescript
  ...pluginTypeScript.config(
    pluginTypeScript.configs.strictTypeChecked,
    pluginTypeScript.configs.stylisticTypeChecked,
    {
      ...pluginImportX.configs.typescript,
      settings: {
        ...pluginImportX.configs.typescript.settings,
        "import/resolver-next": [
          createTypeScriptImportResolver({
            alwaysTryTypes: true,
          }),
        ],
      },
    },
    {
      languageOptions: {
        parserOptions: {
          project: ["tsconfig.json"],
          tsconfigRootDir: process.cwd(),
          warnOnUnsupportedTypeScriptVersion: false,
        },
      },
      rules: {
        "no-use-before-define": "off",
        "no-dupe-class-members": "off",
        "no-redeclare": "off",

        "@typescript-eslint/consistent-type-imports": [
          "error",
          {
            prefer: "type-imports",
            disallowTypeAnnotations: false,
            fixStyle: "inline-type-imports",
          },
        ],
        "@typescript-eslint/no-namespace": [
          "error",
          { allowDeclarations: true, allowDefinitionFiles: true },
        ],
        // There is a bug when this rule works incorrectly, so disable it till it is fixed
        // https://github.com/typescript-eslint/typescript-eslint/issues/6314
        "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: false }],
        // https://www.totaltypescript.com/method-shorthand-syntax-considered-harmful
        "@typescript-eslint/method-signature-style": ["error", "property"],
      },
    },
    {
      files: ["**/*.d.ts"],
      rules: {
        "no-var": "off",
        "@typescript-eslint/triple-slash-reference": "off",
        "import-x/no-duplicates": "off",
      },
    },
    {
      files: ["**/*.?(c|m)js", "vite.config.ts", "vitest.config.ts"],
      rules: {
        ...pluginTypeScript.configs.disableTypeChecked.rules,
      },
    },
    {
      files: ["**/*.?(c|m)js"],
      name: "typescript:javascript-overrides",
      rules: {
        "@typescript-eslint/no-require-imports": "off",
        "@typescript-eslint/no-var-requires": "off",
      },
    },
    {
      files: ["scripts/**/*.ts", "scripts/**/*.js"],
      name: "typescript:scripts-overrides",
      languageOptions: {
        parserOptions: {
          project: false,
        },
      },
      rules: {
        ...pluginTypeScript.configs.disableTypeChecked.rules,
        "@typescript-eslint/no-require-imports": "off",
        "@typescript-eslint/no-var-requires": "off",
      },
    },
    {
      files: ["*.mjs", "*.cjs"],
      name: "typescript:config-files-overrides",
      languageOptions: {
        parserOptions: {
          project: false,
        },
      },
      rules: {
        ...pluginTypeScript.configs.disableTypeChecked.rules,
        "@typescript-eslint/no-require-imports": "off",
        "@typescript-eslint/no-var-requires": "off",
      },
    },
  ),

  // Astro
  {
    files: ["**/*.astro"],
    languageOptions: {
      globals: {
        "astro/astro": true,
      },
      parser: astroESLintParser,
      parserOptions: {
        extraFileExtensions: [".astro"],
        parser: pluginTypeScript.parser,
        project: false,
        sourceType: "module",
      },
    },
    plugins: {
      astro: pluginAstro,
      "jsx-a11y": pluginJSXA11y,
    },
    processor: "astro/client-side-ts",
    rules: {
      ...pluginAstro.configs.recommended.rules,
      ...pluginAstro.configs["jsx-a11y-recommended"].rules,
      ...pluginTypeScript.configs.disableTypeChecked.rules,
    },
  },
  {
    // Configuration for `<script>` tag in `.astro` files.
    files: ["**/*.astro/*.js"],
  },
  {
    // Configuration for `<script>` tag using TypeScript in `.astro` files.
    files: ["**/*.astro/*.ts"],
    languageOptions: {
      parser: pluginTypeScript.parser,
      parserOptions: {
        project: false,
      },
    },
    rules: {
      ...pluginTypeScript.configs.disableTypeChecked.rules,
    },
  },

  // Prettier
  prettierConfig,
];

export default config;
