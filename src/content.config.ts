import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { moveReferenceLoader } from "./loaders/moveReference";
import type { BranchConfig, ModuleConfig } from "./loaders/moveReference/types";

const FRAMEWORK_BASE_PATH = "aptos-move/framework";

const MODULES: Omit<ModuleConfig, "folder">[] = [
  { framework: "move-stdlib" },
  { framework: "aptos-stdlib" },
  { framework: "aptos-framework" },
  { framework: "aptos-token" },
  { framework: "aptos-token-objects" },
];

const BRANCHES: Omit<BranchConfig, "modules">[] = [
  { name: "mainnet", ref: "mainnet" },
  { name: "testnet", ref: "testnet" },
  { name: "devnet", ref: "devnet" },
  { name: "main", ref: "main" },
];

// Helper to create the full module config with the folder path
const createModuleConfig = (module: Omit<ModuleConfig, "folder">): ModuleConfig => ({
  ...module,
  folder: `${FRAMEWORK_BASE_PATH}/${module.framework}/doc`,
});

// Helper to create the full branch config with modules
const createBranchConfig = (branch: Omit<BranchConfig, "modules">): BranchConfig => ({
  ...branch,
  modules: MODULES.map(createModuleConfig),
});

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  moveReference: defineCollection({
    type: "content_layer",
    loader: moveReferenceLoader({
      owner: "aptos-labs",
      repo: "aptos-core",
      branches: BRANCHES.map(createBranchConfig),
    }),
  }),
};
