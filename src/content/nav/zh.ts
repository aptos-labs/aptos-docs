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
  contribute: "贡献", // Contribute

  // Build Sub-Groups
  "build.group.sdks": "SDK", // SDKs (often kept as "SDK" or "开发工具包")
  "build.group.sdks.official": "官方", // Official
  "build.group.sdks.community": "社区", // Community
  "build.group.apis": "API", // APIs
  "build.group.indexer": "索引器", // Indexer
  "build.group.cli": "命令行工具", // CLI
  "build.group.aips": "AIP", // AIPs
  "build.group.createAptosDapp": "创建 Aptos 应用", // Create Aptos DApp

  // Smart Contracts & Move Sub-Groups
  "smartContracts.group.moveBook": "Move 语言概念", // Move Language Concepts
  "smartContracts.group.development": "开发", // Development
  "smartContracts.group.aptosFeatures": "Aptos Move 功能", // Aptos Move Features
  "smartContracts.group.tooling": "工具", // Tooling
  "smartContracts.group.reference": "Move 参考", // Move Reference

  // Guides Sub-Groups
  "guides.group.getStarted": "开始使用", // Get Started
  "guides.group.beginner": "初学者", // Beginner
  "guides.group.advanced": "高级", // Advanced

  // Network Sub-Groups
  "network.group.blockchain": "区块链", // Blockchain
  "network.group.localnet": "本地网络", // Localnet
  "network.group.validatorNode": "验证者节点", // Validator Node
  "network.group.validatorNode.connectNodes": "连接节点", // Connect Nodes
  "network.group.validatorNode.deployNodes": "部署节点", // Deploy Nodes
  "network.group.validatorNode.modifyNodes": "修改节点", // Modify Nodes
  "network.group.validatorNode.verifyNodes": "验证节点", // Verify Nodes
  "network.group.fullNode": "全节点", // Full Node
  "network.group.fullNode.deployments": "部署", // Deployments
  "network.group.fullNode.modify": "修改", // Modify
  "network.group.bootstrapFullnode": "引导全节点", // Bootstrap Fullnode
  "network.group.configure": "配置", // Configure
  "network.group.configure.nodeFiles": "节点文件", // Node Files
  "network.group.measure": "测量", // Measure

  // Reference Sub-Groups (Only has generated API and glossary for now)
  "reference.group.indexerApi": "Indexer API",
  "reference.group.restApi": "REST API",

  // Contribute Sub-Groups
  "contribute.group.components": "组件", // Components
});
