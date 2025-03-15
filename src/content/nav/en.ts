/**
 * English labels for navigation items
 * Keys correspond to identifiers used in sidebar configuration
 */
interface NavLabels {
  build: string;
  network: string;
  "network.group.blockchain": string;
  "network.group.nodes": string;
  guides: string;
  "guides.group.beginner": string;
  "guides.group.advanced": string;
  reference: string;
  "reference.move": string;
}

const labels: NavLabels = {
  build: "Build",

  network: "Network",
  "network.group.blockchain": "Blockchain",
  "network.group.nodes": "Nodes",

  guides: "Guides",
  "guides.group.beginner": "Beginner",
  "guides.group.advanced": "Advanced",

  reference: "Reference",
  "reference.move": "Move Reference",
};

export default labels;
