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
          // Modify the exports
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
          // Fail loudly: swallowing this used to emit a bundle with the
          // original (unmodified) export shape, which silently broke the
          // Vercel deploy's `config.matcher` wiring.
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

  let matcherArrayNode = null;
  let middlewareDeclaration = null;

  for (let node of ast.body) {
    if (
      node.type === "VariableDeclaration" &&
      node.declarations.some((d) => d.type === "VariableDeclarator" && d.id.value === "matcher")
    ) {
      matcherArrayNode = node.declarations[0].init;
      continue;
    }

    if (
      node.type === "VariableDeclaration" &&
      node.declarations.some((d) => d.type === "VariableDeclarator" && d.id.value === "config")
    ) {
      continue;
    }

    if (node.type === "FunctionDeclaration" && node.identifier.value === "middleware") {
      middlewareDeclaration = node;
      continue;
    }

    if (node.type === "ExportNamedDeclaration") {
      continue;
    }

    newBody.push(node);
  }

  const DUMMY_SPAN = { start: 0, end: 0 };
  const DUMMY_CTXT = 0;

  // Add valid exports back
  if (matcherArrayNode) {
    newBody.push({
      type: "ExportDeclaration",
      span: {
        start: 2988,
        end: 3624,
      },
      declaration: {
        type: "VariableDeclaration",
        span: DUMMY_SPAN,
        ctxt: DUMMY_CTXT,
        kind: "const",
        declare: false,
        declarations: [
          {
            type: "VariableDeclarator",
            span: DUMMY_SPAN,
            id: {
              type: "Identifier",
              span: DUMMY_SPAN,
              ctxt: DUMMY_CTXT,
              value: "config",
              optional: false,
              typeAnnotation: null,
            },
            init: {
              type: "ObjectExpression",
              span: DUMMY_SPAN,
              properties: [
                {
                  type: "KeyValueProperty",
                  key: {
                    type: "Identifier",
                    span: DUMMY_SPAN,
                    value: "matcher",
                  },
                  value: matcherArrayNode,
                },
              ],
            },
            definite: false,
          },
        ],
      },
    });
  } else {
    console.error("Matcher array node not found.");
  }

  if (middlewareDeclaration) {
    newBody.push({
      type: "ExportDefaultDeclaration",
      span: DUMMY_SPAN,
      decl: {
        ...middlewareDeclaration,
        type: "FunctionExpression",
      },
    });
  } else {
    console.error("Middleware declaration not found.");
  }

  return { ...ast, body: newBody };
}
