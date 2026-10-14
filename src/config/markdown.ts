import { type UnifiedProcessorOptions, unified } from "@astrojs/markdown-remark";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkMath from "remark-math";
import { remarkClientOnly } from "../plugins";

/** Shared Markdown pipeline for Starlight content and generated Move reference pages. */
export const markdownProcessorOptions = {
  // Preserve the explicit GFM setting from the Astro 6 configuration.
  gfm: true,
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
};

// The plugin ecosystem currently resolves two compatible but distinct HAST type
// copies. The runtime processor accepts these established plugin factories.
export const markdownProcessor = unified(markdownProcessorOptions as UnifiedProcessorOptions);
