/**
 * Curated doc ids for /llms.txt, llms-small.txt, and llms-full.txt ordering.
 * Kept free of Astro-heavy imports so tests and scripts can validate ids without booting the MDX pipeline.
 *
 * Maintenance: When you add prominent English landing pages (for example new AI, SDK, or guide hubs), add their
 * doc id to the appropriate section below and, if they should appear early in llms-full.txt, to FULL_PRIORITY_DOC_IDS.
 * `pnpm test` runs tests/llms-curated-ids.test.ts to ensure every id exists on disk and is not draft; /llms.txt also
 * throws at build time if a curated id is missing from the English collection.
 */

export interface LlmsSection {
  title: string;
  ids: string[];
}

export const LLMS_INDEX_SECTIONS: LlmsSection[] = [
  {
    title: "Start Here",
    ids: [
      "build/get-started",
      "build/get-started/ethereum-cheatsheet",
      "build/guides/first-transaction",
      "build/guides/first-move-module",
      "network/blockchain/accounts",
      "network/blockchain/txns-states",
      "build/sdks",
      "build/cli",
    ],
  },
  {
    title: "Smart Contracts",
    ids: [
      "build/smart-contracts",
      "build/smart-contracts/book",
      "build/smart-contracts/objects",
      "build/smart-contracts/randomness",
    ],
  },
  {
    title: "APIs And Data",
    ids: [
      "build/apis",
      "build/apis/fullnode-rest-api",
      "build/guides/exchanges",
      "build/indexer/indexer-api",
      "build/indexer/indexer-api/indexer-reference",
      "build/indexer/txn-stream",
    ],
  },
  {
    title: "SDKs",
    ids: ["build/sdks/ts-sdk"],
  },
  {
    title: "Advanced Topics",
    ids: [
      "build/guides/sponsored-transactions",
      "build/guides/orderless-transactions",
      "build/guides/aptos-keyless",
      "build/guides/transaction-management",
    ],
  },
  {
    title: "AI Tooling",
    ids: ["build/ai", "build/ai/aptos-mcp", "llms-txt"],
  },
  {
    title: "Nodes And Operations",
    ids: [
      "network/nodes",
      "network/nodes/full-node",
      "network/nodes/validator-node",
      "network/releases",
      "network/glossary",
    ],
  },
];

export const LLMS_SMALL_DOC_IDS = [
  "index",
  ...new Set(LLMS_INDEX_SECTIONS.flatMap((section) => section.ids)),
];

/** Doc ids listed first in llms-full.txt before alphabetical remainder. */
export const FULL_PRIORITY_DOC_IDS = [
  "index",
  "build/get-started",
  "build/get-started/ethereum-cheatsheet",
  "build/guides/first-transaction",
  "build/guides/first-move-module",
  "network/blockchain/accounts",
  "network/blockchain/txns-states",
  "build/sdks",
  "build/apis",
  "build/guides/exchanges",
  "build/indexer/indexer-api",
  "build/cli",
  "build/smart-contracts",
  "build/ai",
  "network/nodes",
  "network/glossary",
  "llms-txt",
];

export const EXCLUDED_DOC_IDS = new Set(["contribute/components/themed-image"]);

const LOCALE_PREFIXES = ["es/", "zh/"];

/** Id/path rules for English docs in the llms-full corpus (excludes draft — check frontmatter separately). */
export function isEnglishDocId(id: string): boolean {
  return (
    !LOCALE_PREFIXES.some((prefix) => id.startsWith(prefix)) &&
    id !== "es" &&
    id !== "zh" &&
    !id.includes("404") &&
    !EXCLUDED_DOC_IDS.has(id)
  );
}
