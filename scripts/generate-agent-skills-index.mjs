#!/usr/bin/env node
/**
 * Generates public/.well-known/agent-skills/index.json by fetching the latest
 * Aptos agent skills (https://github.com/aptos-labs/aptos-agent-skills) and
 * computing SHA-256 digests per the Agent Skills Discovery RFC v0.2.0
 * (https://github.com/cloudflare/agent-skills-discovery-rfc).
 *
 * Run manually whenever the upstream skills change:
 *   node scripts/generate-agent-skills-index.mjs
 */

import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outFile = path.join(rootDir, "public/.well-known/agent-skills/index.json");

const REPO = "aptos-labs/aptos-agent-skills";
const BRANCH = "main";
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;

// Human-readable description + RFC-friendly slug for each published skill.
const SKILLS = [
  {
    name: "write-contracts",
    path: "skills/move/write-contracts/SKILL.md",
    description: "Write Move smart contracts following Aptos best practices.",
  },
  {
    name: "generate-tests",
    path: "skills/move/generate-tests/SKILL.md",
    description: "Generate comprehensive unit and integration tests for Move modules.",
  },
  {
    name: "security-audit",
    path: "skills/move/security-audit/SKILL.md",
    description: "Audit Move contracts for common vulnerabilities and security issues.",
  },
  {
    name: "deploy-contracts",
    path: "skills/move/deploy-contracts/SKILL.md",
    description: "Deploy Move modules to Aptos devnet, testnet, or mainnet.",
  },
  {
    name: "search-aptos-examples",
    path: "skills/move/search-aptos-examples/SKILL.md",
    description: "Search official Aptos example contracts for reference implementations.",
  },
  {
    name: "analyze-gas-optimization",
    path: "skills/move/analyze-gas-optimization/SKILL.md",
    description: "Analyze and optimize Move code for gas efficiency.",
  },
  {
    name: "modernize-move",
    path: "skills/move/modernize-move/SKILL.md",
    description: "Upgrade Move code to use the latest Aptos Move features.",
  },
  {
    name: "create-aptos-project",
    path: "skills/project/create-aptos-project/SKILL.md",
    description:
      "Scaffold a new Aptos project with Move contracts, TypeScript SDK, and frontend.",
  },
  {
    name: "use-ts-sdk",
    path: "skills/sdk/typescript/use-ts-sdk/SKILL.md",
    description: "General guidance for using the Aptos TypeScript SDK.",
  },
  {
    name: "ts-sdk-client",
    path: "skills/sdk/typescript/ts-sdk-client/SKILL.md",
    description: "Configure and use the Aptos client for network interactions.",
  },
  {
    name: "ts-sdk-account",
    path: "skills/sdk/typescript/ts-sdk-account/SKILL.md",
    description: "Create and manage Aptos accounts and key pairs.",
  },
  {
    name: "ts-sdk-address",
    path: "skills/sdk/typescript/ts-sdk-address/SKILL.md",
    description: "Work with Aptos addresses and address formats.",
  },
  {
    name: "ts-sdk-transactions",
    path: "skills/sdk/typescript/ts-sdk-transactions/SKILL.md",
    description: "Build, simulate, sign, and submit transactions with the TypeScript SDK.",
  },
  {
    name: "ts-sdk-view-and-query",
    path: "skills/sdk/typescript/ts-sdk-view-and-query/SKILL.md",
    description: "Query on-chain data and call view functions from the TypeScript SDK.",
  },
  {
    name: "ts-sdk-types",
    path: "skills/sdk/typescript/ts-sdk-types/SKILL.md",
    description: "Use TypeScript types from the Aptos SDK correctly.",
  },
  {
    name: "ts-sdk-wallet-adapter",
    path: "skills/sdk/typescript/ts-sdk-wallet-adapter/SKILL.md",
    description: "Integrate Aptos wallet connections in frontend applications.",
  },
];

async function sha256(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  const buf = Buffer.from(await response.arrayBuffer());
  return {
    digest: `sha256:${createHash("sha256").update(buf).digest("hex")}`,
    bytes: buf.length,
  };
}

const skills = [];
for (const skill of SKILLS) {
  const url = `${RAW_BASE}/${skill.path}`;
  const { digest, bytes } = await sha256(url);
  skills.push({
    name: skill.name,
    type: "skill-md",
    description: skill.description,
    url,
    digest,
    sizeBytes: bytes,
  });
  console.log(`${skill.name} -> ${digest} (${bytes} bytes)`);
}

const payload = {
  $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
  name: "aptos-labs/aptos-agent-skills",
  title: "Aptos Agent Skills",
  description:
    "Pre-built AI skills that give coding assistants deep Aptos expertise — Move smart contracts, TypeScript SDK usage, and full-stack dApp scaffolding.",
  publisher: {
    name: "Aptos Labs",
    url: "https://aptos.dev",
  },
  source: {
    repository: `https://github.com/${REPO}`,
    branch: BRANCH,
  },
  skills,
};

await mkdir(path.dirname(outFile), { recursive: true });
await writeFile(outFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`\nWrote ${outFile}`);
