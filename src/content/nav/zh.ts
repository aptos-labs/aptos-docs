import { navDictionary } from "../../utils/navDictionary.ts";

/**
 * Simplified Chinese labels for navigation items
 * Keys correspond to identifiers used in sidebar configuration
 */

export default navDictionary({
  // Top Level
  sdksAndTools: "SDK 和工具",
  nodes: "节点",
  concepts: "概念",
  smartContracts: "智能合约", // Smart Contracts
  guides: "指南", // Guides
  reference: "参考", // Reference
  ai: "AI 和 LLMs",
  contribute: "贡献", // Contribute

  // Build Sub-Groups
  "build.group.sdks": "SDK",
  "build.group.sdks.ts-sdk": "TypeScript SDK",
  "build.group.sdks.ts-sdk.accounts": "账户",
  "build.group.sdks.ts-sdk.building-transactions": "构建交易",
  "build.group.sdks.ts-sdk.legacy-ts-sdk": "旧版 TS SDK",
  "build.group.sdks.go-sdk": "Go SDK",
  "build.group.sdks.go-sdk.building-transactions": "构建交易",
  "build.group.sdks.dotnet-sdk": ".NET SDK",
  "build.group.sdks.dotnet-sdk.accounts": "账户",
  "build.group.sdks.dotnet-sdk.queries": "查询",
  "build.group.sdks.dotnet-sdk.transactions": "交易",
  "build.group.sdks.python-sdk": "Python SDK",
  "build.group.sdks.unity-sdk": "Unity SDK",
  "build.group.sdks.cpp-sdk": "C++ SDK",
  "build.group.sdks.rust-sdk": "Rust SDK",
  "build.group.sdks.wallet-adapter": "钱包适配器",
  "build.group.sdks.community-sdks": "社区 SDK",
  "build.group.sdks.react-hooks": "React Hooks",
  "build.group.sdks.community-sdks.kotlin-sdk": "Kotlin SDK",
  "build.group.sdks.community-sdks.swift-sdk": "Swift SDK",
  "build.group.sdks.community-sdks.unity-opendive-sdk": "Unity OpenDive SDK",
  "build.group.sdks.community-sdks.kotlin-sdk.for-ios-devs": "iOS 开发者专用",
  "build.group.sdks.official": "官方", // Official
  "build.group.sdks.community": "社区", // Community
  "build.group.apis": "API", // APIs
  "build.group.indexer": "索引器", // Indexer
  "build.group.indexer.indexer-api": "索引器 API", // Indexer API
  "build.group.indexer.indexer-sdk": "索引器 SDK", // Indexer SDK
  "build.group.indexer.indexer-sdk.documentation": "文档", // Documentation
  "build.group.indexer.indexer-sdk.quickstart": "快速开始", // Quickstart
  "build.group.indexer.indexer-sdk.advanced-tutorials": "高级教程", // Advanced Tutorials
  "build.group.indexer.nft-aggregator": "NFT 聚合器", // NFT Aggregator
  "build.group.indexer.nft-aggregator.marketplaces": "市场", // Marketplaces
  "build.group.indexer.txn-stream": "交易流", // Transaction Stream
  "build.group.indexer.legacy": "旧版索引器", // Legacy Indexer
  "build.group.cli": "命令行工具", // CLI
  "build.group.cli.install-cli": "安装 CLI", // Install CLI
  "build.group.cli.setup-cli": "设置 CLI", // Setup CLI
  "build.group.cli.trying-things-on-chain": "在链上尝试", // Trying Things On Chain
  "build.group.cli.working-with-move-contracts": "与 Move 合约一起工作", // Working with Move Contracts
  "build.group.aips": "AIP", // AIPs
  "build.group.createAptosDapp": "创建 Aptos 应用", // Create Aptos DApp

  // Smart Contracts & Move Sub-Groups
  "smartContracts.group.moveBook": "Move 语言概念", // Move Language Concepts
  "smartContracts.group.development": "开发", // Development
  "smartContracts.group.aptosFeatures.objects": "对象", // Objects
  "smartContracts.group.aptosFeatures.aptosStandards": "Aptos 标准", // Aptos Standards
  "smartContracts.group.aptosFeatures.aptosStandards.fungibleTokens": "同质化资产", // Fungible Tokens
  "smartContracts.group.aptosFeatures.aptosStandards.nonFungibleTokens": "非同质化资产", // Non-Fungible Tokens
  "smartContracts.group.aptosFeatures.dataStructures": "数据结构", // Data Structures
  "smartContracts.group.aptosFeatures": "Aptos Move 功能", // Aptos Move Features
  "smartContracts.group.tooling": "工具", // Tooling
  "smartContracts.group.tooling.move-prover": "Move Prover", // Move Prover
  "smartContracts.group.reference": "Move 参考", // Move Reference

  // Guides Sub-Groups
  "guides.group.getStarted": "开始使用", // Get Started
  "guides.group.beginner": "初学者", // Beginner
  "guides.group.beginner.e2e": "构建 E2E DApp", // Build E2E DApp
  "guides.group.advanced": "高级", // Advanced
  "guides.group.aptos-keyless": "Aptos 无密钥", // Aptos Keyless
  "guides.group.aptos-keyless.federated-keyless": "联邦无密钥", // Federated Keyless
  "guides.group.integration": "集成", // Integration

  // Network Sub-Groups
  "network.group.validatorNode": "验证者节点", // Validator Nodes
  "network.group.validatorNode.runValidators": "运行验证者", // Run Validators
  "network.group.validatorNode.deployNodes": "部署节点", // Deploy Nodes
  "network.group.validatorNode.connectNodes": "连接节点", // Connect Nodes
  "network.group.validatorNode.poolOperations": "池操作", // Pool Operations
  "network.group.validatorNode.configureValidators": "配置验证者", // Configure Validators
  "network.group.validatorNode.monitorValidators": "监控验证者", // Monitor Validators
  "network.group.validatorNode.modifyNodes": "修改节点", // Modify Nodes
  "network.group.validatorNode.verifyNodes": "验证节点", // Verify Nodes
  "network.group.fullNode": "全节点", // Full Nodes
  "network.group.fullNode.runFullNodes": "运行全节点", // Run Full Nodes
  "network.group.fullNode.deployFullNodes": "部署全节点", // Deploy Full Nodes
  "network.group.fullNode.modifyFullNodes": "修改全节点", // Modify Full Nodes
  "network.group.fullNode.bootstrapFullnode": "引导全节点", // Bootstrap Fullnode
  "network.group.fullNode.configure": "配置", // Configure
  "network.group.fullNode.configure.nodeFiles": "节点文件", // Node Files
  "network.group.fullNode.measure": "测量", // Measure
  "network.group.fullNode.verifyFullNodes": "验证全节点", // Verify Full Nodes
  "network.group.fullNode.deployments": "部署", // Deployments
  "network.group.fullNode.modify": "修改", // Modify
  "network.group.bootstrapFullnode": "引导全节点", // Bootstrap Fullnode
  "network.group.configure": "配置", // Configure
  "network.group.configure.nodeFiles": "节点文件", // Node Files
  "network.group.measure": "测量", // Measure
  "network.group.measure.nodeHealthChecker": "节点健康检查器", // Node Health Checker
  "network.group.networkInformation": "网络信息", // Network Information
  "network.group.networkInformation.locatingNetworkFiles": "定位网络文件", // Locating Network Files
  "network.group.localnet": "本地网络", // Local Networks
  "network.group.blockchain": "区块链基础", // Blockchain Fundamentals
  "network.group.accountsResources": "账户和资源", // Accounts & Resources
  "network.group.networkNodes": "网络和节点", // Network & Nodes
  "network.group.stakingGovernance": "质押和治理", // Staking & Governance
  "network.group.executionTransactions": "执行和交易", // Execution & Transactions

  // Reference Sub-Groups (Only has generated API and glossary for now)
  "reference.group.indexerApi": "Indexer API",
  "reference.group.restApi": "REST API",

  // AI Sub-Groups
  "ai.group.aptos-mcp": "Aptos MCP",

  // Languages Sub-Groups
  "languages.group.translationStatus": "翻译状态", // Translation Status

  // Contribute Sub-Groups
  "contribute.group.components": "组件", // Components
});
