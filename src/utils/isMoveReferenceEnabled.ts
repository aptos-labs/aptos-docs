import { ENV } from "~/lib/env";

const ENABLE_MOVE_REFERENCE = ENV.ENABLE_MOVE_REFERENCE;
const GITHUB_TOKEN = ENV.GITHUB_TOKEN;

export const isMoveReferenceEnabled = () => {
  return (
    ENABLE_MOVE_REFERENCE === "true" && typeof GITHUB_TOKEN === "string" && GITHUB_TOKEN.length > 0
  );
};
