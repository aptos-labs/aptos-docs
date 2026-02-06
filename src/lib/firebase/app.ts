import {
  PUBLIC_FIREBASE_API_KEY,
  PUBLIC_FIREBASE_APP_ID,
  PUBLIC_FIREBASE_AUTH_DOMAIN,
  PUBLIC_FIREBASE_PROJECT_ID,
} from "astro:env/client";
import type { FirebaseApp } from "@firebase/app";
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
      apiKey: PUBLIC_FIREBASE_API_KEY,
      authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: PUBLIC_FIREBASE_PROJECT_ID,
      appId: PUBLIC_FIREBASE_APP_ID,
    });
    return appInstance;
  } catch (e) {
    throw new FirebaseError("Could not instantiate firebase", { cause: e });
  }
}
