/**
 * Japanese labels for navigation items
 * Keys correspond to identifiers used in sidebar configuration
 */
const labels = {
  // Top Level
  sdksAndTools: "SDK & ツール",
  smartContracts: "スマートコントラクト",
  guides: "ガイド",
  nodes: "ノード",
  concepts: "概念",
  reference: "リファレンス",
  ai: "AI & LLMs",
  contribute: "貢献",

  // Build Sub-Groups
  "build.group.sdks": "SDK",
  "build.group.sdks.ts-sdk": "TypeScript SDK",
  "build.group.sdks.ts-sdk.accounts": "アカウント",
  "build.group.sdks.ts-sdk.building-transactions": "トランザクション構築",
  "build.group.sdks.ts-sdk.legacy-ts-sdk": "レガシー TS SDK",
  "build.group.sdks.go-sdk": "Go SDK",
  "build.group.sdks.go-sdk.building-transactions": "トランザクション構築",
  "build.group.sdks.dotnet-sdk": ".NET SDK",
  "build.group.sdks.dotnet-sdk.accounts": "アカウント",
  "build.group.sdks.dotnet-sdk.queries": "クエリ",
  "build.group.sdks.dotnet-sdk.transactions": "トランザクション",
  "build.group.sdks.python-sdk": "Python SDK",
  "build.group.sdks.unity-sdk": "Unity SDK",
  "build.group.sdks.cpp-sdk": "C++ SDK",
  "build.group.sdks.rust-sdk": "Rust SDK",
  "build.group.sdks.wallet-adapter": "ウォレットアダプタ",
  "build.group.sdks.community-sdks": "コミュニティ SDK",
  "build.group.sdks.react-hooks": "React Hooks",
  "build.group.sdks.community-sdks.kotlin-sdk": "Kotlin SDK",
  "build.group.sdks.community-sdks.swift-sdk": "Swift SDK",
  "build.group.sdks.community-sdks.unity-opendive-sdk": "Unity OpenDive SDK",
  "build.group.sdks.community-sdks.kotlin-sdk.for-ios-devs": "iOS開発者向け",
  "build.group.sdks.official": "公式",
  "build.group.sdks.community": "コミュニティ",
  "build.group.apis": "API",
  "build.group.indexer": "インデクサー",
  "build.group.indexer.indexer-api": "インデクサー API",
  "build.group.indexer.indexer-sdk": "インデクサー SDK",
  "build.group.indexer.indexer-sdk.documentation": "ドキュメント",
  "build.group.indexer.indexer-sdk.quickstart": "クイックスタート",
  "build.group.indexer.indexer-sdk.advanced-tutorials": "高度なチュートリアル",
  "build.group.indexer.nft-aggregator": "NFTアグリゲーター",
  "build.group.indexer.nft-aggregator.marketplaces": "マーケットプレイス",
  "build.group.indexer.txn-stream": "トランザクションストリーム",
  "build.group.indexer.legacy": "レガシー",
  "build.group.cli": "CLI",
  "build.group.cli.install-cli": "CLI インストール",
  "build.group.cli.setup-cli": "CLI 設定",
  "build.group.cli.trying-things-on-chain": "チェーン上のテスト",
  "build.group.cli.working-with-move-contracts": "Moveコントラクトの操作",
  "build.group.createAptosDapp": "Aptos DApp 作成",
  "build.group.aips": "AIPs",

  // Smart Contracts & Move Sub-Groups
  "smartContracts.group.moveBook": "Moveブック",
  "smartContracts.group.development": "開発",
  "smartContracts.group.aptosFeatures": "Aptos Move 機能",
  "smartContracts.group.aptosFeatures.objects": "オブジェクト",
  "smartContracts.group.aptosFeatures.aptosStandards": "Aptos 標準",
  "smartContracts.group.aptosFeatures.aptosStandards.fungibleTokens": "代替可能トークン",
  "smartContracts.group.aptosFeatures.aptosStandards.nonFungibleTokens": "非代替可能トークン",
  "smartContracts.group.aptosFeatures.dataStructures": "データ構造",
  "smartContracts.group.tooling": "ツール",
  "smartContracts.group.tooling.move-prover": "Move Prover",
  "smartContracts.group.reference": "Move リファレンス",

  // Guides Sub-Groups
  "guides.group.getStarted": "はじめに",
  "guides.group.beginner": "初心者",
  "guides.group.beginner.e2e": "E2E DApp 構築",
  "guides.group.advanced": "上級",
  "guides.group.aptos-keyless": "Aptos Keyless",
  "guides.group.aptos-keyless.federated-keyless": "連合 Keyless",
  "guides.group.integration": "統合",

  // Network Sub-Groups
  "network.group.validatorNode": "バリデーションノード",
  "network.group.validatorNode.runValidators": "バリデーター実行",
  "network.group.validatorNode.deployNodes": "ノード展開",
  "network.group.validatorNode.connectNodes": "ノード接続",
  "network.group.validatorNode.poolOperations": "プール操作",
  "network.group.validatorNode.configureValidators": "バリデーター設定",
  "network.group.validatorNode.monitorValidators": "バリデーター監視",
  "network.group.validatorNode.modifyNodes": "ノード修正",
  "network.group.validatorNode.verifyNodes": "ノード検証",
  "network.group.fullNode": "フルノード",
  "network.group.fullNode.runFullNodes": "フルノード実行",
  "network.group.fullNode.deployFullNodes": "フルノード展開",
  "network.group.fullNode.modifyFullNodes": "フルノード修正",
  "network.group.fullNode.bootstrapFullnode": "ブートストラップ フルノード",
  "network.group.fullNode.configure": "設定",
  "network.group.fullNode.configure.nodeFiles": "ノードファイル",
  "network.group.fullNode.measure": "測定",
  "network.group.fullNode.verifyFullNodes": "フルノード検証",
  "network.group.fullNode.deployments": "展開",
  "network.group.fullNode.modify": "修正",
  "network.group.bootstrapFullnode": "ブートストラップ フルノード",
  "network.group.configure": "設定",
  "network.group.configure.nodeFiles": "ノードファイル",
  "network.group.measure": "測定",
  "network.group.measure.nodeHealthChecker": "ノードヘルスチェッカー",
  "network.group.networkInformation": "ネットワーク情報",
  "network.group.networkInformation.locatingNetworkFiles": "ネットワークファイルの場所特定",
  "network.group.localnet": "ローカルネットワーク",
  "network.group.blockchain": "ブロックチェーン基礎",
  "network.group.accountsResources": "アカウント & リソース",
  "network.group.networkNodes": "ネットワーク & ノード",
  "network.group.stakingGovernance": "ステーキング & ガバナンス",
  "network.group.executionTransactions": "実行 & トランザクション",

  // Reference Sub-Groups (Only has generated API and glossary for now)
  "reference.group.indexerApi": "インデクサー API",
  "reference.group.restApi": "REST API",

  // AI Sub-Groups
  "ai.group.aptos-mcp": "Aptos MCP",

  // Languages Sub-Groups
  "languages.group.translationStatus": "翻訳状況",

  // Contribute Sub-Groups
  "contribute.group.components": "コンポーネント",
} as const;

type NavLabels = typeof labels;

export type NavKey = keyof NavLabels;

export default labels;
