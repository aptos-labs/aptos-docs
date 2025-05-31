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

  // Build Sub-Groups
  "build.group.sdks": "SDK", // SDKs (often kept as "SDK" or "开发工具包")
  "build.group.sdks.official": "官方", // Official
  "build.group.sdks.community": "社区", // Community

  // Smart Contracts & Move Sub-Groups
  "smartContracts.group.moveBook": "Move 语言概念", // Move Language Concepts
  "smartContracts.group.development": "开发", // Development
  "smartContracts.group.aptosFeatures": "Aptos Move 功能", // Aptos Move Features
  "smartContracts.group.tooling": "工具", // Tooling
  "smartContracts.group.reference": "Move 参考", // Move Reference

  // Guides Sub-Groups
  "guides.group.beginner": "初学者", // Beginner
  "guides.group.advanced": "高级", // Advanced

  // Reference Sub-Groups (Only has generated API and glossary for now)
  "reference.group.indexerApi": "Indexer API",
  "reference.group.restApi": "REST API",
});
