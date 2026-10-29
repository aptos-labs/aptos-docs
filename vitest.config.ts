import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^~\//,
        replacement: `${resolve(__dirname, "src")}/`,
      },
    ],
  },
  test: {
    include: ["tests/**/*.test.ts"],
    testTimeout: 30000,
  },
});
