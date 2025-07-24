import path from "node:path";
import { fileURLToPath } from "node:url";
import { transform } from "@swc/core";

import { build } from "vite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outDir = path.resolve(rootDir, ".vercel/output/middleware");

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
          console.error("Error modifying middleware exports:", error);
        }
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
