/**
 * Turkish labels for navigation items
 * Keys correspond to identifiers used in sidebar configuration
 */
const labels = {
  // Top Level
  sdksAndTools: "SDK'lar ve Araçlar",
  smartContracts: "Akıllı Sözleşmeler",
  guides: "Kılavuzlar",
  nodes: "Düğümler",
  concepts: "Kavramlar",
  reference: "Referans",
  ai: "AI ve LLMs",
  contribute: "Katkıda Bulun",

  // Build Sub-Groups
  "build.group.sdks": "SDK'lar",
  "build.group.sdks.ts-sdk": "TypeScript SDK",
  "build.group.sdks.ts-sdk.accounts": "Hesaplar",
  "build.group.sdks.ts-sdk.building-transactions": "İşlem Oluşturma",
  "build.group.sdks.ts-sdk.legacy-ts-sdk": "Eski TS SDK",
  "build.group.sdks.go-sdk": "Go SDK",
  "build.group.sdks.go-sdk.building-transactions": "İşlem Oluşturma",
  "build.group.sdks.dotnet-sdk": ".NET SDK",
  "build.group.sdks.dotnet-sdk.accounts": "Hesaplar",
  "build.group.sdks.dotnet-sdk.queries": "Sorgular",
  "build.group.sdks.dotnet-sdk.transactions": "İşlemler",
  "build.group.sdks.python-sdk": "Python SDK",
  "build.group.sdks.unity-sdk": "Unity SDK",
  "build.group.sdks.cpp-sdk": "C++ SDK",
  "build.group.sdks.rust-sdk": "Rust SDK",
  "build.group.sdks.wallet-adapter": "Cüzdan Adaptörü",
  "build.group.sdks.community-sdks": "Topluluk SDK'ları",
  "build.group.sdks.react-hooks": "React Hooks",
  "build.group.sdks.community-sdks.kotlin-sdk": "Kotlin SDK",
  "build.group.sdks.community-sdks.swift-sdk": "Swift SDK",
  "build.group.sdks.community-sdks.unity-opendive-sdk": "Unity OpenDive SDK",
  "build.group.sdks.community-sdks.kotlin-sdk.for-ios-devs": "iOS Geliştiricileri İçin",
  "build.group.sdks.official": "Resmi",
  "build.group.sdks.community": "Topluluk",
  "build.group.apis": "API'ler",
  "build.group.indexer": "İndeksleyici",
  "build.group.indexer.indexer-api": "İndeksleyici API",
  "build.group.indexer.indexer-sdk": "İndeksleyici SDK",
  "build.group.indexer.indexer-sdk.documentation": "Dokümantasyon",
  "build.group.indexer.indexer-sdk.quickstart": "Hızlı Başlangıç",
  "build.group.indexer.indexer-sdk.advanced-tutorials": "Gelişmiş Öğreticiler",
  "build.group.indexer.nft-aggregator": "NFT Toplayıcısı",
  "build.group.indexer.nft-aggregator.marketplaces": "Pazar Yerleri",
  "build.group.indexer.txn-stream": "İşlem Akışı",
  "build.group.indexer.legacy": "Eski",
  "build.group.cli": "CLI",
  "build.group.cli.install-cli": "CLI Yükle",
  "build.group.cli.setup-cli": "CLI Kurulumu",
  "build.group.cli.trying-things-on-chain": "Zincir Üzerinde Deneme",
  "build.group.cli.working-with-move-contracts": "Move Sözleşmeleri ile Çalışma",
  "build.group.createAptosDapp": "Aptos DApp Oluştur",
  "build.group.aips": "AIP'ler",

  // Smart Contracts & Move Sub-Groups
  "smartContracts.group.moveBook": "Move Kitabı",
  "smartContracts.group.development": "Geliştirme",
  "smartContracts.group.aptosFeatures": "Aptos Move Özellikleri",
  "smartContracts.group.aptosFeatures.objects": "Nesneler",
  "smartContracts.group.aptosFeatures.aptosStandards": "Aptos Standartları",
  "smartContracts.group.aptosFeatures.aptosStandards.fungibleTokens": "Değiştirilebilir Token'lar",
  "smartContracts.group.aptosFeatures.aptosStandards.nonFungibleTokens": "Değiştirilemez Token'lar",
  "smartContracts.group.aptosFeatures.dataStructures": "Veri Yapıları",
  "smartContracts.group.tooling": "Araçlar",
  "smartContracts.group.tooling.move-prover": "Move Prover",
  "smartContracts.group.reference": "Move Referansı",

  // Guides Sub-Groups
  "guides.group.getStarted": "Başla",
  "guides.group.beginner": "Başlangıç",
  "guides.group.beginner.e2e": "Uçtan Uca DApp Oluştur",
  "guides.group.advanced": "Gelişmiş",
  "guides.group.aptos-keyless": "Aptos Keyless",
  "guides.group.aptos-keyless.federated-keyless": "Federe Keyless",
  "guides.group.integration": "Entegrasyon",

  // Network Sub-Groups
  "network.group.validatorNode": "Doğrulayıcı Düğümleri",
  "network.group.validatorNode.runValidators": "Doğrulayıcıları Çalıştır",
  "network.group.validatorNode.deployNodes": "Düğümleri Dağıt",
  "network.group.validatorNode.connectNodes": "Düğümlere Bağlan",
  "network.group.validatorNode.poolOperations": "Havuz İşlemleri",
  "network.group.validatorNode.configureValidators": "Doğrulayıcıları Yapılandır",
  "network.group.validatorNode.monitorValidators": "Doğrulayıcıları İzle",
  "network.group.validatorNode.modifyNodes": "Düğümleri Değiştir",
  "network.group.validatorNode.verifyNodes": "Düğümleri Doğrula",
  "network.group.fullNode": "Tam Düğümler",
  "network.group.fullNode.runFullNodes": "Tam Düğümleri Çalıştır",
  "network.group.fullNode.deployFullNodes": "Tam Düğümleri Dağıt",
  "network.group.fullNode.modifyFullNodes": "Tam Düğümleri Değiştir",
  "network.group.fullNode.bootstrapFullnode": "Tam Düğüm Başlat",
  "network.group.fullNode.configure": "Yapılandır",
  "network.group.fullNode.configure.nodeFiles": "Düğüm Dosyaları",
  "network.group.fullNode.measure": "Ölç",
  "network.group.fullNode.verifyFullNodes": "Tam Düğümleri Doğrula",
  "network.group.fullNode.deployments": "Dağıtımlar",
  "network.group.fullNode.modify": "Değiştir",
  "network.group.bootstrapFullnode": "Tam Düğüm Başlat",
  "network.group.configure": "Yapılandır",
  "network.group.configure.nodeFiles": "Düğüm Dosyaları",
  "network.group.measure": "Ölç",
  "network.group.measure.nodeHealthChecker": "Düğüm Sağlık Denetleyicisi",
  "network.group.networkInformation": "Ağ Bilgileri",
  "network.group.networkInformation.locatingNetworkFiles": "Ağ Dosyalarını Bulma",
  "network.group.localnet": "Yerel Ağlar",
  "network.group.blockchain": "Blockchain Temelleri",
  "network.group.accountsResources": "Hesaplar ve Kaynaklar",
  "network.group.networkNodes": "Ağ ve Düğümler",
  "network.group.stakingGovernance": "Staking ve Yönetişim",
  "network.group.executionTransactions": "Yürütme ve İşlemler",

  // Reference Sub-Groups (Only has generated API and glossary for now)
  "reference.group.indexerApi": "İndeksleyici API",
  "reference.group.restApi": "REST API",

  // AI Sub-Groups
  "ai.group.aptos-mcp": "Aptos MCP",

  // Contribute Sub-Groups
  "contribute.group.components": "Bileşenler",
} as const;

type NavLabels = typeof labels;

export type NavKey = keyof NavLabels;

export default labels;
