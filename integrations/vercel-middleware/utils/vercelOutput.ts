import fs from "node:fs/promises";
import path from "node:path";

interface VercelConfig {
  version: 3;
  routes: {
    src: string;
    dest?: string;
    middlewarePath?: string;
    continue?: boolean;
  }[];
}

const VERCEL_OUTPUT_DIR = ".vercel/output";

export function getFunctionDir(rootDir: string, functionName: string) {
  return path.join(rootDir, VERCEL_OUTPUT_DIR, `functions/${functionName}.func/`);
}

export async function insertMiddlewareRoute(
  rootDir: string,
  matcher: string,
  middlewareName: string,
) {
  const vercelConfigPath = path.join(rootDir, VERCEL_OUTPUT_DIR, "config.json");
  const vercelConfig = JSON.parse(await fs.readFile(vercelConfigPath, "utf-8")) as VercelConfig;

  vercelConfig.routes.unshift({
    src: matcher,
    middlewarePath: middlewareName,
    continue: true,
  });

  await fs.writeFile(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));
}
export async function generateFunctionConfig(functionDir: string, entrypoint: string) {
  const config = {
    runtime: "edge",
    deploymentTarget: "v8-worker",
    entrypoint,
  };

  await fs.writeFile(path.join(functionDir, ".vc-config.json"), JSON.stringify(config, null, 2));
}
