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

  // Build Sub-Groups
  "build.group.sdks": "SDKs",
  "build.group.sdks.official": "Official",
  "build.group.sdks.community": "Community",

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

  // Reference Sub-Groups (Only has generated API and glossary for now)
  "reference.group.indexerApi": "Indexer API",
  "reference.group.restApi": "REST API",
} as const;

type NavLabels = typeof labels;

export type NavKey = keyof NavLabels;

export default labels;
