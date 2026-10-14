/**
 * Guards the committed Aptos Node API OpenAPI document against silent drift.
 *
 * public/aptos-spec.json powers /rest-api and is advertised as service-desc
 * (see tests/agent-discovery.test.ts). Keep the live Node API paths listed here
 * when you refresh the spec from https://api.mainnet.aptoslabs.com/v1/spec.yaml.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");

interface OpenApiSpec {
  openapi?: string;
  info?: { title?: string; version?: string };
  servers?: { url?: string }[];
  paths?: Record<string, unknown>;
  components?: { schemas?: Record<string, unknown> };
}

function readSpec(): OpenApiSpec {
  return JSON.parse(readFileSync(resolve(ROOT, "public/aptos-spec.json"), "utf8")) as OpenApiSpec;
}

const REQUIRED_PATHS = [
  "/",
  "/-/healthy",
  "/info",
  "/spec",
  "/view",
  "/accounts/{address}",
  "/accounts/{address}/balance/{asset_type}",
  "/accounts/{address}/transactions",
  "/accounts/{address}/events/{event_handle}/{field_name}",
  "/transactions",
  "/transactions/auxiliary_info",
  "/transactions/by_hash/{txn_hash}",
  "/transactions/by_version/{txn_version}",
  "/transactions/simulate",
  "/estimate_gas_price",
];

describe("public/aptos-spec.json (Aptos Node API)", () => {
  const spec = readSpec();

  it("declares OpenAPI 3 and Aptos Node API 1.2.x", () => {
    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.info?.title).toBe("Aptos Node API");
    expect(spec.info?.version).toMatch(/^1\.2\./);
    expect(spec.servers?.[0]?.url).toBe("/v1");
  });

  it("includes the live Node API paths used by the REST docs", () => {
    const paths = spec.paths ?? {};
    for (const path of REQUIRED_PATHS) {
      expect(paths[path], `missing path ${path}`).toBeTruthy();
    }
  });

  it("defines PersistedAuxiliaryInfo for GET /transactions/auxiliary_info", () => {
    expect(spec.components?.schemas?.PersistedAuxiliaryInfo).toBeTruthy();
  });
});
