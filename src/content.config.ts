import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

// import z from "astro/zod";
import { moveReferenceLoader } from "./loaders/moveReference";

export const collections = {
  // TODO: Find the root of errors later
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  moveReference: defineCollection({
    type: "content_layer",
    loader: moveReferenceLoader({
      folder: "aptos-move/framework/aptos-token-objects/doc",
      owner: "aptos-labs",
      ref: "mainnet",
      repo: "aptos-core",
      // schema: z.object({
      //   // title: z.string(),
      //   // source: z.string().url()
      // })
    }),
  }),
};
