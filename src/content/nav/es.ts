/**
 * Etiquetas en español para elementos de navegación
 * Las claves corresponden a identificadores usados en la configuración de la barra lateral
 */
const labels = {
  // Nivel Superior
  sdksAndTools: "SDKs y Herramientas",
  smartContracts: "Contratos Inteligentes",
  guides: "Guías",
  nodes: "Nodos",
  concepts: "Conceptos",
  reference: "Referencia",
  ai: "IA y LLMs",
  contribute: "Contribuir",
  resources: "Recursos Externos",

  // Sub-Grupos de Build
  "build.group.sdks": "SDKs",
  "build.group.sdks.ts-sdk": "SDK de TypeScript",
  "build.group.sdks.ts-sdk.accounts": "Cuentas",
  "build.group.sdks.ts-sdk.building-transactions": "Construir Transacciones",
  "build.group.sdks.ts-sdk.legacy-ts-sdk": "SDK de TypeScript Antiguo",
  "build.group.sdks.go-sdk": "SDK de Go",
  "build.group.sdks.go-sdk.building-transactions": "Construir Transacciones",
  "build.group.sdks.dotnet-sdk": "SDK de .NET",
  "build.group.sdks.dotnet-sdk.accounts": "Cuentas",
  "build.group.sdks.dotnet-sdk.queries": "Consultas",
  "build.group.sdks.dotnet-sdk.transactions": "Transacciones",
  "build.group.sdks.python-sdk": "SDK de Python",
  "build.group.sdks.unity-sdk": "SDK de Unity",
  "build.group.sdks.cpp-sdk": "SDK de C++",
  "build.group.sdks.rust-sdk": "SDK de Rust",
  "build.group.sdks.wallet-adapter": "Adaptador de Wallet",
  "build.group.sdks.community-sdks": "SDKs de la Comunidad",
  "build.group.sdks.react-hooks": "React Hooks",
  "build.group.sdks.community-sdks.kotlin-sdk": "SDK de Kotlin",
  "build.group.sdks.community-sdks.swift-sdk": "SDK de Swift",
  "build.group.sdks.community-sdks.unity-opendive-sdk": "SDK de Unity OpenDive",
  "build.group.sdks.community-sdks.kotlin-sdk.fetch-data": "Obtener Datos",
  "build.group.sdks.community-sdks.kotlin-sdk.for-ios-devs": "Para Desarrolladores de iOS",
  "build.group.sdks.official": "Oficiales",
  "build.group.sdks.community": "Comunidad",
  "build.group.apis": "APIs",
  "build.group.indexer": "Indexador",
  "build.group.indexer.indexer-api": "API del Indexador",
  "build.group.indexer.indexer-sdk": "SDK del Indexador",
  "build.group.indexer.indexer-sdk.documentation": "Documentación",
  "build.group.indexer.indexer-sdk.quickstart": "Guía de Inicio Rápido",
  "build.group.indexer.indexer-sdk.advanced-tutorials": "Tutoriales Avanzados",
  "build.group.indexer.nft-aggregator": "Agregador de NFT",
  "build.group.indexer.nft-aggregator.marketplaces": "Mercados",
  "build.group.indexer.txn-stream": "Flujo de Transacciones",
  "build.group.indexer.legacy": "Indexador Legado",
  "build.group.cli": "CLI",
  "build.group.cli.install-cli": "Instalar CLI",
  "build.group.cli.setup-cli": "Configurar CLI",
  "build.group.cli.trying-things-on-chain": "Probar cosas en la cadena",
  "build.group.cli.working-with-move-contracts": "Trabajar con contratos Move",
  "build.group.createAptosDapp": "Crear DApp de Aptos",
  "build.group.aips": "AIPs",

  // Sub-Grupos de Contratos Inteligentes y Move
  "smartContracts.group.moveBook": "Libro de Move",
  "smartContracts.group.development": "Desarrollo",
  "smartContracts.group.aptosFeatures.objects": "Objetos",
  "smartContracts.group.aptosFeatures.aptosStandards": "Estándares de Aptos",
  "smartContracts.group.aptosFeatures.aptosStandards.fungibleTokens": "Tokens Fungibles",
  "smartContracts.group.aptosFeatures.aptosStandards.nonFungibleTokens": "Tokens No Fungibles",
  "smartContracts.group.aptosFeatures.dataStructures": "Estructuras de Datos",
  "smartContracts.group.aptosFeatures": "Características de Move en Aptos",
  "smartContracts.group.tooling": "Herramientas",
  "smartContracts.group.tooling.move-prover": "Move Prover",
  "smartContracts.group.reference": "Referencia de Move",

  // Sub-Grupos de Guías
  "guides.group.getStarted": "Comenzar",
  "guides.group.beginner": "Principiante",
  "guides.group.beginner.e2e": "Construir E2E DApp",
  "guides.group.advanced": "Avanzado",
  "guides.group.aptos-keyless": "Aptos Keyless",
  "guides.group.aptos-keyless.federated-keyless": "Keyless Federado",
  "guides.group.integration": "Integración",

  // Sub-Grupos de Red
  "network.group.validatorNode": "Nodo Validador",
  "network.group.validatorNode.runValidators": "Ejecutar Validadores",
  "network.group.validatorNode.deployNodes": "Desplegar Nodos",
  "network.group.validatorNode.connectNodes": "Conectar Nodos",
  "network.group.validatorNode.poolOperations": "Operaciones de Pool",
  "network.group.validatorNode.configureValidators": "Configurar Validadores",
  "network.group.validatorNode.monitorValidators": "Monitorizar Validadores",
  "network.group.validatorNode.modifyNodes": "Modificar Nodos",
  "network.group.validatorNode.verifyNodes": "Verificar Nodos",
  "network.group.fullNode": "Nodo Completo",
  "network.group.fullNode.runFullNodes": "Ejecutar Nodos Completos",
  "network.group.fullNode.deployFullNodes": "Desplegar Nodos Completos",
  "network.group.fullNode.modifyFullNodes": "Modificar Nodos Completos",
  "network.group.fullNode.bootstrapFullnode": "Inicializar Nodo Completo",
  "network.group.fullNode.configure": "Configurar",
  "network.group.fullNode.configure.nodeFiles": "Archivos de Nodo",
  "network.group.fullNode.measure": "Medir",
  "network.group.fullNode.verifyFullNodes": "Verificar Nodos Completos",
  "network.group.fullNode.deployments": "Despliegues",
  "network.group.fullNode.modify": "Modificar",
  "network.group.bootstrapFullnode": "Inicializar Nodo Completo",
  "network.group.configure": "Configurar",
  "network.group.configure.nodeFiles": "Archivos de Nodo",
  "network.group.measure": "Medir",
  "network.group.measure.nodeHealthChecker": "Verificador de Salud del Nodo",
  "network.group.networkInformation": "Información de la Red",
  "network.group.networkInformation.locatingNetworkFiles": "Localizar Archivos de Red",
  "network.group.localnet": "Redes Locales",
  "network.group.blockchain": "Fundamentos de la Blockchain",
  "network.group.accountsResources": "Cuentas y Recursos",
  "network.group.networkNodes": "Red y Nodos",
  "network.group.stakingGovernance": "Staking y Gestión",
  "network.group.executionTransactions": "Ejecución y Transacciones",

  // Sub-Grupos de Referencia (Solo tiene API generada y glosario por ahora)
  "reference.group.indexerApi": "API del Indexador",
  "reference.group.restApi": "API REST",

  // Sub-Grupos de AI
  "ai.group.aptos-mcp": "Aptos MCP",

  // Sub-Grupos de Contribuir
  "contribute.group.components": "Componentes",
} as const;

type NavLabels = typeof labels;

export type NavKey = keyof NavLabels;

export default labels;
