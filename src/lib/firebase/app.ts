import { initializeApp } from "firebase/app";
import * as CLIENT_ENV from "astro:env/client";
import { API_KEY_ENV, APP_ID_ENV, AUTH_DOMAIN_ENV, PROJECT_ID_ENV } from "./constants";
import { FirebaseError } from "./error";
import { singletonGetter } from "~/lib/singletonGetter";

export const getFirebaseApp = singletonGetter(() => {
  try {
    return initializeApp({
      apiKey: CLIENT_ENV[API_KEY_ENV],
      authDomain: CLIENT_ENV[AUTH_DOMAIN_ENV],
      projectId: CLIENT_ENV[PROJECT_ID_ENV],
      appId: CLIENT_ENV[APP_ID_ENV],
    });
  } catch (e) {
    throw new FirebaseError("Could not instantiate firebase", { cause: e });
  }
});
