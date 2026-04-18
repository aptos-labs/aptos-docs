/**
 * Minimal type declarations for the WebMCP draft API.
 *
 * Mirrors just the surface we use from
 * https://webmachinelearning.github.io/webmcp/ so `navigator.modelContext` is
 * strongly typed. Extend as the spec evolves (e.g. when `AbortSignal` support
 * is added to our registration call).
 */

export interface ModelContextToolAnnotations {
  readOnlyHint?: boolean;
}

export interface ModelContextToolDefinition<Input = unknown, Output = unknown> {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  annotations?: ModelContextToolAnnotations;
  execute: (input: Input, client?: ModelContextClient) => Promise<Output> | Output;
}

export interface ModelContextRegisterToolOptions {
  signal?: AbortSignal;
}

export interface ModelContextClient {
  requestUserInteraction<T>(callback: () => Promise<T>): Promise<T>;
}

export interface ModelContext {
  registerTool: (
    tool: ModelContextToolDefinition,
    options?: ModelContextRegisterToolOptions,
  ) => void;
}

declare global {
  interface Navigator {
    readonly modelContext?: ModelContext;
  }
}
