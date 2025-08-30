import { builtinModules } from "node:module";
import path from "node:path";

// https://docs.astro.build/en/guides/middleware/
const MIDDLEWARE_ENTRYPOINT = "middleware.mjs";

export async function generateEdgeMiddlewareFile(
  projectRootDir: string,
  middlewarePath: string,
  functionDir: string,
) {
  const esbuild = await import("esbuild");
  const middlewareModule = getMiddlewareTemplate(middlewarePath);
  const outfile = path.join(functionDir, MIDDLEWARE_ENTRYPOINT);

  await esbuild.build({
    stdin: {
      contents: middlewareModule,
      resolveDir: projectRootDir,
    },
    target: "esnext",
    platform: "browser",
    conditions: ["edge-light", "workerd", "worker"],
    outfile,
    allowOverwrite: true,
    format: "esm",
    bundle: true,
    minify: false,
    plugins: [
      {
        name: "esbuild-namespace-node-built-in-modules",
        setup(build) {
          const filter = new RegExp(builtinModules.map((mod) => `(^${mod}$)`).join("|"));
          build.onResolve({ filter }, (args) => ({
            path: "node:" + args.path,
            external: true,
          }));
        },
      },
    ],
  });

  return MIDDLEWARE_ENTRYPOINT;
}

function getMiddlewareTemplate(middlewarePath: string) {
  return `
import { createContext, trySerializeLocals } from 'astro/middleware';
import { next } from "@vercel/functions";
import { onRequest } from "${middlewarePath}";

export default async function middleware(request, context) {
  const url = new URL(request.url);
  const ctx = createContext({ request, params: {} });
  Object.assign(ctx.locals, { vercel: { edge: context } });

  return onRequest(ctx, next);
}`;
}
