/**
 * English labels for navigation items
 * Keys correspond to identifiers used in sidebar configuration
 */
const labels = {
  build: "Build",

  network: "Network",
  "network.group.blockchain": "Blockchain",
  "network.group.nodes": "Nodes",

  guides: "Guides",
  "guides.group.beginner": "Beginner",
  "guides.group.advanced": "Advanced",

  reference: "Reference",
  "reference.group.move": "Smart Contracts",

  "reference.group.move.reference": "Move Reference",
  "reference.group.move.book": "Move Book",
  "reference.group.move.book.gettingstarted": "Getting Started",
  "reference.group.move.book.primitivetypes": "Primitive Types",
  "reference.group.move.book.basicconcepts": "Basic Concepts",
  "reference.group.move.book.globalstorage": "Global Storage",
} as const;

type NavLabels = typeof labels;

export type NavKey = keyof NavLabels;

export default labels;
