/**
 * French labels for navigation items
 * Keys correspond to identifiers used in sidebar configuration
 */
const labels = {
  // Top Level
  sdksAndTools: "SDKs & Outils",
  smartContracts: "Contrats Intelligents",
  guides: "Guides",
  nodes: "Nœuds",
  concepts: "Concepts",
  reference: "Référence",
  ai: "IA et LLMs",
  contribute: "Contribuer",

  // Build Sub-Groups
  "build.group.sdks": "SDKs",
  "build.group.sdks.ts-sdk": "SDK TypeScript",
  "build.group.sdks.ts-sdk.accounts": "Comptes",
  "build.group.sdks.ts-sdk.building-transactions": "Construction de Transactions",
  "build.group.sdks.ts-sdk.legacy-ts-sdk": "SDK TS Hérité",
  "build.group.sdks.go-sdk": "SDK Go",
  "build.group.sdks.go-sdk.building-transactions": "Construction de Transactions",
  "build.group.sdks.dotnet-sdk": "SDK .NET",
  "build.group.sdks.dotnet-sdk.accounts": "Comptes",
  "build.group.sdks.dotnet-sdk.queries": "Requêtes",
  "build.group.sdks.dotnet-sdk.transactions": "Transactions",
  "build.group.sdks.python-sdk": "SDK Python",
  "build.group.sdks.unity-sdk": "SDK Unity",
  "build.group.sdks.cpp-sdk": "SDK C++",
  "build.group.sdks.rust-sdk": "SDK Rust",
  "build.group.sdks.wallet-adapter": "Adaptateur de Portefeuille",
  "build.group.sdks.community-sdks": "SDKs Communautaires",
  "build.group.sdks.react-hooks": "React Hooks",
  "build.group.sdks.community-sdks.kotlin-sdk": "SDK Kotlin",
  "build.group.sdks.community-sdks.swift-sdk": "SDK Swift",
  "build.group.sdks.community-sdks.unity-opendive-sdk": "SDK Unity OpenDive",
  "build.group.sdks.community-sdks.kotlin-sdk.for-ios-devs": "Pour les Développeurs iOS",
  "build.group.sdks.official": "Officiel",
  "build.group.sdks.community": "Communauté",
  "build.group.apis": "APIs",
  "build.group.indexer": "Indexeur",
  "build.group.indexer.indexer-api": "API Indexeur",
  "build.group.indexer.indexer-sdk": "SDK Indexeur",
  "build.group.indexer.indexer-sdk.documentation": "Documentation",
  "build.group.indexer.indexer-sdk.quickstart": "Démarrage Rapide",
  "build.group.indexer.indexer-sdk.advanced-tutorials": "Tutoriels Avancés",
  "build.group.indexer.nft-aggregator": "Agrégateur NFT",
  "build.group.indexer.nft-aggregator.marketplaces": "Places de Marché",
  "build.group.indexer.txn-stream": "Flux de Transactions",
  "build.group.indexer.legacy": "Hérité",
  "build.group.cli": "CLI",
  "build.group.cli.install-cli": "Installer CLI",
  "build.group.cli.setup-cli": "Configuration CLI",
  "build.group.cli.trying-things-on-chain": "Essayer les Choses Sur la Chaîne",
  "build.group.cli.working-with-move-contracts": "Travailler avec les Contrats Move",
  "build.group.createAptosDapp": "Créer une DApp Aptos",
  "build.group.aips": "AIPs",

  // Smart Contracts & Move Sub-Groups
  "smartContracts.group.moveBook": "Livre Move",
  "smartContracts.group.development": "Développement",
  "smartContracts.group.aptosFeatures": "Fonctionnalités Aptos Move",
  "smartContracts.group.aptosFeatures.objects": "Objets",
  "smartContracts.group.aptosFeatures.aptosStandards": "Standards Aptos",
  "smartContracts.group.aptosFeatures.aptosStandards.fungibleTokens": "Jetons Fongibles",
  "smartContracts.group.aptosFeatures.aptosStandards.nonFungibleTokens": "Jetons Non Fongibles",
  "smartContracts.group.aptosFeatures.dataStructures": "Structures de Données",
  "smartContracts.group.tooling": "Outils",
  "smartContracts.group.tooling.move-prover": "Move Prover",
  "smartContracts.group.reference": "Référence Move",

  // Guides Sub-Groups
  "guides.group.getStarted": "Commencer",
  "guides.group.beginner": "Débutant",
  "guides.group.beginner.e2e": "Construire une DApp E2E",
  "guides.group.advanced": "Avancé",
  "guides.group.aptos-keyless": "Aptos Keyless",
  "guides.group.aptos-keyless.federated-keyless": "Keyless Fédéré",
  "guides.group.integration": "Intégration",

  // Network Sub-Groups
  "network.group.validatorNode": "Nœuds Validateur",
  "network.group.validatorNode.runValidators": "Exécuter les Validateurs",
  "network.group.validatorNode.deployNodes": "Déployer les Nœuds",
  "network.group.validatorNode.connectNodes": "Connecter les Nœuds",
  "network.group.validatorNode.poolOperations": "Opérations de Pool",
  "network.group.validatorNode.configureValidators": "Configurer les Validateurs",
  "network.group.validatorNode.monitorValidators": "Surveiller les Validateurs",
  "network.group.validatorNode.modifyNodes": "Modifier les Nœuds",
  "network.group.validatorNode.verifyNodes": "Vérifier les Nœuds",
  "network.group.fullNode": "Nœuds Complets",
  "network.group.fullNode.runFullNodes": "Exécuter les Nœuds Complets",
  "network.group.fullNode.deployFullNodes": "Déployer les Nœuds Complets",
  "network.group.fullNode.modifyFullNodes": "Modifier les Nœuds Complets",
  "network.group.fullNode.bootstrapFullnode": "Bootstrap Fullnode",
  "network.group.fullNode.configure": "Configurer",
  "network.group.fullNode.configure.nodeFiles": "Fichiers de Nœud",
  "network.group.fullNode.measure": "Mesurer",
  "network.group.fullNode.verifyFullNodes": "Vérifier les Nœuds Complets",
  "network.group.fullNode.deployments": "Déploiements",
  "network.group.fullNode.modify": "Modifier",
  "network.group.bootstrapFullnode": "Bootstrap Fullnode",
  "network.group.configure": "Configurer",
  "network.group.configure.nodeFiles": "Fichiers de Nœud",
  "network.group.measure": "Mesurer",
  "network.group.measure.nodeHealthChecker": "Vérificateur de Santé du Nœud",
  "network.group.networkInformation": "Informations Réseau",
  "network.group.networkInformation.locatingNetworkFiles": "Localisation des Fichiers Réseau",
  "network.group.localnet": "Réseaux Locaux",
  "network.group.blockchain": "Fondamentaux Blockchain",
  "network.group.accountsResources": "Comptes & Ressources",
  "network.group.networkNodes": "Réseau & Nœuds",
  "network.group.stakingGovernance": "Staking & Gouvernance",
  "network.group.executionTransactions": "Exécution & Transactions",

  // Reference Sub-Groups (Only has generated API and glossary for now)
  "reference.group.indexerApi": "API Indexeur",
  "reference.group.restApi": "API REST",

  // AI Sub-Groups
  "ai.group.aptos-mcp": "Aptos MCP",

  // Languages Sub-Groups
  "languages.group.translationStatus": "Statut de la Traduction",

  // Contribute Sub-Groups
  "contribute.group.components": "Composants",
} as const;

type NavLabels = typeof labels;

export type NavKey = keyof NavLabels;

export default labels;
