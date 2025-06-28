import type { StarlightUserConfig } from "@astrojs/starlight/types";
import { group } from "./src/config/sidebar";

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

/**
 * Starlight sidebar configuration object for the global site sidebar.
 */
export const sidebar = [
  // --- GUIDES Tab (Focus: Task-Oriented Tutorials) ---
  group("guides", {
    items: [
      group("guides.group.getStarted", {
        collapsed: true,
        items: [
          "build/get-started",
          "build/guides",
          "build/get-started/developer-setup",
          "build/get-started/ethereum-cheatsheet",
          "build/get-started/solana-cheatsheet",
        ],
      }),
      group("guides.group.beginner", {
        collapsed: true,
        items: [
          "build/guides/first-transaction",
          "build/guides/your-first-nft",
          "build/guides/first-coin",
          "build/guides/first-fungible-asset",
          "build/guides/first-move-module",
          "build/guides/first-multisig",
          {
            label: "Build E2E DApp",
            collapsed: true,
            items: [
              "build/guides/build-e2e-dapp",
              "build/guides/build-e2e-dapp/1-create-smart-contract",
              "build/guides/build-e2e-dapp/2-set-up-the-frontend",
              "build/guides/build-e2e-dapp/3-fetch-data-from-chain",
              "build/guides/build-e2e-dapp/4-submit-data-to-chain",
              "build/guides/build-e2e-dapp/5-handle-tasks",
            ],
          },
        ],
      }),
      group("guides.group.advanced", {
        collapsed: true,
        items: [
          "build/guides/multisig-managed-fungible-asset",
          {
            label: "Aptos Keyless",
            collapsed: true,
            items: [
              "build/guides/aptos-keyless",
              "build/guides/aptos-keyless/introduction",
              "build/guides/aptos-keyless/how-keyless-works",
              "build/guides/aptos-keyless/integration-guide",
              "build/guides/aptos-keyless/simple-example",
              "build/guides/aptos-keyless/oidc-support",
              "build/guides/aptos-keyless/other",
              {
                label: "Federated Keyless",
                collapsed: true,
                items: [
                  "build/guides/aptos-keyless/federated-keyless",
                  "build/guides/aptos-keyless/federated-keyless/integration-guide",
                  "build/guides/aptos-keyless/federated-keyless/key-considerations",
                  "build/guides/aptos-keyless/federated-keyless/simple-example",
                  "build/guides/aptos-keyless/federated-keyless/other",
                ],
              },
            ],
          },
          "build/guides/sponsored-transactions",
          "build/guides/transaction-management",
          "build/guides/key-rotation",
          "build/guides/orderless-transactions",
        ],
      }),
      {
        label: "Integration",
        collapsed: true,
        items: [
          "build/guides/exchanges",
          "build/guides/system-integrators-guide",
          "build/guides/oracles",
        ],
      },
      "guides/example",
    ],
  }),

  // --- SDKS & TOOLS Tab (Focus: Tools & APIs for Integration) ---
  group("sdksAndTools", {
    items: [
      // Aptos APIs
      {
        label: "Aptos APIs",
        collapsed: true,
        items: [
          "build/apis",
          "build/apis/fullnode-rest-api",
          "build/apis/fullnode-rest-api-reference",
          "build/apis/faucet-api",
          "build/apis/data-providers",
          "build/apis/aptos-labs-developer-portal",
        ],
      },

      // SDKs - Collapsible groups for each SDK/tool
      "build/sdks",
      {
        label: "TypeScript SDK",
        collapsed: true,
        items: [
          "build/sdks/ts-sdk",
          "build/sdks/ts-sdk/account",
          "build/sdks/ts-sdk/building-transactions",
          "build/sdks/ts-sdk/confidential-asset",
          "build/sdks/ts-sdk/fetch-data-via-sdk",
          "build/sdks/ts-sdk/legacy-ts-sdk",
          "build/sdks/ts-sdk/quickstart",
          "build/sdks/ts-sdk/ts-examples",
          "build/sdks/ts-sdk/type-safe-contract",
          {
            label: "Account",
            collapsed: true,
            items: [
              "build/sdks/ts-sdk/account",
              "build/sdks/ts-sdk/account/account-abstraction",
              "build/sdks/ts-sdk/account/derivable-account-abstraction",
            ],
          },
          {
            label: "Building Transactions",
            collapsed: true,
            items: [
              "build/sdks/ts-sdk/building-transactions",
              "build/sdks/ts-sdk/building-transactions/batching-transactions",
              "build/sdks/ts-sdk/building-transactions/bcs-format",
              "build/sdks/ts-sdk/building-transactions/multi-agent-transactions",
              "build/sdks/ts-sdk/building-transactions/orderless-transactions",
              "build/sdks/ts-sdk/building-transactions/script-composer",
              "build/sdks/ts-sdk/building-transactions/simulating-transactions",
              "build/sdks/ts-sdk/building-transactions/sponsoring-transactions",
            ],
          },
          {
            label: "Legacy TS SDK",
            collapsed: true,
            items: [
              "build/sdks/ts-sdk/legacy-ts-sdk",
              "build/sdks/ts-sdk/legacy-ts-sdk/migration-guide",
            ],
          },
        ],
      },
      // Python SDK (no subpages found)
      "build/sdks/python-sdk",
      {
        label: "Go SDK",
        collapsed: true,
        items: [
          "build/sdks/go-sdk",
          "build/sdks/go-sdk/account",
          "build/sdks/go-sdk/building-transactions",
          "build/sdks/go-sdk/fetch-data-via-sdk",
          "build/sdks/go-sdk/go-examples",
          {
            label: "Building Transactions",
            collapsed: true,
            items: [
              "build/sdks/go-sdk/building-transactions",
              "build/sdks/go-sdk/building-transactions/batching-transactions",
              "build/sdks/go-sdk/building-transactions/simulating-transactions",
              "build/sdks/go-sdk/building-transactions/bcs-format",
              "build/sdks/go-sdk/building-transactions/multi-agent-transactions",
              "build/sdks/go-sdk/building-transactions/sponsoring-transactions",
            ],
          },
        ],
      },
      // Rust SDK (no subpages found)
      "build/sdks/rust-sdk",
      {
        label: "Dotnet SDK",
        collapsed: true,
        items: [
          "build/sdks/dotnet-sdk",
          "build/sdks/dotnet-sdk/dotnet-examples",
          "build/sdks/dotnet-sdk/getting-started",
          "build/sdks/dotnet-sdk/godot-integration",
          "build/sdks/dotnet-sdk/unity-integration",
          {
            label: "Accounts",
            collapsed: true,
            items: [
              "build/sdks/dotnet-sdk/accounts/ed25519",
              "build/sdks/dotnet-sdk/accounts/keyless",
              "build/sdks/dotnet-sdk/accounts/multikey",
            ],
          },
          {
            label: "Queries",
            collapsed: true,
            items: ["build/sdks/dotnet-sdk/queries/view"],
          },
          {
            label: "Transactions",
            collapsed: true,
            items: [
              "build/sdks/dotnet-sdk/transactions/basic-transactions",
              "build/sdks/dotnet-sdk/transactions/sponsored-transactions",
            ],
          },
        ],
      },
      // Unity SDK (no subpages found)
      "build/sdks/unity-sdk",
      // C++ SDK (no subpages found)
      "build/sdks/cpp-sdk",
      {
        label: "Wallet Adapter",
        collapsed: true,
        items: [
          "build/sdks/wallet-adapter",
          "build/sdks/wallet-adapter/browser-extension-wallets",
          "build/sdks/wallet-adapter/dapp",
          "build/sdks/wallet-adapter/wallet-standards",
          "build/sdks/wallet-adapter/wallets",
          "build/sdks/wallet-adapter/x-chain-accounts",
        ],
      },
      // Community SDKs
      {
        label: "Community SDKs",
        collapsed: true,
        items: [
          "build/sdks/community-sdks",
          "build/sdks/community-sdks/kotlin-sdk",
          "build/sdks/community-sdks/kotlin-sdk/account",
          "build/sdks/community-sdks/kotlin-sdk/building-transactions",
          "build/sdks/community-sdks/kotlin-sdk/client-configuration",
          "build/sdks/community-sdks/kotlin-sdk/fetch-data-via-sdk",
          "build/sdks/community-sdks/kotlin-sdk/quickstart",
          "build/sdks/community-sdks/kotlin-sdk/sponsored-transactions",
          {
            label: "For iOS Developers",
            collapsed: true,
            items: [
              "build/sdks/community-sdks/kotlin-sdk/for-ios-devs/aptos-kit",
              "build/sdks/community-sdks/kotlin-sdk/for-ios-devs/getting-started",
            ],
          },
          "build/sdks/community-sdks/swift-sdk",
          "build/sdks/community-sdks/unity-opendive-sdk",
        ],
      },

      // Indexer
      {
        label: "Indexer",
        collapsed: true,
        items: [
          "build/indexer",
          {
            label: "Indexer API",
            collapsed: true,
            items: [
              "build/indexer/indexer-api",
              "build/indexer/indexer-api/architecture",
              "build/indexer/indexer-api/indexer-reference",
              "build/indexer/indexer-api/self-hosted",
              "build/indexer/indexer-api/account-transactions",
              "build/indexer/indexer-api/ans-lookup",
              "build/indexer/indexer-api/fungible-asset-balances",
              "build/indexer/indexer-api/fungible-asset-info",
              "build/indexer/indexer-api/get-delegators",
              "build/indexer/indexer-api/get-nft-collections",
              "build/indexer/indexer-api/get-nfts",
              "build/indexer/indexer-api/token-metadata",
            ],
          },
          {
            label: "Indexer SDK",
            collapsed: true,
            items: [
              "build/indexer/indexer-sdk",
              "build/indexer/indexer-sdk/quickstart",
              {
                label: "Documentation",
                collapsed: true,
                items: [
                  "build/indexer/indexer-sdk/documentation",
                  "build/indexer/indexer-sdk/documentation/setup",
                  "build/indexer/indexer-sdk/documentation/connect-steps",
                  "build/indexer/indexer-sdk/documentation/define-schema",
                  "build/indexer/indexer-sdk/documentation/create-processor",
                  "build/indexer/indexer-sdk/documentation/run-processor",
                  "build/indexer/indexer-sdk/documentation/steps",
                  "build/indexer/indexer-sdk/documentation/steps/parsing-txns",
                  "build/indexer/indexer-sdk/documentation/steps/transaction-stream",
                  "build/indexer/indexer-sdk/documentation/advanced-tutorials",
                  "build/indexer/indexer-sdk/documentation/version-tracking",
                ],
              },
              {
                label: "Advanced Tutorials",
                collapsed: true,
                items: [
                  "build/indexer/indexer-sdk/advanced-tutorials/migration-guide",
                  "build/indexer/indexer-sdk/advanced-tutorials/processor-test",
                  "build/indexer/indexer-sdk/advanced-tutorials/test-transactions",
                  "build/indexer/indexer-sdk/advanced-tutorials/txn-importer",
                  "build/indexer/indexer-sdk/advanced-tutorials/txn-script",
                ],
              },
            ],
          },
          {
            label: "NFT Aggregator",
            collapsed: true,
            items: [
              "build/indexer/nft-aggregator",
              "build/indexer/nft-aggregator/analytics-api",
              "build/indexer/nft-aggregator/graphql-api",
              "build/indexer/nft-aggregator/marketplaces",
              "build/indexer/nft-aggregator/nft-aggregator-table",
              {
                label: "Marketplaces",
                collapsed: true,
                items: [
                  "build/indexer/nft-aggregator/marketplaces/bluemove",
                  "build/indexer/nft-aggregator/marketplaces/rarible",
                  "build/indexer/nft-aggregator/marketplaces/topaz",
                  "build/indexer/nft-aggregator/marketplaces/tradeport",
                  "build/indexer/nft-aggregator/marketplaces/wapal",
                ],
              },
            ],
          },
          {
            label: "Transaction Stream",
            collapsed: true,
            items: [
              "build/indexer/txn-stream",
              "build/indexer/txn-stream/aptos-hosted-txn-stream",
              "build/indexer/txn-stream/local-development",
              "build/indexer/txn-stream/self-hosted",
            ],
          },
          {
            label: "Legacy",
            collapsed: true,
            items: [
              "build/indexer/legacy",
              "build/indexer/legacy/custom-data-model",
              "build/indexer/legacy/indexer-fullnode",
              "build/indexer/legacy/migration",
            ],
          },
        ],
      },

      // CLI
      {
        label: "CLI",
        collapsed: true,
        items: [
          "build/cli",
          "build/cli/setup-cli",
          "build/cli/formatting-move-contracts",
          "build/cli/managing-a-network-node",
          "build/cli/public-network",
          "build/cli/replay-past-transactions",
          "build/cli/running-a-local-network",
          "build/cli/start-from-template",
          "build/cli/trying-things-on-chain",
          "build/cli/working-with-move-contracts",
          {
            label: "Install CLI",
            collapsed: true,
            items: [
              "build/cli/install-cli/install-cli-linux",
              "build/cli/install-cli/install-cli-mac",
              "build/cli/install-cli/install-cli-specific-version",
              "build/cli/install-cli/install-cli-windows",
            ],
          },
          {
            label: "Setup CLI",
            collapsed: true,
            items: ["build/cli/setup-cli", "build/cli/setup-cli/install-move-prover"],
          },
          {
            label: "Trying Things On Chain",
            collapsed: true,
            items: [
              "build/cli/trying-things-on-chain",
              "build/cli/trying-things-on-chain/create-test-accounts",
              "build/cli/trying-things-on-chain/ledger",
              "build/cli/trying-things-on-chain/looking-up-account-info",
            ],
          },
          {
            label: "Working with Move Contracts",
            collapsed: true,
            items: [
              "build/cli/working-with-move-contracts",
              "build/cli/working-with-move-contracts/arguments-in-json-tutorial",
              "build/cli/working-with-move-contracts/local-simulation-benchmarking-and-gas-profiling",
              "build/cli/working-with-move-contracts/multi-signature-tutorial",
            ],
          },
        ],
      },

      // Create Aptos DApp
      {
        label: "Create Aptos DApp",
        collapsed: true,
        items: ["build/create-aptos-dapp", "build/create-aptos-dapp/faq"],
      },

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
    collapsed: true,
    items: [
      "build/smart-contracts", // Overview page
      "build/smart-contracts/why-move",

      // Move Book - Individual entries
      {
        label: "Move Book",
        collapsed: true,
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
          "build/smart-contracts/book/variables",
          "build/smart-contracts/book/unit-testing",
          "build/smart-contracts/book/coding-conventions",
          "build/smart-contracts/book/move-tutorial",
          "build/smart-contracts/book/standard-library",
        ],
      },

      // Development
      {
        label: "Development",
        collapsed: true,
        items: [
          "build/smart-contracts/create-package",
          "build/smart-contracts/compiling",
          "build/smart-contracts/deployment",
          "build/smart-contracts/book/packages",
          "build/smart-contracts/book/package-upgrades",
          "build/smart-contracts/debugging",
          "build/smart-contracts/scripts",
          "build/smart-contracts/scripts/compiling-scripts",
          "build/smart-contracts/scripts/running-scripts",
          "build/smart-contracts/scripts/script-tutorial",
          "build/smart-contracts/scripts/writing-scripts",
          "build/smart-contracts/move-security-guidelines",
          "build/smart-contracts/third-party-dependencies",
        ],
      },

      // Aptos Features
      {
        label: "Aptos Features",
        collapsed: true,
        items: [
          "build/smart-contracts/objects",
          "build/smart-contracts/object/creating-objects",
          "build/smart-contracts/object/using-objects",
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
          "build/smart-contracts/table",
          "build/smart-contracts/vector",
          "build/smart-contracts/tokens",
          "build/smart-contracts/confidential-asset",
          "build/smart-contracts/modules-on-aptos",
        ],
      },

      // Tooling
      {
        label: "Tooling",
        collapsed: true,
        items: [
          "build/smart-contracts/prover",
          "build/smart-contracts/prover/prover-guide",
          "build/smart-contracts/prover/spec-lang",
          "build/smart-contracts/prover/supporting-resources",
          "build/smart-contracts/linter",
          "build/smart-contracts/compiler_v2",
        ],
      },

      // Reference
      {
        label: "Reference",
        collapsed: true,
        items: [
          { label: "View Frameworks", link: "/move-reference" },
          { label: "Aptos Framework", link: "/move-reference/mainnet/aptos-framework" },
          { label: "Aptos Standard Library", link: "/move-reference/mainnet/aptos-stdlib" },
          { label: "Aptos Token Objects", link: "/move-reference/mainnet/aptos-token-objects" },
          { label: "Move Standard Library", link: "/move-reference/mainnet/move-stdlib" },
          "build/smart-contracts/move-reference",
          "build/smart-contracts/reference",
          "build/smart-contracts/error-codes",
        ],
      },

      "build/smart-contracts/book/move-2", // Release Notes
    ],
  }),

  // --- NODES Tab ---
  group("nodes", {
    collapsed: true,
    items: [
      "network/nodes", // Added Nodes Overview/Landing page

      // Localnet
      {
        label: "Localnet",
        collapsed: true,
        items: [
          "network/nodes/localnet",
          "network/nodes/localnet/local-development-network",
          "network/nodes/localnet/run-a-localnet",
        ],
      },

      // Validator Node
      {
        label: "Validator Node",
        collapsed: true,
        items: [
          "network/nodes/validator-node",
          "network/nodes/validator-node/node-requirements",
          "network/nodes/validator-node/operator",
          "network/nodes/validator-node/connect-nodes",
          "network/nodes/validator-node/connect-nodes/connect-to-aptos-network",
          "network/nodes/validator-node/connect-nodes/delegation-pool-operations",
          "network/nodes/validator-node/connect-nodes/staking-pool-operations",
          "network/nodes/validator-node/connect-nodes/staking-pool-voter",
          "network/nodes/validator-node/deploy-nodes",
          "network/nodes/validator-node/deploy-nodes/using-aws",
          "network/nodes/validator-node/deploy-nodes/using-azure",
          "network/nodes/validator-node/deploy-nodes/using-docker",
          "network/nodes/validator-node/deploy-nodes/using-gcp",
          "network/nodes/validator-node/deploy-nodes/using-source-code",
          "network/nodes/validator-node/modify-nodes",
          "network/nodes/validator-node/modify-nodes/rotate-consensus-key",
          "network/nodes/validator-node/modify-nodes/shutting-down-nodes",
          "network/nodes/validator-node/modify-nodes/update-validator-node",
          "network/nodes/validator-node/verify-nodes",
          "network/nodes/validator-node/verify-nodes/leaderboard-metrics",
          "network/nodes/validator-node/verify-nodes/node-liveness-criteria",
        ],
      },

      // Full Node
      {
        label: "Full Node",
        collapsed: true,
        items: [
          "network/nodes/full-node",
          "network/nodes/full-node/pfn-requirements",
          "network/nodes/full-node/verify-pfn",
          "network/nodes/full-node/deployments",
          "network/nodes/full-node/deployments/using-docker",
          "network/nodes/full-node/deployments/using-gcp",
          "network/nodes/full-node/deployments/using-source-code",
          "network/nodes/full-node/modify",
          "network/nodes/full-node/modify/fullnode-network-connections",
          "network/nodes/full-node/modify/network-identity-fullnode",
          "network/nodes/full-node/modify/update-fullnode-with-new-releases",
        ],
      },

      // Bootstrap Fullnode
      {
        label: "Bootstrap Fullnode",
        collapsed: true,
        items: [
          "network/nodes/bootstrap-fullnode",
          "network/nodes/bootstrap-fullnode/bootstrap-fullnode",
          "network/nodes/bootstrap-fullnode/aptos-db-restore",
        ],
      },

      // Configure
      {
        label: "Configure",
        collapsed: true,
        items: [
          "network/nodes/configure",
          "network/nodes/configure/consensus-observer",
          "network/nodes/configure/data-pruning",
          "network/nodes/configure/state-sync",
          "network/nodes/configure/telemetry",
          "network/nodes/configure/node-files-all-networks",
          "network/nodes/configure/node-files-all-networks/node-files-devnet",
          "network/nodes/configure/node-files-all-networks/node-files-mainnet",
          "network/nodes/configure/node-files-all-networks/node-files-testnet",
        ],
      },

      // Measure
      {
        label: "Measure",
        collapsed: true,
        items: [
          "network/nodes/measure",
          "network/nodes/measure/important-metrics",
          "network/nodes/measure/node-health-checker",
          "network/nodes/measure/node-health-checker-faq",
          "network/nodes/measure/node-inspection-service",
        ],
      },

      "network/nodes/building-from-source",
      "network/nodes/networks",
      "network/releases",
    ],
  }),

  // --- CONCEPTS Tab ---
  group("concepts", {
    collapsed: true,
    items: [
      // Blockchain Fundamentals
      {
        label: "Blockchain Fundamentals",
        collapsed: true,
        items: [
          "network/blockchain",
          "network/blockchain/aptos-white-paper",
          "network/blockchain/blockchain-deep-dive",
          "network/blockchain/blocks",
          "network/blockchain/move",
        ],
      },

      // Execution & Transactions
      {
        label: "Execution & Transactions",
        collapsed: true,
        items: [
          "network/blockchain/execution",
          "network/blockchain/gas-txn-fee",
          "network/blockchain/base-gas",
          "network/blockchain/txns-states",
          "network/blockchain/events",
        ],
      },

      // Accounts & Resources
      {
        label: "Accounts & Resources",
        collapsed: true,
        items: ["network/blockchain/accounts", "network/blockchain/resources"],
      },

      // Network & Nodes
      {
        label: "Network & Nodes",
        collapsed: true,
        items: [
          "network/blockchain/validator-nodes",
          "network/blockchain/fullnodes",
          "network/blockchain/node-networks-sync",
        ],
      },

      // Staking & Governance
      {
        label: "Staking & Governance",
        collapsed: true,
        items: [
          "network/blockchain/staking",
          "network/blockchain/delegated-staking",
          "network/blockchain/governance",
        ],
      },
    ],
  }),

  // --- REFERENCE Tab (Focus: API/Tool Lookup) ---
  group("reference", {
    items: [
      "build/indexer/indexer-api",
      "build/indexer/indexer-api/indexer-reference",
      { label: "REST API", link: "/build/apis/fullnode-rest-api" },
      "network/glossary",
    ],
  }),

  // --- CONTRIBUTE Tab ---
  group("contribute", {
    items: ["contribute/components/themed-image"],
  }),
] satisfies StarlightUserConfig["sidebar"];
