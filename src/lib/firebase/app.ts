import {
  PUBLIC_FIREBASE_API_KEY,
  PUBLIC_FIREBASE_APP_ID,
  PUBLIC_FIREBASE_AUTH_DOMAIN,
  PUBLIC_FIREBASE_PROJECT_ID,
} from "astro:env/client";
import { initializeApp } from "@firebase/app";
import { singletonGetter } from "~/lib/singletonGetter";
import { FirebaseError } from "./error";

export const getFirebaseApp = singletonGetter(() => {
  try {
    return initializeApp({
      apiKey: PUBLIC_FIREBASE_API_KEY,
      authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: PUBLIC_FIREBASE_PROJECT_ID,
      appId: PUBLIC_FIREBASE_APP_ID,
    });
  } catch (e) {
    throw new FirebaseError("Could not instantiate firebase", { cause: e });
  }
});
