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
  contribute: "Contribuir",

  // Sub-Grupos de Build
  "build.group.sdks": "SDKs",
  "build.group.sdks.official": "Oficiales",
  "build.group.sdks.community": "Comunidad",
  "build.group.apis": "APIs",
  "build.group.indexer": "Indexador",
  "build.group.cli": "CLI",
  "build.group.createAptosDapp": "Crear DApp de Aptos",
  "build.group.aips": "AIPs",

  // Sub-Grupos de Contratos Inteligentes y Move
  "smartContracts.group.moveBook": "Libro de Move",
  "smartContracts.group.development": "Desarrollo",
  "smartContracts.group.aptosFeatures": "Características de Move en Aptos",
  "smartContracts.group.tooling": "Herramientas",
  "smartContracts.group.reference": "Referencia de Move",

  // Sub-Grupos de Guías
  "guides.group.getStarted": "Comenzar",
  "guides.group.beginner": "Principiante",
  "guides.group.advanced": "Avanzado",

  // Sub-Grupos de Red
  "network.group.blockchain": "Blockchain",
  "network.group.localnet": "Red Local",
  "network.group.validatorNode": "Nodo Validador",
  "network.group.validatorNode.connectNodes": "Conectar Nodos",
  "network.group.validatorNode.deployNodes": "Desplegar Nodos",
  "network.group.validatorNode.modifyNodes": "Modificar Nodos",
  "network.group.validatorNode.verifyNodes": "Verificar Nodos",
  "network.group.fullNode": "Nodo Completo",
  "network.group.fullNode.deployments": "Despliegues",
  "network.group.fullNode.modify": "Modificar",
  "network.group.bootstrapFullnode": "Inicializar Nodo Completo",
  "network.group.configure": "Configurar",
  "network.group.configure.nodeFiles": "Archivos de Nodo",
  "network.group.measure": "Medir",

  // Sub-Grupos de Referencia (Solo tiene API generada y glosario por ahora)
  "reference.group.indexerApi": "API del Indexador",
  "reference.group.restApi": "API REST",

  // Sub-Grupos de Contribuir
  "contribute.group.components": "Componentes",
} as const;

type NavLabels = typeof labels;

export type NavKey = keyof NavLabels;

export default labels;
