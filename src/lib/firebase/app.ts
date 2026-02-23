import type { FirebaseApp } from "@firebase/app";
import * as CLIENT_ENV from "astro:env/client";
import { API_KEY_ENV, APP_ID_ENV, AUTH_DOMAIN_ENV, PROJECT_ID_ENV } from "./constants";
import { FirebaseError } from "./error";

let appInstance: FirebaseApp | null = null;

/**
 * Lazily initializes and returns the Firebase app instance.
 * The @firebase/app module (~100KB gzipped) is dynamically imported
 * so it is only downloaded when Firebase is actually needed.
 */
export async function getFirebaseApp(): Promise<FirebaseApp> {
  if (appInstance) return appInstance;

  try {
    const { initializeApp } = await import("@firebase/app");
    appInstance = initializeApp({
      apiKey: CLIENT_ENV[API_KEY_ENV],
      authDomain: CLIENT_ENV[AUTH_DOMAIN_ENV],
      projectId: CLIENT_ENV[PROJECT_ID_ENV],
      appId: CLIENT_ENV[APP_ID_ENV],
    });
    return appInstance;
  } catch (e) {
    throw new FirebaseError("Could not instantiate firebase", { cause: e });
  }
}
