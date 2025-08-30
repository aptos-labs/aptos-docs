import { fileURLToPath } from "node:url";
import type { AstroConfig, AstroIntegration, IntegrationResolvedRoute } from "astro";
import { getAstroMiddlewarePath } from "./utils/astro";
import { buildMiddlewareMatcherRegexp, type MatcherOptions } from "./utils/matcher";
import { generateEdgeMiddlewareFile } from "./utils/middleware";
import {
  generateFunctionConfig,
  getFunctionDir,
  insertMiddlewareRoute,
} from "./utils/vercelOutput";

const INTEGRATION_NAME = "vercel-middleware";
const VERCEL_ADAPTER_LINK = "[@astrojs/vercel](https://www.npmjs.com/package/@astrojs/vercel)";
const VERCEL_MIDDLEWARE_FUNCTION_NAME = "_middleware";

type VercelMiddlewareIntegrationOptions = MatcherOptions;

export default function vercelMiddlewareIntegration(options?: VercelMiddlewareIntegrationOptions) {
  let astroConfig: AstroConfig;
  let resolvedRoutes: IntegrationResolvedRoute[];

  const integration: AstroIntegration = {
    name: INTEGRATION_NAME,
    hooks: {
      "astro:routes:resolved": ({ routes, logger }) => {
        logger.info("Resolving routes for Vercel middleware matcher…");
        resolvedRoutes = routes;
      },
      "astro:config:done": ({ config }) => {
        astroConfig = config;
      },
      "astro:build:done": async ({ logger }) => {
        if (
          !astroConfig.integrations.some((integration) => integration.name === "@astrojs/vercel")
        ) {
          logger.error(`${VERCEL_ADAPTER_LINK} must be installed to use ${INTEGRATION_NAME}.`);
          return;
        }

        if (astroConfig.adapter?.name !== "@astrojs/vercel") {
          logger.error(
            `${VERCEL_ADAPTER_LINK} must be used as adapter for proper ${INTEGRATION_NAME} work.`,
          );
          return;
        }

        const rootDir = fileURLToPath(astroConfig.root);

        logger.info("Looking for Astro middleware…");
        const astroMiddlewarePath = await getAstroMiddlewarePath(rootDir);

        if (!astroMiddlewarePath) {
          logger.warn("Astro middleware not found. Skipping Vercel middleware build.");
          return;
        }

        logger.info(`Found middleware file at: ${astroMiddlewarePath}`);
        logger.info("Building Vercel middleware…");
        logger.info("Compiling edge middleware file…");
        const functionDir = getFunctionDir(rootDir, VERCEL_MIDDLEWARE_FUNCTION_NAME);
        const middlewareEntrypoint = await generateEdgeMiddlewareFile(
          rootDir,
          astroMiddlewarePath,
          functionDir,
        );
        logger.info("Creating edge middleware Vercel config file…");
        await generateFunctionConfig(functionDir, middlewareEntrypoint);

        logger.info("Collecting routes which must be handled by middleware…");
        const matcher = buildMiddlewareMatcherRegexp({
          assetsDir: astroConfig.build.assets,
          routes: resolvedRoutes,
          ...options,
        });

        logger.info("Inserting generated middleware into vercel output config…");
        await insertMiddlewareRoute(rootDir, matcher, VERCEL_MIDDLEWARE_FUNCTION_NAME);

        logger.info("Successfully created middleware function for Vercel deployment.");
      },
    },
  };

  return integration;
}
