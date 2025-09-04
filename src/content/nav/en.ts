/**
 * English labels for navigation items
 * Keys correspond to identifiers used in sidebar configuration
 */
const labels = {
  // Top Level
  sdksAndTools: "SDKs & Tools",
  smartContracts: "Smart Contracts",
  guides: "Guides",
  nodes: "Nodes",
  concepts: "Concepts",
  reference: "Reference",
  ai: "AI and LLMs",
  contribute: "Contribute",

  // Build Sub-Groups
  "build.group.sdks": "SDKs",
  "build.group.sdks.official": "Official",
  "build.group.sdks.community": "Community",
  "build.group.apis": "APIs",
  "build.group.indexer": "Indexer",
  "build.group.cli": "CLI",
  "build.group.createAptosDapp": "Create Aptos DApp",
  "build.group.aips": "AIPs",

  // Smart Contracts & Move Sub-Groups
  "smartContracts.group.moveBook": "Move Book",
  "smartContracts.group.development": "Development",
  "smartContracts.group.aptosFeatures": "Aptos Move Features",
  "smartContracts.group.tooling": "Tooling",
  "smartContracts.group.reference": "Move Reference",

  // Guides Sub-Groups
  "guides.group.getStarted": "Get Started",
  "guides.group.beginner": "Beginner",
  "guides.group.advanced": "Advanced",

  // Network Sub-Groups
  "network.group.blockchain": "Blockchain",
  "network.group.localnet": "Localnet",
  "network.group.validatorNode": "Validator Node",
  "network.group.validatorNode.connectNodes": "Connect Nodes",
  "network.group.validatorNode.deployNodes": "Deploy Nodes",
  "network.group.validatorNode.modifyNodes": "Modify Nodes",
  "network.group.validatorNode.verifyNodes": "Verify Nodes",
  "network.group.fullNode": "Full Node",
  "network.group.fullNode.deployments": "Deployments",
  "network.group.fullNode.modify": "Modify",
  "network.group.bootstrapFullnode": "Bootstrap Fullnode",
  "network.group.configure": "Configure",
  "network.group.configure.nodeFiles": "Node Files",
  "network.group.measure": "Measure",

  // Reference Sub-Groups (Only has generated API and glossary for now)
  "reference.group.indexerApi": "Indexer API",
  "reference.group.restApi": "REST API",

  // AI Sub-Groups
  "ai.group.aptos-mcp": "Aptos MCP",

  // Contribute Sub-Groups
  "contribute.group.components": "Components",
} as const;

type NavLabels = typeof labels;

export type NavKey = keyof NavLabels;

export default labels;
