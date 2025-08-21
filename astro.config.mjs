// @ts-check
import { fileURLToPath } from "url";
import { defineConfig, envField } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import starlightOpenAPI from "starlight-openapi";
import starlightDocSearch from "@astrojs/starlight-docsearch";

import vercel from "@astrojs/vercel";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import sitemap from "@astrojs/sitemap";
import partytown from "@astrojs/partytown";
import node from "@astrojs/node";
import react from "@astrojs/react";
import starlightLlmsTxt from "starlight-llms-txt";
import favicons from "astro-favicons";
import icon from "astro-icon";
import { sidebar } from "./astro.sidebar.ts";
import { ENV } from "./src/lib/env";
import { ogImagesIntegration } from "./src/integrations/ogImages";
import { SUPPORTED_LANGUAGES, SITE_TITLES } from "./src/config/18n";
import { firebaseIntegration } from "./src/integrations/firebase";
import { remarkClientOnly } from "./src/plugins";
import { devServerFileWatcher } from "./src/integrations/dev-server-file-watcher";
// import { isMoveReferenceEnabled } from "./src/utils/isMoveReferenceEnabled";
// import { rehypeAddDebug } from "./src/plugins";

const ALGOLIA_APP_ID = ENV.ALGOLIA_APP_ID;
const ALGOLIA_SEARCH_API_KEY = ENV.ALGOLIA_SEARCH_API_KEY;
const ALGOLIA_INDEX_NAME = ENV.ALGOLIA_INDEX_NAME;

const hasAlgoliaConfig = ALGOLIA_APP_ID && ALGOLIA_SEARCH_API_KEY && ALGOLIA_INDEX_NAME;
const enableApiReference = true;

