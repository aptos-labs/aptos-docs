import type { StarlightUserConfig } from "@astrojs/starlight/types";
import { openAPISidebarGroups } from "starlight-openapi";
import { group } from "./src/config/sidebar";

// Define icons for top-level sidebar groups
// This is separate from the sidebar configuration to avoid Starlight schema validation errors
export const sidebarGroupIcons: Record<string, string> = {
  nodes: "ph:hard-drives",
  smartContracts: "ph:brackets-curly",
  guides: "ph:rocket-launch",
  sdksAndTools: "ph:crane-tower",
  concepts: "ph:file-text",
  ai: "ph:robot",
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
          "build/guides/first-move-module",
          // "build/guides/first-coin",
          "build/guides/first-fungible-asset",
          "build/guides/your-first-nft",
          "build/guides/first-multisig",
          group("guides.group.beginner.e2e", {
            collapsed: true,
            items: [
              "build/guides/build-e2e-dapp",
              "build/guides/build-e2e-dapp/1-create-smart-contract",
              "build/guides/build-e2e-dapp/2-set-up-the-frontend",
              "build/guides/build-e2e-dapp/3-fetch-data-from-chain",
              "build/guides/build-e2e-dapp/4-submit-data-to-chain",
              "build/guides/build-e2e-dapp/5-handle-tasks",
            ],
          }),
        ],
      }),
      group("guides.group.advanced", {
        collapsed: true,
        items: [
          "build/guides/sponsored-transactions",
          "build/guides/transaction-management",
          "build/guides/orderless-transactions",
          "build/guides/multisig-managed-fungible-asset",
          "build/guides/key-rotation",
          group("guides.group.aptos-keyless", {
            collapsed: true,
            items: [
              "build/guides/aptos-keyless",
              "build/guides/aptos-keyless/introduction",
              "build/guides/aptos-keyless/how-keyless-works",
              "build/guides/aptos-keyless/integration-guide",
              "build/guides/aptos-keyless/simple-example",
              "build/guides/aptos-keyless/oidc-support",
              "build/guides/aptos-keyless/other",
              group("guides.group.aptos-keyless.federated-keyless", {
                collapsed: true,
                items: [
                  "build/guides/aptos-keyless/federated-keyless",
                  "build/guides/aptos-keyless/federated-keyless/integration-guide",
                  "build/guides/aptos-keyless/federated-keyless/key-considerations",
                  "build/guides/aptos-keyless/federated-keyless/simple-example",
                  "build/guides/aptos-keyless/federated-keyless/other",
                ],
              }),
            ],
          }),
        ],
      }),
      group("guides.group.integration", {
        collapsed: true,
        items: [
          "build/guides/exchanges",
          "build/guides/system-integrators-guide",
          "build/guides/oracles",
        ],
      }),
    ],
  }),

  // --- SDKS & TOOLS Tab (Focus: Tools & APIs for Integration) ---
  group("sdksAndTools", {
    items: [
      // Aptos APIs
      group("build.group.apis", {
        collapsed: true,
        items: [
          "build/apis",
          "build/apis/fullnode-rest-api",
          "build/apis/faucet-api",
          "build/apis/data-providers",
          "build/apis/aptos-labs-developer-portal",
        ],
      }),

      // SDKs - Collapsible groups for each SDK/tool
      group("build.group.sdks", {
        collapsed: true,
        items: [
          "build/sdks",
          group("build.group.sdks.ts-sdk", {
            collapsed: true,
            items: [
              "build/sdks/ts-sdk",
              "build/sdks/ts-sdk/quickstart",
              "build/sdks/ts-sdk/fetch-data-via-sdk",
              "build/sdks/ts-sdk/ts-examples",
              "build/sdks/ts-sdk/type-safe-contract",
              {
                label: "React Hooks (JS Pro)",
                link: "https://js-pro.aptos.dev",
              },
              "build/sdks/ts-sdk/confidential-asset",
              group("build.group.sdks.ts-sdk.accounts", {
                collapsed: true,
                items: [
                  "build/sdks/ts-sdk/account",
                  "build/sdks/ts-sdk/account/account-abstraction",
                  "build/sdks/ts-sdk/account/derivable-account-abstraction",
                ],
              }),
              group("build.group.sdks.ts-sdk.building-transactions", {
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
              }),
              group("build.group.sdks.ts-sdk.legacy-ts-sdk", {
                collapsed: true,
                items: [
                  "build/sdks/ts-sdk/legacy-ts-sdk",
                  "build/sdks/ts-sdk/legacy-ts-sdk/migration-guide",
                ],
              }),
            ],
          }),
          group("build.group.sdks.go-sdk", {
            collapsed: true,
            items: [
              "build/sdks/go-sdk",
              "build/sdks/go-sdk/account",
              "build/sdks/go-sdk/fetch-data-via-sdk",
              "build/sdks/go-sdk/go-examples",
              group("build.group.sdks.go-sdk.building-transactions", {
                collapsed: true,
                items: [
                  "build/sdks/go-sdk/building-transactions",
                  "build/sdks/go-sdk/building-transactions/batching-transactions",
                  "build/sdks/go-sdk/building-transactions/simulating-transactions",
                  "build/sdks/go-sdk/building-transactions/bcs-format",
                  "build/sdks/go-sdk/building-transactions/multi-agent-transactions",
                  "build/sdks/go-sdk/building-transactions/sponsoring-transactions",
                ],
              }),
            ],
          }),
          group("build.group.sdks.dotnet-sdk", {
            collapsed: true,
            items: [
              "build/sdks/dotnet-sdk",
              "build/sdks/dotnet-sdk/dotnet-examples",
              "build/sdks/dotnet-sdk/getting-started",
              "build/sdks/dotnet-sdk/godot-integration",
              "build/sdks/dotnet-sdk/unity-integration",
              group("build.group.sdks.dotnet-sdk.accounts", {
                collapsed: true,
                items: [
                  "build/sdks/dotnet-sdk/accounts/ed25519",
                  "build/sdks/dotnet-sdk/accounts/keyless",
                  "build/sdks/dotnet-sdk/accounts/multikey",
                ],
              }),
              group("build.group.sdks.dotnet-sdk.queries", {
                collapsed: true,
                items: ["build/sdks/dotnet-sdk/queries/view"],
              }),
              group("build.group.sdks.dotnet-sdk.transactions", {
                collapsed: true,
                items: [
                  "build/sdks/dotnet-sdk/transactions/basic-transactions",
                  "build/sdks/dotnet-sdk/transactions/sponsored-transactions",
                ],
              }),
            ],
          }),
          // Python SDK (no subpages found)
          "build/sdks/python-sdk",
          // Unity SDK (no subpages found)
          "build/sdks/unity-sdk",
          // C++ SDK (no subpages found)
          "build/sdks/cpp-sdk",
          // Rust SDK (no subpages found)
          "build/sdks/rust-sdk",
          group("build.group.sdks.wallet-adapter", {
            collapsed: true,
            items: [
              "build/sdks/wallet-adapter",
              "build/sdks/wallet-adapter/browser-extension-wallets",
              "build/sdks/wallet-adapter/dapp",
              "build/sdks/wallet-adapter/wallets",
              "build/sdks/wallet-adapter/wallet-standards",
              "build/sdks/wallet-adapter/x-chain-accounts",
            ],
          }),
          // Community SDKs
          group("build.group.sdks.community-sdks", {
            collapsed: true,
            items: [
              "build/sdks/community-sdks",
              group("build.group.sdks.community-sdks.kotlin-sdk", {
                collapsed: true,
                items: [
                  "build/sdks/community-sdks/kotlin-sdk",
                  "build/sdks/community-sdks/kotlin-sdk/quickstart",
                  "build/sdks/community-sdks/kotlin-sdk/account",
                  "build/sdks/community-sdks/kotlin-sdk/building-transactions",
                  "build/sdks/community-sdks/kotlin-sdk/client-configuration",
                  "build/sdks/community-sdks/kotlin-sdk/fetch-data-via-sdk",
                  "build/sdks/community-sdks/kotlin-sdk/sponsored-transactions",
                  group("build.group.sdks.community-sdks.kotlin-sdk.for-ios-devs", {
                    collapsed: true,
                    items: [
                      "build/sdks/community-sdks/kotlin-sdk/for-ios-devs/getting-started",
                      "build/sdks/community-sdks/kotlin-sdk/for-ios-devs/aptos-kit",
                    ],
                  }),
                ],
              }),
              "build/sdks/community-sdks/swift-sdk",
              "build/sdks/community-sdks/unity-opendive-sdk",
            ],
          }),
        ],
      }),

      // Indexer
      group("build.group.indexer", {
        collapsed: true,
        items: [
          "build/indexer",
          group("build.group.indexer.indexer-api", {
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
          }),
          group("build.group.indexer.indexer-sdk", {
            collapsed: true,
            items: [
              "build/indexer/indexer-sdk",
              "build/indexer/indexer-sdk/quickstart",
              group("build.group.indexer.indexer-sdk.documentation", {
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
              }),
              group("build.group.indexer.indexer-sdk.advanced-tutorials", {
                collapsed: true,
                items: [
                  "build/indexer/indexer-sdk/advanced-tutorials/migration-guide",
                  "build/indexer/indexer-sdk/advanced-tutorials/processor-test",
                  "build/indexer/indexer-sdk/advanced-tutorials/test-transactions",
                  "build/indexer/indexer-sdk/advanced-tutorials/txn-importer",
                  "build/indexer/indexer-sdk/advanced-tutorials/txn-script",
                ],
              }),
            ],
          }),
          group("build.group.indexer.nft-aggregator", {
            collapsed: true,
            items: [
              "build/indexer/nft-aggregator",
              "build/indexer/nft-aggregator/analytics-api",
              "build/indexer/nft-aggregator/graphql-api",
              "build/indexer/nft-aggregator/marketplaces",
              "build/indexer/nft-aggregator/nft-aggregator-table",
              group("build.group.indexer.nft-aggregator.marketplaces", {
                collapsed: true,
                items: [
                  "build/indexer/nft-aggregator/marketplaces/bluemove",
                  "build/indexer/nft-aggregator/marketplaces/rarible",
                  "build/indexer/nft-aggregator/marketplaces/topaz",
                  "build/indexer/nft-aggregator/marketplaces/tradeport",
                  "build/indexer/nft-aggregator/marketplaces/wapal",
                ],
              }),
            ],
          }),
          group("build.group.indexer.txn-stream", {
            collapsed: true,
            items: [
              "build/indexer/txn-stream",
              "build/indexer/txn-stream/aptos-hosted-txn-stream",
              "build/indexer/txn-stream/local-development",
              "build/indexer/txn-stream/self-hosted",
            ],
          }),
          group("build.group.indexer.legacy", {
            collapsed: true,
            items: [
              "build/indexer/legacy",
              "build/indexer/legacy/custom-data-model",
              "build/indexer/legacy/indexer-fullnode",
              "build/indexer/legacy/migration",
            ],
          }),
        ],
      }),

      // CLI
      group("build.group.cli", {
        collapsed: true,
        items: [
          "build/cli",
          group("build.group.cli.install-cli", {
            collapsed: true,
            items: [
              "build/cli/install-cli/install-cli-mac",
              "build/cli/install-cli/install-cli-windows",
              "build/cli/install-cli/install-cli-linux",
              "build/cli/install-cli/install-cli-specific-version",
            ],
          }),
          group("build.group.cli.setup-cli", {
            collapsed: true,
            items: ["build/cli/setup-cli", "build/cli/setup-cli/install-move-prover"],
          }),
          group("build.group.cli.trying-things-on-chain", {
            collapsed: true,
            items: [
              "build/cli/trying-things-on-chain",
              "build/cli/trying-things-on-chain/create-test-accounts",
              "build/cli/trying-things-on-chain/looking-up-account-info",
              "build/cli/trying-things-on-chain/ledger",
              "build/cli/managing-a-network-node",
              "build/cli/running-a-local-network",
              "build/cli/public-network",
            ],
          }),
          group("build.group.cli.working-with-move-contracts", {
            collapsed: true,
            items: [
              "build/cli/working-with-move-contracts",
              "build/cli/formatting-move-contracts",
              "build/cli/start-from-template",
              "build/cli/replay-past-transactions",
              "build/cli/working-with-move-contracts/local-simulation-benchmarking-and-gas-profiling",
              "build/cli/working-with-move-contracts/arguments-in-json-tutorial",
              "build/cli/working-with-move-contracts/multi-signature-tutorial",
            ],
          }),
        ],
      }),

      // Create Aptos DApp
      group("build.group.createAptosDapp", {
        collapsed: true,
        items: ["build/create-aptos-dapp", "build/create-aptos-dapp/faq"],
      }),
      "network/faucet",
      {
        label: "Sign in with Aptos (SIWA)",
        link: "https://siwa.aptos.dev",
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
      group("smartContracts.group.moveBook", {
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
      }),

      // Development
      group("smartContracts.group.development", {
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
      }),

      // Aptos Features
      group("smartContracts.group.aptosFeatures", {
        collapsed: true,
        items: [
          group("smartContracts.group.aptosFeatures.objects", {
            collapsed: true,
            items: [
              "build/smart-contracts/objects",
              "build/smart-contracts/object/creating-objects",
              "build/smart-contracts/object/using-objects",
            ],
          }),
          group("smartContracts.group.aptosFeatures.aptosStandards", {
            collapsed: true,
            items: [
              "build/smart-contracts/aptos-standards",
              group("smartContracts.group.aptosFeatures.aptosStandards.fungibleTokens", {
                collapsed: true,
                items: [
                  "build/smart-contracts/fungible-asset",
                  "build/smart-contracts/aptos-coin",
                  "build/smart-contracts/confidential-asset",
                ],
              }),
              group("smartContracts.group.aptosFeatures.aptosStandards.nonFungibleTokens", {
                collapsed: true,
                items: [
                  "build/smart-contracts/tokens",
                  "build/smart-contracts/digital-asset",
                  "build/smart-contracts/aptos-token",
                ],
              }),
            ],
          }),
          group("smartContracts.group.aptosFeatures.dataStructures", {
            collapsed: true,
            items: [
              "build/smart-contracts/maps",
              "build/smart-contracts/smart-table",
              "build/smart-contracts/smart-vector",
              "build/smart-contracts/table",
              "build/smart-contracts/vector",
            ],
          }),
          "build/smart-contracts/bcs",
          "build/smart-contracts/modules-on-aptos",
          "build/smart-contracts/resource-accounts",
          "build/smart-contracts/cryptography",
          "build/smart-contracts/randomness",
        ],
      }),

      // Tooling
      group("smartContracts.group.tooling", {
        collapsed: true,
        items: [
          "build/smart-contracts/move-vscode-extension",
          "build/smart-contracts/linter",
          "build/smart-contracts/compiler_v2",
          group("smartContracts.group.tooling.move-prover", {
            collapsed: true,
            items: [
              "build/smart-contracts/prover",
              "build/smart-contracts/prover/prover-guide",
              "build/smart-contracts/prover/spec-lang",
              "build/smart-contracts/prover/supporting-resources",
            ],
          }),
        ],
      }),

      // Reference
      group("smartContracts.group.reference", {
        collapsed: true,
        items: [
          { label: "Framework Reference", link: "move-reference" },
          { label: "Aptos Framework", link: "move-reference/mainnet/aptos-framework" },
          { label: "Aptos Standard Library", link: "move-reference/mainnet/aptos-stdlib" },
          { label: "Move Standard Library", link: "move-reference/mainnet/move-stdlib" },
          { label: "Aptos Token Objects", link: "move-reference/mainnet/aptos-token-objects" },
          { label: "Aptos Token (Legacy)", link: "move-reference/mainnet/aptos-token" },
          "build/smart-contracts/error-codes",
        ],
      }),

      "build/smart-contracts/book/move-2", // Release Notes
    ],
  }),

  // --- NODES Tab ---
  group("nodes", {
    collapsed: true,
    items: [
      "network/nodes", // Added Nodes Overview/Landing page

      // Validator Node
      group("network.group.validatorNode", {
        collapsed: true,
        items: [
          "network/nodes/validator-node",
          group("network.group.validatorNode.runValidators", {
            collapsed: true,
            items: [
              "network/nodes/validator-node/node-requirements",
              group("network.group.validatorNode.deployNodes", {
                collapsed: true,
                items: [
                  "network/nodes/validator-node/deploy-nodes",
                  "network/nodes/validator-node/deploy-nodes/using-source-code",
                  "network/nodes/validator-node/deploy-nodes/using-docker",
                  "network/nodes/validator-node/deploy-nodes/using-aws",
                  "network/nodes/validator-node/deploy-nodes/using-azure",
                  "network/nodes/validator-node/deploy-nodes/using-gcp",
                ],
              }),
              group("network.group.validatorNode.connectNodes", {
                collapsed: true,
                items: [
                  "network/nodes/validator-node/connect-nodes",
                  "network/nodes/validator-node/connect-nodes/connect-to-aptos-network",
                ],
              }),
              group("network.group.validatorNode.poolOperations", {
                collapsed: true,
                items: [
                  "network/nodes/validator-node/connect-nodes/delegation-pool-operations",
                  "network/nodes/validator-node/connect-nodes/staking-pool-operations",
                  "network/nodes/validator-node/connect-nodes/staking-pool-voter",
                ],
              }),
            ],
          }),
          group("network.group.validatorNode.configureValidators", {
            collapsed: true,
            items: [
              "network/nodes/validator-node/modify-nodes",
              "network/nodes/validator-node/modify-nodes/update-validator-node",
              "network/nodes/validator-node/modify-nodes/shutting-down-nodes",
              "network/nodes/validator-node/modify-nodes/rotate-consensus-key",
            ],
          }),
          group("network.group.validatorNode.monitorValidators", {
            collapsed: true,
            items: [
              "network/nodes/validator-node/verify-nodes",
              "network/nodes/validator-node/verify-nodes/node-liveness-criteria",
              "network/nodes/validator-node/verify-nodes/leaderboard-metrics",
            ],
          }),
        ],
      }),

      // Full Node
      group("network.group.fullNode", {
        collapsed: true,
        items: [
          "network/nodes/full-node",
          group("network.group.fullNode.runFullNodes", {
            collapsed: true,
            items: [
              "network/nodes/full-node/pfn-requirements",
              group("network.group.fullNode.deployFullNodes", {
                collapsed: true,
                items: [
                  "network/nodes/full-node/deployments",
                  "network/nodes/full-node/deployments/using-source-code",
                  "network/nodes/full-node/deployments/using-docker",
                  "network/nodes/full-node/deployments/using-gcp",
                ],
              }),
              "network/nodes/full-node/verify-pfn",
            ],
          }),
          group("network.group.fullNode.modifyFullNodes", {
            collapsed: true,
            items: [
              "network/nodes/full-node/modify",
              "network/nodes/full-node/modify/update-fullnode-with-new-releases",
              "network/nodes/full-node/modify/network-identity-fullnode",
              "network/nodes/full-node/modify/fullnode-network-connections",
            ],
          }),
          group("network.group.fullNode.bootstrapFullnode", {
            collapsed: true,
            items: [
              "network/nodes/bootstrap-fullnode",
              "network/nodes/bootstrap-fullnode/bootstrap-fullnode",
              "network/nodes/bootstrap-fullnode/aptos-db-restore",
            ],
          }),
        ],
      }),

      // Configure
      group("network.group.configure", {
        collapsed: true,
        items: [
          "network/nodes/configure",
          "network/nodes/configure/consensus-observer",
          "network/nodes/configure/state-sync",
          "network/nodes/configure/data-pruning",
          "network/nodes/configure/telemetry",
        ],
      }),

      // Monitor
      group("network.group.measure", {
        collapsed: true,
        items: [
          "network/nodes/measure",
          "network/nodes/measure/node-inspection-service",
          "network/nodes/measure/important-metrics",
          group("network.group.measure.nodeHealthChecker", {
            collapsed: true,
            items: [
              "network/nodes/measure/node-health-checker",
              "network/nodes/measure/node-health-checker-faq",
            ],
          }),
        ],
      }),

      // Network Information
      group("network.group.networkInformation", {
        collapsed: true,
        items: [
          "network/nodes/networks",
          "network/releases",
          group("network.group.networkInformation.locatingNetworkFiles", {
            collapsed: true,
            items: [
              "network/nodes/configure/node-files-all-networks",
              "network/nodes/configure/node-files-all-networks/node-files-mainnet",
              "network/nodes/configure/node-files-all-networks/node-files-testnet",
              "network/nodes/configure/node-files-all-networks/node-files-devnet",
            ],
          }),
        ],
      }),

      // Localnet
      group("network.group.localnet", {
        collapsed: true,
        items: [
          "network/nodes/localnet",
          "network/nodes/localnet/local-development-network",
          "network/nodes/localnet/run-a-localnet",
          "network/nodes/localnet/run-a-multinode-localnet",
        ],
      }),
    ],
  }),

  // --- CONCEPTS Tab ---
  group("concepts", {
    collapsed: true,
    items: [
      // Blockchain Fundamentals
      group("network.group.blockchain", {
        collapsed: true,
        items: [
          "network/blockchain",
          "network/blockchain/aptos-white-paper",
          "network/blockchain/blockchain-deep-dive",
          "network/blockchain/blocks",
          "network/blockchain/move",
        ],
      }),

      // Execution & Transactions
      group("network.group.executionTransactions", {
        collapsed: true,
        items: [
          "network/blockchain/execution",
          "network/blockchain/gas-txn-fee",
          "network/blockchain/base-gas",
          "network/blockchain/txns-states",
          "network/blockchain/events",
        ],
      }),

      // Accounts & Resources
      group("network.group.accountsResources", {
        collapsed: true,
        items: ["network/blockchain/accounts", "network/blockchain/resources"],
      }),

      // Network & Nodes
      group("network.group.networkNodes", {
        collapsed: true,
        items: [
          "network/blockchain/validator-nodes",
          "network/blockchain/fullnodes",
          "network/blockchain/node-networks-sync",
        ],
      }),

      // Staking & Governance
      group("network.group.stakingGovernance", {
        collapsed: true,
        items: [
          "network/blockchain/staking",
          "network/blockchain/delegated-staking",
          "network/blockchain/governance",
        ],
      }),
    ],
  }),

  // --- REFERENCE Tab (Focus: API/Tool Lookup) ---
  group("reference", {
    items: [
      // AIPs
      group("build.group.aips", {
        collapsed: true,
        items: ["build/aips", "build/aips/aip-88", "build/aips/aip-115"],
      }),
      "network/glossary",
      "build/indexer/indexer-api/indexer-reference",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      ...(openAPISidebarGroups as never[]),
    ],
  }),

  group("ai", {
    items: [
      group("ai.group.aptos-mcp", {
        collapsed: true,
        items: ["build/ai/aptos-mcp", "build/ai/aptos-mcp/claude", "build/ai/aptos-mcp/cursor"],
      }),
      {
        label: "LLMs.txt",
        link: "llms-txt",
        badge: { text: "NEW", variant: "tip" },
      },
    ],
  }),

  // --- CONTRIBUTE Tab ---
  // TODO" For now hide the contribute section until we have more content and a better icon
  /*group("contribute", {
    items: ["contribute/components/themed-image"],
  }),*/
] satisfies StarlightUserConfig["sidebar"];
