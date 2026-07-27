import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transform } from "@swc/core";

import prettier from "prettier";
import { build } from "vite";

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
        try {
          // Keep the public Vercel exports stable across Vite output formats.
          // Vite 8 emits `export { config, middleware as default }`, while the
          // deploy wrapper and guardrail test require explicit declarations.
          const { code } = await transform(bundle["middleware.js"].code, {
            plugin: updateAST,
            jsc: {
              parser: {
                syntax: "ecmascript",
              },
              target: "es2022",
            },
            sourceMaps: false,
            minify: false,
          });

          bundle["middleware.js"].code = code;
          console.log("Middleware exports updated successfully.");
        } catch (error) {
          console.error("Error modifying middleware exports:", error);
          throw error;
        }
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

function updateAST(ast) {
  const newBody = [];
  let configNode = null;
  let middlewareDeclaration = null;

  for (const node of ast.body) {
    if (node.type === "VariableDeclaration") {
      const configDeclaration = node.declarations.find(
        (declaration) => declaration.type === "VariableDeclarator" && declaration.id.value === "config",
      );
      if (configDeclaration) {
        configNode = configDeclaration.init;
        continue;
      }
    }

    if (node.type === "FunctionDeclaration" && node.identifier.value === "middleware") {
      middlewareDeclaration = node;
      continue;
    }

    if (node.type === "ExportNamedDeclaration") continue;
    newBody.push(node);
  }

  if (!configNode || !middlewareDeclaration) {
    throw new Error("Expected the middleware bundle to contain config and middleware exports.");
  }

  const span = { start: 0, end: 0 };
  const identifier = (value) => ({
    type: "Identifier",
    span,
    ctxt: 0,
    value,
    optional: false,
    typeAnnotation: null,
  });

  newBody.push({
    type: "ExportDeclaration",
    span,
    declaration: {
      type: "VariableDeclaration",
      span,
      ctxt: 0,
      kind: "const",
      declare: false,
      declarations: [
        {
          type: "VariableDeclarator",
          span,
          id: identifier("config"),
          init: configNode,
          definite: false,
        },
      ],
    },
  });
  newBody.push({
    type: "ExportDefaultDeclaration",
    span,
    decl: {
      ...middlewareDeclaration,
      type: "FunctionExpression",
    },
  });

  return { ...ast, body: newBody };
}
