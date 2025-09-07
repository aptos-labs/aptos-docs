/**
 * Arabic labels for navigation items
 * Keys correspond to identifiers used in sidebar configuration
 */
const labels = {
  // Top Level
  sdksAndTools: "SDK والأدوات",
  smartContracts: "العقود الذكية",
  guides: "الدليل",
  nodes: "العقد",
  concepts: "المفاهيم",
  reference: "المرجع",
  ai: "الذكاء الاصطناعي وLLMs",
  contribute: "المساهمة",

  // Build Sub-Groups
  "build.group.sdks": "SDK",
  "build.group.sdks.ts-sdk": "SDK TypeScript",
  "build.group.sdks.ts-sdk.accounts": "الحسابات",
  "build.group.sdks.ts-sdk.building-transactions": "بناء المعاملات",
  "build.group.sdks.ts-sdk.legacy-ts-sdk": "SDK TS القديم",
  "build.group.sdks.go-sdk": "SDK Go",
  "build.group.sdks.go-sdk.building-transactions": "بناء المعاملات",
  "build.group.sdks.dotnet-sdk": "SDK .NET",
  "build.group.sdks.dotnet-sdk.accounts": "الحسابات",
  "build.group.sdks.dotnet-sdk.queries": "الاستعلامات",
  "build.group.sdks.dotnet-sdk.transactions": "المعاملات",
  "build.group.sdks.python-sdk": "SDK Python",
  "build.group.sdks.unity-sdk": "SDK Unity",
  "build.group.sdks.cpp-sdk": "SDK C++",
  "build.group.sdks.rust-sdk": "SDK Rust",
  "build.group.sdks.wallet-adapter": "محول المحفظة",
  "build.group.sdks.community-sdks": "SDK المجتمع",
  "build.group.sdks.react-hooks": "React Hooks",
  "build.group.sdks.community-sdks.kotlin-sdk": "SDK Kotlin",
  "build.group.sdks.community-sdks.swift-sdk": "SDK Swift",
  "build.group.sdks.community-sdks.unity-opendive-sdk": "SDK Unity OpenDive",
  "build.group.sdks.community-sdks.kotlin-sdk.for-ios-devs": "لمطوري iOS",
  "build.group.sdks.official": "رسمي",
  "build.group.sdks.community": "المجتمع",
  "build.group.apis": "API",
  "build.group.indexer": "الفهرس",
  "build.group.indexer.indexer-api": "API الفهرس",
  "build.group.indexer.indexer-sdk": "SDK الفهرس",
  "build.group.indexer.indexer-sdk.documentation": "التوثيق",
  "build.group.indexer.indexer-sdk.quickstart": "البدء السريع",
  "build.group.indexer.indexer-sdk.advanced-tutorials": "الدروس التعليمية المتقدمة",
  "build.group.indexer.nft-aggregator": "مجمع NFT",
  "build.group.indexer.nft-aggregator.marketplaces": "الأسواق",
  "build.group.indexer.txn-stream": "تدفق المعاملات",
  "build.group.indexer.legacy": "القديم",
  "build.group.cli": "CLI",
  "build.group.cli.install-cli": "تثبيت CLI",
  "build.group.cli.setup-cli": "إعداد CLI",
  "build.group.cli.trying-things-on-chain": "تجربة الأشياء على السلسلة",
  "build.group.cli.working-with-move-contracts": "العمل مع عقود Move",
  "build.group.createAptosDapp": "إنشاء DApp Aptos",
  "build.group.aips": "AIPs",

  // Smart Contracts & Move Sub-Groups
  "smartContracts.group.moveBook": "كتاب Move",
  "smartContracts.group.development": "التطوير",
  "smartContracts.group.aptosFeatures": "ميزات Aptos Move",
  "smartContracts.group.aptosFeatures.objects": "الكائنات",
  "smartContracts.group.aptosFeatures.aptosStandards": "معايير Aptos",
  "smartContracts.group.aptosFeatures.aptosStandards.fungibleTokens": "الرموز القابلة للاستبدال",
  "smartContracts.group.aptosFeatures.aptosStandards.nonFungibleTokens":
    "الرموز غير القابلة للاستبدال",
  "smartContracts.group.aptosFeatures.dataStructures": "هياكل البيانات",
  "smartContracts.group.tooling": "الأدوات",
  "smartContracts.group.tooling.move-prover": "Move Prover",
  "smartContracts.group.reference": "مرجع Move",

  // Guides Sub-Groups
  "guides.group.getStarted": "البدء",
  "guides.group.beginner": "المبتدئ",
  "guides.group.beginner.e2e": "بناء DApp E2E",
  "guides.group.advanced": "المتقدم",
  "guides.group.aptos-keyless": "Aptos Keyless",
  "guides.group.aptos-keyless.federated-keyless": "Keyless الموحد",
  "guides.group.integration": "التكامل",

  // Network Sub-Groups
  "network.group.validatorNode": "عقد التحقق",
  "network.group.validatorNode.runValidators": "تشغيل المتحققين",
  "network.group.validatorNode.deployNodes": "نشر العقد",
  "network.group.validatorNode.connectNodes": "ربط العقد",
  "network.group.validatorNode.poolOperations": "عمليات التجميع",
  "network.group.validatorNode.configureValidators": "تكوين المتحققين",
  "network.group.validatorNode.monitorValidators": "مراقبة المتحققين",
  "network.group.validatorNode.modifyNodes": "تعديل العقد",
  "network.group.validatorNode.verifyNodes": "التحقق من العقد",
  "network.group.fullNode": "العقد الكاملة",
  "network.group.fullNode.runFullNodes": "تشغيل العقد الكاملة",
  "network.group.fullNode.deployFullNodes": "نشر العقد الكاملة",
  "network.group.fullNode.modifyFullNodes": "تعديل العقد الكاملة",
  "network.group.fullNode.bootstrapFullnode": "تشغيل العقدة الكاملة",
  "network.group.fullNode.configure": "التكوين",
  "network.group.fullNode.configure.nodeFiles": "ملفات العقدة",
  "network.group.fullNode.measure": "القياس",
  "network.group.fullNode.verifyFullNodes": "التحقق من العقد الكاملة",
  "network.group.fullNode.deployments": "النشر",
  "network.group.fullNode.modify": "التعديل",
  "network.group.bootstrapFullnode": "تشغيل العقدة الكاملة",
  "network.group.configure": "التكوين",
  "network.group.configure.nodeFiles": "ملفات العقدة",
  "network.group.measure": "القياس",
  "network.group.measure.nodeHealthChecker": "مدقق صحة العقدة",
  "network.group.networkInformation": "معلومات الشبكة",
  "network.group.networkInformation.locatingNetworkFiles": "تحديد موقع ملفات الشبكة",
  "network.group.localnet": "الشبكات المحلية",
  "network.group.blockchain": "أساسيات البلوكشين",
  "network.group.accountsResources": "الحسابات والموارد",
  "network.group.networkNodes": "الشبكة والعقد",
  "network.group.stakingGovernance": "التحصيص والحوكمة",
  "network.group.executionTransactions": "التنفيذ والمعاملات",

  // Reference Sub-Groups (Only has generated API and glossary for now)
  "reference.group.indexerApi": "API الفهرس",
  "reference.group.restApi": "API REST",

  // AI Sub-Groups
  "ai.group.aptos-mcp": "Aptos MCP",

  // Contribute Sub-Groups
  "contribute.group.components": "المكونات",
} as const;

type NavLabels = typeof labels;

export type NavKey = keyof NavLabels;

export default labels;
