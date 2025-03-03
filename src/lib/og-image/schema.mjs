// @ts-check
import { envField } from "astro/config";
import { ENV_NAME } from "./constants.mjs";

export function getEnvsSchema() {
  return {
    [ENV_NAME]: envField.string({
      context: "server",
      access: "secret",
      optional: true,
    }),
  };
}
