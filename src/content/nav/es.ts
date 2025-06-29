/**
 * English labels for navigation items
 * Keys correspond to identifiers used in sidebar configuration
 */
const labels = {
  // Top Level
  sdksAndTools: "SDKs y Herramientas",
  smartContracts: "Contratos Inteligentes",
  guides: "Guías",
  nodes: "Nodos",
  concepts: "Conceptos",
  reference: "Referencia",
  contribute: "Contribuir",

  // Build Sub-Groups
  "build.group.sdks": "SDKs",
  "build.group.sdks.official": "Oficiales",
  "build.group.sdks.community": "Comunitarios",
  "build.group.apis": "APIs",
  "build.group.indexer": "Indexador",
  "build.group.cli": "CLI",
  "build.group.createAptosDapp": "Create Aptos DApp",

  // Smart Contracts & Move Sub-Groups
  "smartContracts.group.moveBook": "Libro de Move",
  "smartContracts.group.development": "Desarrollo",
  "smartContracts.group.aptosFeatures": "Características de Move de Aptos",
  "smartContracts.group.tooling": "Herramientas",
  "smartContracts.group.reference": "Referencia de Move",

  // Guides Sub-Groups
  "guides.group.getStarted": "Comenzar",
  "guides.group.beginner": "Principiante",
  "guides.group.advanced": "Avanzado",

  // Network Sub-Groups
  "network.group.blockchain": "Blockchain",
  "network.group.localnet": "Red Local",
  "network.group.validatorNode": "Nodo Validador",
  "network.group.validatorNode.connectNodes": "Conectar Nodos",
  "network.group.validatorNode.deployNodes": "Desplegar Nodos",
  "network.group.validatorNode.modifyNodes": "Modificar Nodos",
  "network.group.validatorNode.verifyNodes": "Verificar Nodos",
  "network.group.fullNode": "Nodo Full",
  "network.group.fullNode.deployments": "Despliegues",
  "network.group.fullNode.modify": "Modificar",
  "network.group.bootstrapFullnode": "Bootstrap Fullnode",
  "network.group.configure": "Configurar",
  "network.group.configure.nodeFiles": "Archivos de Nodo",
  "network.group.measure": "Medir",

  // Reference Sub-Groups (Only has generated API and glossary for now)
  "reference.group.indexerApi": "API de Indexador",
  "reference.group.restApi": "API REST",

  // Contribute Sub-Groups
  "contribute.group.components": "Componentes",
} as const;

type NavLabels = typeof labels;

export type NavKey = keyof NavLabels;

export default labels;
