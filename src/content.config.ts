import { docsLoader, i18nLoader } from "@astrojs/starlight/loaders";
import { docsSchema, i18nSchema } from "@astrojs/starlight/schema";
import { defineCollection, z, type CollectionEntry } from 'astro:content';
import type { StarlightIcon } from "@astrojs/starlight/types";
import { moveReferenceLoader } from "./loaders/moveReference";
import type { BranchConfig, ModuleConfig } from "./loaders/moveReference/types";

export const baseSchema = z.object({
	type: z.literal('base').optional().default('base'),
	// i18nReady: z.boolean().default(false),
	// githubURL: z.string().url().optional(),
	// hasREADME: z.boolean().optional(),
	// Extends Starlight’s default `hero` schema with custom fields.
	// hero: z
	// 	.object({
	// 		facepile: z.object({
	// 			tagline: z.string(),
	// 			linkText: z.string(),
	// 			link: z.string(),
	// 		}),
	// 	})
	// 	.optional(),
});

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

export const docsCollectionSchema = baseSchema;


export type DocsEntryData = z.infer<typeof docsCollectionSchema>;

export type DocsEntryType = DocsEntryData['type'];

export type DocsEntry<T extends DocsEntryType> = CollectionEntry<'docs'> & {
	data: Extract<DocsEntryData, { type: T }>;
};

export function createIsDocsEntry<T extends DocsEntryType>(type: T) {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	return (entry: CollectionEntry<'docs'>): entry is DocsEntry<T> => entry.data.type === type;
}

export function createIsLangEntry(lang: string) {
	return (entry: CollectionEntry<'docs'>): boolean => entry.id.startsWith(lang + '/');
}

export const isEnglishEntry = createIsLangEntry('en');
export const isKoreanEntry = createIsLangEntry('ko');



export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema({ extend: docsCollectionSchema }), }),
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
      editUrl: z.string(),
      lastUpdated: z.string(),
    }),
  }),
};


