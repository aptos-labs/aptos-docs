/**
 * Portuguese (Brazil) labels for navigation items
 * Keys correspond to identifiers used in sidebar configuration
 */
const labels = {
  // Top Level
  sdksAndTools: "SDKs & Ferramentas",
  smartContracts: "Contratos Inteligentes",
  guides: "Guias",
  nodes: "Nós",
  concepts: "Conceitos",
  reference: "Referência",
  ai: "IA e LLMs",
  contribute: "Contribuir",

  // Build Sub-Groups
  "build.group.sdks": "SDKs",
  "build.group.sdks.ts-sdk": "SDK TypeScript",
  "build.group.sdks.ts-sdk.accounts": "Contas",
  "build.group.sdks.ts-sdk.building-transactions": "Construindo Transações",
  "build.group.sdks.ts-sdk.legacy-ts-sdk": "SDK TS Legado",
  "build.group.sdks.go-sdk": "SDK Go",
  "build.group.sdks.go-sdk.building-transactions": "Construindo Transações",
  "build.group.sdks.dotnet-sdk": "SDK .NET",
  "build.group.sdks.dotnet-sdk.accounts": "Contas",
  "build.group.sdks.dotnet-sdk.queries": "Consultas",
  "build.group.sdks.dotnet-sdk.transactions": "Transações",
  "build.group.sdks.python-sdk": "SDK Python",
  "build.group.sdks.unity-sdk": "SDK Unity",
  "build.group.sdks.cpp-sdk": "SDK C++",
  "build.group.sdks.rust-sdk": "SDK Rust",
  "build.group.sdks.wallet-adapter": "Adaptador de Carteira",
  "build.group.sdks.community-sdks": "SDKs da Comunidade",
  "build.group.sdks.react-hooks": "React Hooks",
  "build.group.sdks.community-sdks.kotlin-sdk": "SDK Kotlin",
  "build.group.sdks.community-sdks.swift-sdk": "SDK Swift",
  "build.group.sdks.community-sdks.unity-opendive-sdk": "SDK Unity OpenDive",
  "build.group.sdks.community-sdks.kotlin-sdk.for-ios-devs": "Para Desenvolvedores iOS",
  "build.group.sdks.official": "Oficial",
  "build.group.sdks.community": "Comunidade",
  "build.group.apis": "APIs",
  "build.group.indexer": "Indexador",
  "build.group.indexer.indexer-api": "API do Indexador",
  "build.group.indexer.indexer-sdk": "SDK do Indexador",
  "build.group.indexer.indexer-sdk.documentation": "Documentação",
  "build.group.indexer.indexer-sdk.quickstart": "Início Rápido",
  "build.group.indexer.indexer-sdk.advanced-tutorials": "Tutoriais Avançados",
  "build.group.indexer.nft-aggregator": "Agregador NFT",
  "build.group.indexer.nft-aggregator.marketplaces": "Mercados",
  "build.group.indexer.txn-stream": "Fluxo de Transações",
  "build.group.indexer.legacy": "Legado",
  "build.group.cli": "CLI",
  "build.group.cli.install-cli": "Instalar CLI",
  "build.group.cli.setup-cli": "Configurar CLI",
  "build.group.cli.trying-things-on-chain": "Testando Coisas na Cadeia",
  "build.group.cli.working-with-move-contracts": "Trabalhando com Contratos Move",
  "build.group.createAptosDapp": "Criar DApp Aptos",
  "build.group.aips": "AIPs",

  // Smart Contracts & Move Sub-Groups
  "smartContracts.group.moveBook": "Livro Move",
  "smartContracts.group.development": "Desenvolvimento",
  "smartContracts.group.aptosFeatures": "Recursos Aptos Move",
  "smartContracts.group.aptosFeatures.objects": "Objetos",
  "smartContracts.group.aptosFeatures.aptosStandards": "Padrões Aptos",
  "smartContracts.group.aptosFeatures.aptosStandards.fungibleTokens": "Tokens Fungíveis",
  "smartContracts.group.aptosFeatures.aptosStandards.nonFungibleTokens": "Tokens Não Fungíveis",
  "smartContracts.group.aptosFeatures.dataStructures": "Estruturas de Dados",
  "smartContracts.group.tooling": "Ferramentas",
  "smartContracts.group.tooling.move-prover": "Move Prover",
  "smartContracts.group.reference": "Referência Move",

  // Guides Sub-Groups
  "guides.group.getStarted": "Começar",
  "guides.group.beginner": "Iniciante",
  "guides.group.beginner.e2e": "Construir DApp E2E",
  "guides.group.advanced": "Avançado",
  "guides.group.aptos-keyless": "Aptos Keyless",
  "guides.group.aptos-keyless.federated-keyless": "Keyless Federado",
  "guides.group.integration": "Integração",

  // Network Sub-Groups
  "network.group.validatorNode": "Nós Validador",
  "network.group.validatorNode.runValidators": "Executar Validadores",
  "network.group.validatorNode.deployNodes": "Implantar Nós",
  "network.group.validatorNode.connectNodes": "Conectar Nós",
  "network.group.validatorNode.poolOperations": "Operações de Pool",
  "network.group.validatorNode.configureValidators": "Configurar Validadores",
  "network.group.validatorNode.monitorValidators": "Monitorar Validadores",
  "network.group.validatorNode.modifyNodes": "Modificar Nós",
  "network.group.validatorNode.verifyNodes": "Verificar Nós",
  "network.group.fullNode": "Nós Completos",
  "network.group.fullNode.runFullNodes": "Executar Nós Completos",
  "network.group.fullNode.deployFullNodes": "Implantar Nós Completos",
  "network.group.fullNode.modifyFullNodes": "Modificar Nós Completos",
  "network.group.fullNode.bootstrapFullnode": "Bootstrap Fullnode",
  "network.group.fullNode.configure": "Configurar",
  "network.group.fullNode.configure.nodeFiles": "Arquivos do Nó",
  "network.group.fullNode.measure": "Medir",
  "network.group.fullNode.verifyFullNodes": "Verificar Nós Completos",
  "network.group.fullNode.deployments": "Implantações",
  "network.group.fullNode.modify": "Modificar",
  "network.group.bootstrapFullnode": "Bootstrap Fullnode",
  "network.group.configure": "Configurar",
  "network.group.configure.nodeFiles": "Arquivos do Nó",
  "network.group.measure": "Medir",
  "network.group.measure.nodeHealthChecker": "Verificador de Saúde do Nó",
  "network.group.networkInformation": "Informações da Rede",
  "network.group.networkInformation.locatingNetworkFiles": "Localizando Arquivos da Rede",
  "network.group.localnet": "Redes Locais",
  "network.group.blockchain": "Fundamentos Blockchain",
  "network.group.accountsResources": "Contas & Recursos",
  "network.group.networkNodes": "Rede & Nós",
  "network.group.stakingGovernance": "Staking & Governança",
  "network.group.executionTransactions": "Execução & Transações",

  // Reference Sub-Groups (Only has generated API and glossary for now)
  "reference.group.indexerApi": "API do Indexador",
  "reference.group.restApi": "API REST",

  // AI Sub-Groups
  "ai.group.aptos-mcp": "Aptos MCP",

  // Contribute Sub-Groups
  "contribute.group.components": "Componentes",
} as const;

type NavLabels = typeof labels;

export type NavKey = keyof NavLabels;

export default labels;
