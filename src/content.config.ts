import { docsLoader, i18nLoader } from "@astrojs/starlight/loaders";
import { docsSchema, i18nSchema } from "@astrojs/starlight/schema";
import { defineCollection, z } from "astro:content";
import type { StarlightIcon } from "@astrojs/starlight/types";
import { moveReferenceLoader } from "./loaders/moveReference";
import type { BranchConfig, ModuleConfig } from "./loaders/moveReference/types";

const MOVE_REFERENCE_FRAMEWORK_BASE_PATH = "aptos-move/framework";

export const MOVE_REFERENCE_MODULES = [
  { framework: "move-stdlib" },
  { framework: "aptos-stdlib" },
  { framework: "aptos-framework" },
  { framework: "aptos-token" },
  { framework: "aptos-token-objects" },
] as const satisfies Omit<ModuleConfig, "folder">[];

export const MOVE_REFERENCE_BRANCHES = [
  { name: "mainnet", ref: "mainnet", label: "Mainnet", icon: "star" },
  { name: "testnet", ref: "testnet", label: "Testnet", icon: "setting" },
  { name: "devnet", ref: "devnet", label: "Devnet", icon: "rocket" },
] as const satisfies (Omit<BranchConfig, "modules"> & { label: string; icon: StarlightIcon })[];

export type MoveNetwork = (typeof MOVE_REFERENCE_BRANCHES)[number]["name"];
export type MoveFramework = (typeof MOVE_REFERENCE_MODULES)[number]["framework"];

// Helper to create the full module config with the folder path
const createModuleConfig = (module: Omit<ModuleConfig, "folder">): ModuleConfig => ({
  ...module,
  folder: `${MOVE_REFERENCE_FRAMEWORK_BASE_PATH}/${module.framework}/doc`,
});

// Helper to create the full branch config with modules
const createBranchConfig = (branch: Omit<BranchConfig, "modules">): BranchConfig => ({
  ...branch,
  modules: MOVE_REFERENCE_MODULES.map(createModuleConfig),
});

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
  moveReference: defineCollection({
    type: "content_layer",
    loader: moveReferenceLoader({
      owner: "aptos-labs",
      repo: "aptos-core",
      branches: MOVE_REFERENCE_BRANCHES.map(createBranchConfig),
    }),
    schema: z.object({
      network: z.string().transform((v) => v as MoveNetwork),
      framework: z.string().transform((v) => v as MoveFramework),
      title: z.string(),
      description: z.string().optional(),
    }),
  }),
};