// https://astro.build/config
export default defineConfig({
  site:
    ENV.VERCEL_ENV === "production"
      ? "https://aptos.dev"
      : ENV.VERCEL_URL
        ? `https://${ENV.VERCEL_URL}`
        : "http://localhost:4321",
  trailingSlash: "never",
  integrations: [
    // Only include devServerFileWatcher in development mode
    ...(process.env.NODE_ENV === "development" || !process.env.VERCEL
      ? [
          devServerFileWatcher([
            "./integrations/*", // Custom integrations
            "./astro.sidebar.ts", // Sidebar configuration file
            "./src/content/nav/*.ts", // Sidebar labels
          ]),
        ]
      : []),
    ogImagesIntegration(),
    firebaseIntegration(),
    starlight({
      title: SITE_TITLES,
      logo: {
        light: "~/assets/aptos-logomark-light.svg",
        dark: "~/assets/aptos-logomark-dark.svg",
        replacesTitle: false,
      },
      editLink: {
        baseUrl: "https://github.com/aptos-labs/aptos-docs/edit/main/",
      },
      lastUpdated: true,
      expressiveCode: {
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
      social: [
        { label: "GitHub", icon: "github", href: "https://github.com/aptos-labs" },
        { label: "X", icon: "x.com", href: "https://x.com/aptos" },
        { label: "Discord", icon: "discord", href: "https://discord.com/invite/aptosnetwork" },
        //{ label: "Forum", icon: "discourse", href: "https://forum.aptosfoundation.org" },
        //{ label: "Reddit", icon: "reddit", href: "https://www.reddit.com/r/Aptos" },
        { label: "Telegram", icon: "telegram", href: "https://t.me/aptos" },
      ],
      components: {
        Head: "./src/starlight-overrides/Head.astro",
        // Header: "./src/starlight-overrides/Header.astro",
        LanguageSelect: "./src/starlight-overrides/LanguageSelect.astro",
        MobileMenuToggle: "./src/starlight-overrides/MobileMenuToggle.astro",
        PageFrame: "./src/starlight-overrides/PageFrame.astro",
        PageSidebar: "./src/starlight-overrides/PageSidebar.astro",
        PageTitle: "./src/starlight-overrides/PageTitle.astro",
        Sidebar: "./src/starlight-overrides/Sidebar.astro",
      },
      plugins: [
        starlightLlmsTxt({
          promote: ["index*", "get-started"],
          demote: ["404"],
          exclude: ["404"],
        }),
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
                    base: "rest-api",
                    label: "REST API Reference",
                    schema: "./public/aptos-spec.json",
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
      sidebar,
      customCss: ["./src/styles/global.css", "katex/dist/katex.min.css"],
    }),
    sitemap({
      serialize(item) {
        item.lastmod = new Date().toISOString();
        return item;
      },
      i18n: {
        defaultLocale: SUPPORTED_LANGUAGES.find((lang) => lang.default)?.code || "en",
        locales: Object.fromEntries(SUPPORTED_LANGUAGES.map(({ code }) => [code, code])),
      },
    }),
    partytown({
      config: {
        forward: ["dataLayer.push", "gtag"],
      },
    }),
    react({
      experimentalReactChildren: true,
      include: ["**/GraphQLEditor.tsx"],
    }),
    favicons({
      name: "Aptos Docs",
      name_localized: SITE_TITLES,
      short_name: "Aptos",
      icons: {
        android: true,
        appleIcon: true,
        appleStartup: true,
        favicons: false,
        windows: true,
        yandex: true,
      },
    }),
    icon({
      include: {
        ph: [
          "rocket-launch",
          "hard-drives",
          "crane-tower",
          "brackets-curly",
          "file-text",
          "book-open",
          "circle-dashed",
          "lightning",
          "terminal",
          "globe-simple",
          "robot",
        ],
      },
    }),
  ],
  adapter: process.env.VERCEL
    ? vercel({
        edgeMiddleware: false,
        imageService: true,
        imagesConfig: {
          domains: [],
          sizes: [320, 640, 1280],
          formats: ["image/avif", "image/webp"],
        },
      })
    : node({
        mode: "standalone",
      }),
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["@rollup/browser"],
    },
    resolve: {
      alias: {
        "~/images": fileURLToPath(new URL("./src/assets/images", import.meta.url)),
      },
    },
  },
  markdown: {
    remarkPlugins: [
      remarkMath,
      [
        remarkClientOnly,
        {
          components: {
            GraphQLEditor: "react",
            Faucet: "react",
          },
        },
      ],
    ],
    rehypePlugins: [rehypeRaw, rehypeKatex],
  },
  prefetch: true,
  image: {
    domains: ["preview.aptos.dev", "aptos.dev"],
    remotePatterns: [{ protocol: "https" }],
  },
  env: {
    schema: {
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
        default: "true",
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
  experimental: {
    fonts: [
      {
        provider: "local",
        name: "Atkinson Hyperlegible Next",
        cssVariable: "--font-atkinson-hyperlegible-next",
        variants: [
          {
            weight: "100 900",
            style: "normal",
            src: ["./src/assets/fonts/AtkinsonHyperlegibleNext-VariableFont_wght.woff2"],
            variationSettings: "'wght' 400",
            display: "swap",
          },
          {
            weight: "100 900",
            style: "italic",
            src: ["./src/assets/fonts/AtkinsonHyperlegibleNext-Italic-VariableFont_wght.woff2"],
            variationSettings: "'wght' 400",
            display: "swap",
          },
        ],
      },
    ],
  },
  redirects: {
    /**
     * Development-only redirects when Move Reference is disabled
     * NOTE: Use caution - 301 redirects may be cached by browsers
     * TODO: Needs further testing
     */
    // ...isMoveReferenceEnabled() ? {} : {
    //   "/move-reference/[network]": { src: "/move-reference/[network]", destination: "/move-reference", status: 301 },
    //   "/move-reference/[network]/[framework]": { src: "/move-reference/[network]/[framework]", destination: "/move-reference", status: 301 },
    //   "/move-reference/[network]/[framework]/[slug]": { src: "/move-reference/[network]/[framework]/[slug]", destination: "/move-reference", status: 301 },
    // },
    //"/build/smart-contracts/move-reference": {
    //  destination: "/move-reference",
    //  status: 301,
    //},
  },
});
