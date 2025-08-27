/* eslint-disable @typescript-eslint/no-invalid-void-type */
// Edge-compatible middleware that implements a middleware chain pattern
import { sequence } from "astro/middleware";
import i18nRedirect from "./middlewares/i18n-redirect";
import enRedirect from "./middlewares/en-redirect";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment

// The main middleware function
export const onRequest = sequence(enRedirect, i18nRedirect);
