import { loadEnv } from "vite";

export const ENV = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");
export const IS_PRODUCTION = ENV.NODE_ENV === "production";
export const IS_DEV = ENV.NODE_ENV === "development";
export const IS_GITHUB_CI = !!ENV.GITHUB_ACTIONS;
