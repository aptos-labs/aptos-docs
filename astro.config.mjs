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

const env = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");
const ALGOLIA_APP_ID = env.ALGOLIA_APP_ID;
const ALGOLIA_SEARCH_API_KEY = env.ALGOLIA_SEARCH_API_KEY;
const ALGOLIA_INDEX_NAME = env.ALGOLIA_INDEX_NAME;

const hasAlgoliaConfig = ALGOLIA_APP_ID && ALGOLIA_SEARCH_API_KEY && ALGOLIA_INDEX_NAME;

// https://astro.build/config
export default defineConfig({
  site:
    process.env.VERCEL_ENV === "production"
      ? "https://aptos-docs-astro.vercel.app"
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:4321",
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
        shiki: {
          // Define langs for shiki syntax highlighting
          langAlias: {
            Move: "move",
            move: "move",
            PowerShell: "powershell",
            terraform: "terraform",
          },
        },
      },
      defaultLocale: "root", // optional
      locales: {
        root: {
          label: "English",
          lang: "en", // lang is required for root locales
        },
        // Simplified Chinese docs in `src/content/docs/zh/`
        zh: {
          label: "简体中文",
          lang: "zh",
        },
      },
      social: {
        github: "https://github.com/aptos-labs/",
      },
      components: {
        Head: "./src/starlight-overrides/Head.astro",
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
        // Generate the OpenAPI documentation pages.
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
      ],
      sidebar: [
        // {
        //   label: "Guides",
        //   items: [
        //     // Each item here is one entry in the navigation menu.
        //     { label: "Example Guide", slug: "guides/example" },
        //   ],
        // },
        // {
        //   label: "Reference",
        //   autogenerate: { directory: "reference" },
        // },
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

        ...openAPISidebarGroups,
      ],
      customCss: ["./src/globals.css", "katex/dist/katex.min.css"],
    }),
  ],
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  env: {
    schema: {
      ALGOLIA_APP_ID: envField.string({ context: "client", access: "public" }),
      ALGOLIA_SEARCH_API_KEY: envField.string({
        context: "client",
        access: "public",
      }),
      ALGOLIA_INDEX_NAME: envField.string({ context: "client", access: "public" }),
    },
  },
});
