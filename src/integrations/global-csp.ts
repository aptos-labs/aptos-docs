import fs from "node:fs";
import path from "node:path";
import type { AstroIntegration } from "astro";

interface RouteHeaders {
  "content-security-policy"?: string;
  [key: string]: string | undefined;
}
interface Route {
  src?: string;
  headers?: RouteHeaders;
  [key: string]: unknown;
}
interface VercelConfig {
  routes: Route[];
  [key: string]: unknown;
}

async function waitForFile(filePath: string, timeoutMs = 30000, intervalMs = 200) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (fs.existsSync(filePath)) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

export function globalCspIntegration(): AstroIntegration {
  return {
    name: "global-csp",
    hooks: {
      "astro:build:done": async () => {
        const configPath = path.resolve(".vercel/output/config.json");

        const ready = await waitForFile(configPath);
        if (!ready) {
          console.warn(`[global-csp] timed out waiting for ${configPath}; skipping`);
          return;
        }

        const json = JSON.parse(fs.readFileSync(configPath, "utf8")) as VercelConfig;
        if (!Array.isArray(json.routes)) return;

        let csp: string | null = null;
        for (const r of json.routes) {
          const v = r.headers?.["content-security-policy"];
          if (v) {
            csp = v;
            break;
          }
        }
        if (!csp) {
          console.log("[global-csp] No CSP found in routes, nothing to change.");
          return;
        }

        // 2) Remove routes that only had CSP headers, or strip CSP from routes with other content
        json.routes = json.routes.filter((r) => {
          if (r.headers?.["content-security-policy"]) {
            delete r.headers["content-security-policy"];
            if (Object.keys(r.headers).length === 0) {
              delete r.headers;
            }

            // If the route now only has 'src' property (or is completely empty), remove it
            const remainingKeys = Object.keys(r).filter((key) => key !== "src");
            if (remainingKeys.length === 0) {
              return false; // Remove this route
            }
          }
          return true; // Keep this route
        });

        json.routes.unshift({
          src: "/(.*)",
          headers: { "content-security-policy": csp },
        });

        fs.writeFileSync(configPath, JSON.stringify(json, null, 2));
        console.log("✅ [global-csp] collapsed per-route CSP into one global header.");
      },
    },
  };
}
