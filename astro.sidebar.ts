import type { StarlightUserConfig } from "@astrojs/starlight/types";
import { openAPISidebarGroups } from "starlight-openapi";
import { group, type NestedSidebarItem } from "./src/config/sidebar";
import { ENV } from "./src/lib/env";

// Define icons for top-level sidebar groups
// This is separate from the sidebar configuration to avoid Starlight schema validation errors
export const sidebarGroupIcons: Record<string, string> = {
  nodes: "ph:hard-drives",
  smartContracts: "ph:brackets-curly",
  guides: "ph:rocket-launch",
  sdksAndTools: "ph:crane-tower",
  concepts: "ph:file-text",
  reference: "ph:book-open",
};

const ENABLE_API_REFERENCE = ENV.ENABLE_API_REFERENCE;
const enableApiReference = ENABLE_API_REFERENCE === "true";

/**
 * Starlight sidebar configuration object for the global site sidebar.
 */
export const sidebar = [
  // --- GUIDES Tab (Focus: Task-Oriented Tutorials) ---
  group("guides", {
    items: [
      group("guides.group.getStarted", {
        items: ["build/get-started", "build/get-started/developer-setup"],
      }),
      // "build/guides", // Guides overview page
      group("guides.group.beginner", {
        items: [
          "build/guides/first-transaction",
          "build/guides/your-first-nft",
          "build/guides/first-coin",
          "build/guides/first-fungible-asset",
          "build/guides/first-move-module",
          "build/guides/first-multisig",
          "build/guides/build-e2e-dapp",
        ],
      }),
      group("guides.group.advanced", {
        items: [
          "build/guides/multisig-managed-fungible-asset",
          "build/guides/aptos-keyless",
          "build/guides/sponsored-transactions",
          "build/guides/transaction-management",
          "build/guides/key-rotation",
          "build/guides/exchanges",
          "build/guides/oracles",
        ],
      }),
    ],
  }),

  // --- SDKS & TOOLS Tab (Focus: Tools & APIs for Integration) ---
  group("sdksAndTools", {
    items: [
      "build/apis",
      // SDKs Grouped
      group("build.group.sdks", {
        items: [
          "build/sdks", // SDK Overview
          group("build.group.sdks.official", {
            items: [
              "build/sdks/ts-sdk",
              "build/sdks/python-sdk",
              "build/sdks/go-sdk",
              "build/sdks/rust-sdk",
              "build/sdks/dotnet-sdk",
              "build/sdks/unity-sdk",
              "build/sdks/cpp-sdk",
              "build/sdks/wallet-adapter",
            ],
          }),
          group("build.group.sdks.community", {
            items: [
              "build/sdks/community-sdks",
              "build/sdks/community-sdks/kotlin-sdk",
              "build/sdks/community-sdks/swift-sdk",
            ],
          }),
        ],
      }),
      "build/indexer",
      "build/cli",
      "build/create-aptos-dapp",
      "network/faucet",
      {
        label: "LLMs Text",
        link: "/llms-txt",
        badge: { text: "NEW", variant: "tip" },
      },
    ],
  }),

  // --- SMART CONTRACTS & MOVE Tab (NEW - Focus: Writing On-Chain Code) ---
  group("smartContracts", {
    items: [
      "build/smart-contracts", // Overview page
      "build/smart-contracts/why-move",

      group("smartContracts.group.moveBook", {
        items: [
          "build/smart-contracts/book/modules-and-scripts",
          "build/smart-contracts/book/structs-and-resources",
          "build/smart-contracts/book/integers",
          "build/smart-contracts/book/bool",
          "build/smart-contracts/book/address",
          "build/smart-contracts/book/vector",
          "build/smart-contracts/book/signer",
          "build/smart-contracts/book/references",
          "build/smart-contracts/book/tuples",
          "build/smart-contracts/book/abilities",
          "build/smart-contracts/book/equality",
          "build/smart-contracts/book/abort-and-assert",
          "build/smart-contracts/book/conditionals",
          "build/smart-contracts/book/loops",
          "build/smart-contracts/book/functions",
          "build/smart-contracts/book/enums",
          "build/smart-contracts/book/constants",
          "build/smart-contracts/book/generics",
          "build/smart-contracts/book/uses",
          "build/smart-contracts/book/friends",
          "build/smart-contracts/book/global-storage-structure",
          "build/smart-contracts/book/global-storage-operators",
        ],
      }),
      group("smartContracts.group.development", {
        items: [
          "build/smart-contracts/create-package",
          "build/smart-contracts/compiling",
          "build/smart-contracts/deployment",
          "build/smart-contracts/book/packages",
          "build/smart-contracts/book/package-upgrades",
          "build/smart-contracts/book/unit-testing",
          "build/smart-contracts/debugging",
          "build/smart-contracts/scripts",
          "build/smart-contracts/move-security-guidelines",
          "build/smart-contracts/third-party-dependencies",
          "build/smart-contracts/book/coding-conventions",
        ],
      }),
      group("smartContracts.group.aptosFeatures", {
        items: [
          "build/smart-contracts/objects",
          "build/smart-contracts/aptos-standards",
          "build/smart-contracts/digital-asset",
          "build/smart-contracts/fungible-asset",
          "build/smart-contracts/aptos-coin",
          "build/smart-contracts/aptos-token",
          "build/smart-contracts/randomness",
          "build/smart-contracts/cryptography",
          "build/smart-contracts/resource-accounts",
          "build/smart-contracts/bcs",
          "build/smart-contracts/maps",
          "build/smart-contracts/smart-table",
          "build/smart-contracts/smart-vector",
        ],
      }),
      group("smartContracts.group.tooling", {
        items: [
          "build/smart-contracts/prover",
          "build/smart-contracts/linter",
          "build/smart-contracts/compiler_v2",
        ],
      }),
      group("smartContracts.group.reference", {
        items: [
          { label: "View Frameworks", link: "/move-reference" },
          { label: "Aptos Framework", link: "/move-reference/mainnet/aptos-framework" },
          { label: "Aptos Standard Library", link: "/move-reference/mainnet/aptos-stdlib" },
          { label: "Aptos Token Objects", link: "/move-reference/mainnet/aptos-token-objects" },
          { label: "Move Standard Library", link: "/move-reference/mainnet/move-stdlib" },
        ],
      }),
      "build/smart-contracts/book/move-2", // Release Notes
    ],
  }),
  group("nodes", {
    items: [
      "network/nodes", // Added Nodes Overview/Landing page
      "network/nodes/localnet",
      "network/nodes/validator-node",
      "network/nodes/full-node",
      "network/nodes/bootstrap-fullnode",
      "network/nodes/configure",
      "network/nodes/measure",
      "network/nodes/building-from-source",
      "network/nodes/networks",
      "network/releases",
    ],
  }),
  group("concepts", {
    // "network/blockchain", // blockchain overview
    items: [
      "network/blockchain/aptos-white-paper",
      "network/blockchain/blockchain-deep-dive",
      "network/blockchain/execution",
      "network/blockchain/gas-txn-fee",
      "network/blockchain/events",
      "network/blockchain/accounts",
      "network/blockchain/validator-nodes",
      "network/blockchain/fullnodes",
      "network/blockchain/node-networks-sync",
      "network/blockchain/resources",
      "network/blockchain/txns-states",
      "network/blockchain/base-gas",
      "network/blockchain/blocks",
      "network/blockchain/staking",
      "network/blockchain/delegated-staking",
      "network/blockchain/governance",
    ],
  }),

  // --- REFERENCE Tab (Focus: API/Tool Lookup) ---
  group("reference", {
    items: [
      group("reference.group.indexerApi", {
        items: ["build/indexer/indexer-api", "build/indexer/indexer-api/indexer-reference"],
      }),
      group("reference.group.restApi", {
        // Assert the type of the entire items array
        items: [
          { label: "REST API", link: "/build/apis/fullnode-rest-api" },
          ...(enableApiReference ? openAPISidebarGroups : []),
        ] as NestedSidebarItem[],
      }),

      "network/glossary",
    ],
  }),
] satisfies StarlightUserConfig["sidebar"];
