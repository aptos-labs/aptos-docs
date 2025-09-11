import path from "node:path";
import type { AstroIntegration } from "astro";
import type { Plugin as VitePlugin } from "vite";
import monacoEditorPluginImport, { type IMonacoEditorOpts } from "vite-plugin-monaco-editor";

/** Handle both ESM default export and CJS export */
type MonacoFactory = (options: IMonacoEditorOpts) => VitePlugin;
type MonacoModule = MonacoFactory | { default: MonacoFactory };

function resolveMonacoFactory(mod: MonacoModule): MonacoFactory {
  return typeof mod === "function" ? mod : mod.default;
}

const monacoEditorPlugin = resolveMonacoFactory(
  monacoEditorPluginImport as unknown as MonacoModule,
);

export function monacoEditorIntegration(): AstroIntegration {
  return {
    name: "monaco-editor",
    hooks: {
      "astro:config:setup": ({ updateConfig }) => {
        const monaco = monacoEditorPlugin({
          languageWorkers: ["editorWorkerService", "json"],
          customWorkers: [{ label: "graphql", entry: "monaco-graphql/esm/graphql.worker" }],
          publicPath: "monaco",
          customDistPath: (_root: string, buildOutDir: string) => {
            const target =
              path.basename(buildOutDir) === "server"
                ? path.join(path.dirname(buildOutDir), "client")
                : buildOutDir;
            return path.join(target, "monaco");
          },
          globalAPI: false,
        });

        updateConfig({ vite: { plugins: [monaco] } });
      },
    },
  };
}
