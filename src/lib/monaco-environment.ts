// Astro-compatible Monaco Environment configuration for GraphiQL v5
// This compensates for Astro not running Vite's transformIndexHtml hook

// Monaco Editor type definitions
interface MonacoEditor {
  getModel: () => MonacoModel | null;
  updateOptions: (options: { placeholder?: string }) => void;
}

interface MonacoModel {
  uri?: {
    path?: string;
  };
}

interface MonacoAPI {
  editor: {
    getEditors: () => MonacoEditor[];
    onDidCreateEditor: (callback: (editor: MonacoEditor) => void) => void;
  };
}

declare global {
  interface Window {
    monaco?: MonacoAPI;
  }
}

if (typeof window !== "undefined" && !window.MonacoEnvironment) {
  // Match the plugin's publicPath configuration
  const importMeta = import.meta as { env?: { BASE_URL?: string } };
  const base = importMeta.env?.BASE_URL ?? "/";
  const workerPath = `${String(base)}monaco`;

  const workerMap: Record<string, string> = {
    // Core editor worker
    editorWorkerService: `${workerPath}/editor.worker.bundle.js`,
    // JSON worker (GraphiQL uses it for variables)
    json: `${workerPath}/json.worker.bundle.js`,
    // GraphQL language worker from monaco-graphql
    graphql: `${workerPath}/graphql.worker.bundle.js`,
  };

  window.MonacoEnvironment = {
    // Enable global Monaco API access (required for placeholder functionality)
    globalAPI: true,
    getWorkerUrl(_moduleId: string, label: string): string {
      return (
        workerMap[label] ?? workerMap.editorWorkerService ?? `${workerPath}/editor.worker.bundle.js`
      );
    },
  };

  // Monaco readiness check
  const waitForMonaco = (): Promise<MonacoAPI> => {
    return new Promise((resolve) => {
      const checkMonaco = (): void => {
        if (window.monaco?.editor) {
          resolve(window.monaco);
        } else {
          requestAnimationFrame(checkMonaco);
        }
      };
      checkMonaco();
    });
  };

  // Wait for editor model to be ready
  const waitForEditorModel = (editor: MonacoEditor): Promise<MonacoModel> => {
    return new Promise((resolve) => {
      const checkModel = (): void => {
        const model = editor.getModel();
        if (model) {
          resolve(model);
        } else {
          requestAnimationFrame(checkModel);
        }
      };
      checkModel();
    });
  };

  // Apply placeholder to response editor
  const applyPlaceholder = async (editor: MonacoEditor): Promise<void> => {
    try {
      const model = await waitForEditorModel(editor);
      if (model.uri?.path?.includes("response")) {
        editor.updateOptions({
          placeholder: "// Run a query to see results here",
        });
      }
    } catch (error) {
      console.error("Error applying placeholder:", error);
    }
  };

  // Setup placeholder with async/await
  void (async (): Promise<void> => {
    try {
      const monaco = await waitForMonaco();

      // Handle existing editors
      monaco.editor.getEditors().forEach((editor) => void applyPlaceholder(editor));

      // Handle future editors
      monaco.editor.onDidCreateEditor((editor) => void applyPlaceholder(editor));
    } catch (error) {
      console.error("Error setting up Monaco placeholder:", error);
    }
  })();
}

export {};
