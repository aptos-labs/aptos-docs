// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import starlightOpenAPI, { openAPISidebarGroups } from "starlight-openapi";

import vercel from "@astrojs/vercel";
import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
  site: "https://aptos.dev",
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
      },
      plugins: [
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
      customCss: ["./src/globals.css"],
    }),
    svelte(),
  ],
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
});
