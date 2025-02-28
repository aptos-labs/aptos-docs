// @ts-check
import { defineConfig, envField } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import starlightOpenAPI, { openAPISidebarGroups } from "starlight-openapi";
import starlightDocSearch from "@astrojs/starlight-docsearch";

import vercel from "@astrojs/vercel";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { loadEnv } from "vite";
import rehypeRaw from "rehype-raw";
import sitemap from "@astrojs/sitemap";
import partytown from "@astrojs/partytown";
import node from "@astrojs/node";
import solidJs from "@astrojs/solid-js";
import { getEnvsSchema } from "./src/lib/og-image/schema.mjs";
import { SUPPORTED_LANGUAGES } from "./src/config/locales";
// import { isMoveReferenceEnabled } from "./src/utils/isMoveReferenceEnabled";

// import rehypeAddDebug from './src/plugins/rehype-add-debug.js';

const env = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");
const ALGOLIA_APP_ID = env.ALGOLIA_APP_ID;
const ALGOLIA_SEARCH_API_KEY = env.ALGOLIA_SEARCH_API_KEY;
const ALGOLIA_INDEX_NAME = env.ALGOLIA_INDEX_NAME;
const ENABLE_API_REFERENCE = env.ENABLE_API_REFERENCE;

const hasAlgoliaConfig = ALGOLIA_APP_ID && ALGOLIA_SEARCH_API_KEY && ALGOLIA_INDEX_NAME;
const enableApiReference = ENABLE_API_REFERENCE === "true";

// https://astro.build/config
export default defineConfig({
  site:
    process.env.VERCEL_ENV === "production"
      ? "https://aptos-docs-astro.vercel.app"
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:4321",
  trailingSlash: "never",
  integrations: [
    starlight({
      title: "Aptos Developer Docs",
      logo: {
        light: "~/assets/aptos-logomark-light.svg",
        dark: "~/assets/aptos-logomark-dark.svg",
        replacesTitle: true,
      },
      editLink: {
        baseUrl: "https://github.com/aptos-labs/developer-docs/edit/main/",
      },
      lastUpdated: true,
      expressiveCode: {
        themes: ["github-dark-default"],
        shiki: {
          // Define langs for shiki syntax highlighting
          langAlias: {
            csharp: "csharp",
            go: "go",
            json: "json",
            kotlin: "kotlin",
            move: "move",
            powershell: "powershell",
            python: "python",
            rust: "rust",
            swift: "swift",
            terraform: "terraform",
            toml: "toml",
            tsx: "tsx",
            yaml: "yaml",
          },
        },
      },
      defaultLocale: "root", // optional
      locales: Object.fromEntries(
        SUPPORTED_LANGUAGES.map(({ code, label }) => [
          code === "en" ? "root" : code, // Use "root" for English
          { label, lang: code },
        ]),
      ),
      social: {
        github: "https://github.com/aptos-labs/",
      },
      components: {
        Head: "./src/starlight-overrides/Head.astro",
        PageFrame: "./src/starlight-overrides/PageFrame.astro",
        PageSidebar: "./src/starlight-overrides/PageSidebar.astro",
        PageTitle: "./src/starlight-overrides/PageTitle.astro",
      },
      plugins: [
        ...(hasAlgoliaConfig
          ? [
              starlightDocSearch({
                clientOptionsModule: "./src/config/docsearch.ts",
              }),
            ]
          : []),
        // Generate the OpenAPI documentation pages if enabled
        ...(enableApiReference
          ? [
              starlightOpenAPI(
                [
                  {
                    base: "api-reference",
                    label: "API Reference",
                    schema: "./aptos-spec.json",
                    sidebarMethodBadges: true,
                  },
                ],
                {
                  routeEntrypoint: "./src/components/OpenAPI/Route.astro",
                },
              ),
            ]
          : []),
      ],
      sidebar: [
        {
          label: "Build",
          collapsed: true,
          autogenerate: { directory: "build" },
        },
        {
          label: "Network",
          collapsed: true,
          autogenerate: { directory: "network" },
        },
        { label: "Move Reference", link: "/move-reference/" },
        ...(process.env.ENABLE_API_REFERENCE === "true" ? openAPISidebarGroups : []),
      ],
      customCss: ["./src/globals.css", "katex/dist/katex.min.css"],
    }),
    sitemap({
      serialize(item) {
        item.lastmod = new Date().toISOString();
        return item;
      },
      i18n: {
        defaultLocale: "en",
        locales: {
          en: "en",
          zh: "zh",
          ja: "ja",
        },
      },
    }),
    partytown({
      config: {
        forward: ["dataLayer.push", "gtag"],
      },
    }),
    solidJs({ devtools: process.env.NODE_ENV !== "production" }),
  ],
  adapter: process.env.VERCEL
    ? vercel()
    : node({
        mode: "standalone",
      }),
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["@rollup/browser"],
    },
  },
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeRaw, rehypeKatex],
  },
  prefetch: true,
  env: {
    schema: {
      ...getEnvsSchema(),
      ALGOLIA_APP_ID: envField.string({
        context: "client",
        access: "public",
        optional: !hasAlgoliaConfig,
      }),
      ALGOLIA_SEARCH_API_KEY: envField.string({
        context: "client",
        access: "public",
        optional: !hasAlgoliaConfig,
      }),
      ALGOLIA_INDEX_NAME: envField.string({
        context: "client",
        access: "public",
        optional: !hasAlgoliaConfig,
      }),
      GITHUB_TOKEN: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      GTAG_ID: envField.string({ context: "client", access: "public", optional: true }),
      ENABLE_API_REFERENCE: envField.string({
        context: "server",
        access: "public",
        optional: true,
        default: "false",
      }),
      ENABLE_MOVE_REFERENCE: envField.string({
        context: "server",
        access: "public",
        optional: true,
        default: "false",
      }),
    },
    validateSecrets: true,
  },
  redirects: {
    /**
     * Development-only redirects when Move Reference is disabled
     * NOTE: Use caution - 301 redirects may be cached by browsers
     * TODO: Needs further testing
     */
    // ...isMoveReferenceEnabled() ? {} : {
    //   "/move-reference/[network]": "/move-reference",
    //   "/move-reference/[network]/[framework]": "/move-reference",
    //   "/move-reference/[network]/[framework]/[slug]": "/move-reference",
    // },
  },
});
