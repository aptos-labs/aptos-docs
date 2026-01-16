/**
 * English labels for navigation items
 * Keys correspond to identifiers used in sidebar configuration
 */
const labels = {
  // Top Level
  sdksAndTools: "SDKs & Tools",
  smartContracts: "Smart Contracts",
  guides: "Guides",
  nodes: "Nodes",
  concepts: "Concepts",
  reference: "Reference",
  ai: "AI and LLMs",
  contribute: "Contribute",
  resources: "External Resources",

  // Build Sub-Groups
  "build.group.sdks": "SDKs",
  "build.group.sdks.ts-sdk": "TypeScript SDK",
  "build.group.sdks.ts-sdk.accounts": "Accounts",
  "build.group.sdks.ts-sdk.building-transactions": "Building Transactions",
  "build.group.sdks.ts-sdk.legacy-ts-sdk": "Legacy TS SDK",
  "build.group.sdks.go-sdk": "Go SDK",
  "build.group.sdks.go-sdk.building-transactions": "Building Transactions",
  "build.group.sdks.dotnet-sdk": ".NET SDK",
  "build.group.sdks.dotnet-sdk.accounts": "Accounts",
  "build.group.sdks.dotnet-sdk.queries": "Queries",
  "build.group.sdks.dotnet-sdk.transactions": "Transactions",
  "build.group.sdks.java-sdk": "Java SDK",
  "build.group.sdks.python-sdk": "Python SDK",
  "build.group.sdks.unity-sdk": "Unity SDK",
  "build.group.sdks.cpp-sdk": "C++ SDK",
  "build.group.sdks.rust-sdk": "Rust SDK",
  "build.group.sdks.wallet-adapter": "Wallet Adapter",
  "build.group.sdks.community-sdks": "Community SDKs",
  "build.group.sdks.react-hooks": "React Hooks",
  "build.group.sdks.community-sdks.kotlin-sdk": "Kotlin SDK",
  "build.group.sdks.community-sdks.swift-sdk": "Swift SDK",
  "build.group.sdks.community-sdks.unity-opendive-sdk": "Unity OpenDive SDK",
  "build.group.sdks.community-sdks.kotlin-sdk.for-ios-devs": "For iOS Developers",
  "build.group.sdks.official": "Official",
  "build.group.sdks.community": "Community",
  "build.group.apis": "APIs",
  "build.group.indexer": "Indexer",
  "build.group.indexer.indexer-api": "Indexer API",
  "build.group.indexer.indexer-sdk": "Indexer SDK",
  "build.group.indexer.indexer-sdk.documentation": "Documentation",
  "build.group.indexer.indexer-sdk.quickstart": "Quickstart",
  "build.group.indexer.indexer-sdk.advanced-tutorials": "Advanced Tutorials",
  "build.group.indexer.nft-aggregator": "NFT Aggregator",
  "build.group.indexer.nft-aggregator.marketplaces": "Marketplaces",
  "build.group.indexer.txn-stream": "Transaction Stream",
  "build.group.indexer.legacy": "Legacy",
  "build.group.cli": "CLI",
  "build.group.cli.install-cli": "Install CLI",
  "build.group.cli.setup-cli": "Setup CLI",
  "build.group.cli.trying-things-on-chain": "Trying Things On Chain",
  "build.group.cli.working-with-move-contracts": "Working with Move Contracts",
  "build.group.createAptosDapp": "Create Aptos DApp",
  "build.group.aips": "AIPs",

  // Smart Contracts & Move Sub-Groups
  "smartContracts.group.moveBook": "Move Book",
  "smartContracts.group.development": "Development",
  "smartContracts.group.aptosFeatures": "Aptos Move Features",
  "smartContracts.group.aptosFeatures.objects": "Objects",
  "smartContracts.group.aptosFeatures.aptosStandards": "Aptos Standards",
  "smartContracts.group.aptosFeatures.aptosStandards.fungibleTokens": "Fungible Tokens",
  "smartContracts.group.aptosFeatures.aptosStandards.nonFungibleTokens": "Non-Fungible Tokens",
  "smartContracts.group.aptosFeatures.dataStructures": "Data Structures",
  "smartContracts.group.tooling": "Tooling",
  "smartContracts.group.tooling.move-prover": "Move Prover",
  "smartContracts.group.reference": "Move Reference",

  // Guides Sub-Groups
  "guides.group.getStarted": "Get Started",
  "guides.group.beginner": "Beginner",
  "guides.group.beginner.e2e": "Build E2E DApp",
  "guides.group.advanced": "Advanced",
  "guides.group.aptos-keyless": "Aptos Keyless",
  "guides.group.aptos-keyless.federated-keyless": "Federated Keyless",
  "guides.group.integration": "Integration",

  // Network Sub-Groups
  "network.group.validatorNode": "Validator Nodes",
  "network.group.validatorNode.runValidators": "Run Validators",
  "network.group.validatorNode.deployNodes": "Deploy Nodes",
  "network.group.validatorNode.connectNodes": "Connect Nodes",
  "network.group.validatorNode.poolOperations": "Pool Operations",
  "network.group.validatorNode.configureValidators": "Configure Validators",
  "network.group.validatorNode.monitorValidators": "Monitor Validators",
  "network.group.validatorNode.modifyNodes": "Modify Nodes",
  "network.group.validatorNode.verifyNodes": "Verify Nodes",
  "network.group.fullNode": "Full Nodes",
  "network.group.fullNode.runFullNodes": "Run Full Nodes",
  "network.group.fullNode.deployFullNodes": "Deploy Full Nodes",
  "network.group.fullNode.modifyFullNodes": "Modify Full Nodes",
  "network.group.fullNode.bootstrapFullnode": "Bootstrap Fullnode",
  "network.group.fullNode.configure": "Configure",
  "network.group.fullNode.configure.nodeFiles": "Node Files",
  "network.group.fullNode.measure": "Measure",
  "network.group.fullNode.verifyFullNodes": "Verify Full Nodes",
  "network.group.fullNode.deployments": "Deployments",
  "network.group.fullNode.modify": "Modify",
  "network.group.bootstrapFullnode": "Bootstrap Fullnode",
  "network.group.configure": "Configure",
  "network.group.configure.nodeFiles": "Node Files",
  "network.group.measure": "Measure",
  "network.group.measure.nodeHealthChecker": "Node Health Checker",
  "network.group.networkInformation": "Network Information",
  "network.group.networkInformation.locatingNetworkFiles": "Locating Network Files",
  "network.group.localnet": "Local Networks",
  "network.group.blockchain": "Blockchain Fundamentals",
  "network.group.accountsResources": "Accounts & Resources",
  "network.group.networkNodes": "Network & Nodes",
  "network.group.stakingGovernance": "Staking & Governance",
  "network.group.executionTransactions": "Execution & Transactions",

  // Reference Sub-Groups (Only has generated API and glossary for now)
  "reference.group.indexerApi": "Indexer API",
  "reference.group.restApi": "REST API",

  // AI Sub-Groups
  "ai.group.aptos-mcp": "Aptos MCP",

  // Contribute Sub-Groups
  "contribute.group.components": "Components",
} as const;

type NavLabels = typeof labels;

export type NavKey = keyof NavLabels;

export default labels;
