import { loadEnv } from "vite";
const env = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");

const ENABLE_MOVE_REFERENCE = env.ENABLE_MOVE_REFERENCE;
const GITHUB_TOKEN = env.GITHUB_TOKEN;

export const isMoveReferenceEnabled = () => {
  return (
    ENABLE_MOVE_REFERENCE === "true" && typeof GITHUB_TOKEN === "string" && GITHUB_TOKEN.length > 0
  );
};
