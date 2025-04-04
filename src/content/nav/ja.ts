import { navDictionary } from "../../util/navDictionary";

/**
 * Japanese labels for navigation items
 * Keys correspond to identifiers used in sidebar configuration
 */

export default navDictionary({
  // Top Level
  build: "構築", // Build
  network: "ネットワーク", // Network
  smartContracts: "スマートコントラクト & Move", // Smart Contracts & Move
  guides: "ガイド", // Guides
  reference: "リファレンス", // Reference

  // Build Sub-Groups
  "build.group.sdks": "SDK", // SDKs
  "build.group.sdks.official": "公式", // Official
  "build.group.sdks.community": "コミュニティ", // Community (Removed & Legacy)

  // Network Sub-Groups
  "network.group.blockchain": "ブロックチェーン", // Blockchain
  "network.group.nodes": "ノード", // Nodes

  // Smart Contracts & Move Sub-Groups
  "smartContracts.group.moveBook": "Move言語の概念", // Move Language Concepts
  "smartContracts.group.development": "開発", // Development
  "smartContracts.group.aptosFeatures": "Aptos Moveの機能", // Aptos Move Features
  "smartContracts.group.tooling": "ツール", // Tooling
  "smartContracts.group.reference": "Moveリファレンス", // Move Reference

  // Guides Sub-Groups
  "guides.group.beginner": "初心者", // Beginner
  "guides.group.advanced": "上級者", // Advanced

  // Reference Sub-Groups (Currently none needed based on sidebar structure)
});
