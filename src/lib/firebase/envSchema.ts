import { envField } from "astro/config";
import { API_KEY_ENV, APP_ID_ENV, AUTH_DOMAIN_ENV, PROJECT_ID_ENV } from "./constants";

export const envSchema = {
  [API_KEY_ENV]: envField.string({
    context: "client",
    access: "public",
    optional: true,
  }),
  [AUTH_DOMAIN_ENV]: envField.string({
    context: "client",
    access: "public",
    optional: true,
  }),
  [PROJECT_ID_ENV]: envField.string({
    context: "client",
    access: "public",
    optional: true,
  }),
  [APP_ID_ENV]: envField.string({
    context: "client",
    access: "public",
    optional: true,
  }),
};
