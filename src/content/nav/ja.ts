import { navDictionary } from "../../utils/navDictionary.ts";

/**
 * Japanese labels for navigation items
 * Keys correspond to identifiers used in sidebar configuration
 */

export default navDictionary({
  // Top Level
  sdksAndTools: "SDKとツール",
  nodes: "ノード",
  concepts: "コンセプト",
  smartContracts: "スマートコントラクト", // Smart Contracts
  guides: "ガイド", // Guides
  reference: "リファレンス", // Reference

  // Build Sub-Groups
  "build.group.sdks": "SDK", // SDKs
  "build.group.sdks.official": "公式", // Official
  "build.group.sdks.community": "コミュニティ", // Community (Removed & Legacy)

  // Smart Contracts & Move Sub-Groups
  "smartContracts.group.moveBook": "Move言語の概念", // Move Language Concepts
  "smartContracts.group.development": "開発", // Development
  "smartContracts.group.aptosFeatures": "Aptos Moveの機能", // Aptos Move Features
  "smartContracts.group.tooling": "ツール", // Tooling
  "smartContracts.group.reference": "Moveリファレンス", // Move Reference

  // Guides Sub-Groups
  "guides.group.beginner": "初心者", // Beginner
  "guides.group.advanced": "上級者", // Advanced

  // Reference Sub-Groups (Only has generated API and glossary for now)
  "reference.group.indexerApi": "Indexer API",
  "reference.group.restApi": "REST API",
});
