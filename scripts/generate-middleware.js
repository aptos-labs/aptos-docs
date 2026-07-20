import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";
import { build } from "vite";

import { matcher } from "../src/middlewares/matcher-routes-dynamic.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outDir = path.resolve(rootDir, ".vercel/output/middleware");
const rootMiddleware = path.resolve(rootDir, "middleware.js");

await build({
  root: rootDir,
  publicDir: false,
  build: {
    outDir,
    emptyOutDir: false,
    lib: {
      entry: "src/vercel-middleware.ts",
      fileName: "middleware",
      formats: ["es"],
    },
    minify: false,
    watch: process.argv.includes("--watch"),
  },
  plugins: [
    {
      name: "middleware-update-exports-plugin",
      apply: "build",
      async generateBundle(_, bundle) {
        // Vite 8 tree-shakes `config` because the middleware bundle only
        // consumes its default export. Vercel's deployment wrapper imports
        // `config.matcher`, so restore that public export from the generated
        // matcher source after bundling instead of relying on Vite's internal
        // variable names.
        bundle["middleware.js"].code += `\nexport const config = ${JSON.stringify(
          { matcher },
          null,
          2,
        )};\n`;

        console.log("Middleware exports updated successfully.");
      },
      async writeBundle() {
        // scripts/generate-middleware-function.js copies the repo-root
        // middleware.js into the Vercel deploy bundle, so keep it in sync
        // with the freshly built .vercel/output/middleware/middleware.js —
        // otherwise any change to src/vercel-middleware.ts (ordering, new
        // middleware, etc.) silently fails to ship until someone copies it
        // manually. Format with Prettier so the committed file matches what
        // developers see locally. Any failure here is fatal: we'd rather
        // fail the build than ship a stale bundle.
        const source = await readFile(path.join(outDir, "middleware.js"), "utf8");
        const prettierConfig = (await prettier.resolveConfig(rootMiddleware)) ?? {};
        const formatted = await prettier.format(source, {
          ...prettierConfig,
          filepath: rootMiddleware,
        });
        await writeFile(rootMiddleware, formatted, "utf8");
        console.log(`Middleware copied to ${path.relative(rootDir, rootMiddleware)}.`);
      },
    },
  ],
});
