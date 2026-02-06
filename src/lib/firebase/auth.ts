import type { Auth } from "@firebase/auth";
import { getFirebaseApp } from "./app";

let authInstance: Auth | null = null;

/**
 * Lazily initializes and returns the Firebase Auth instance.
 * The @firebase/auth module is dynamically imported so it is only
 * downloaded when authentication is actually needed.
 */
export async function getFirebaseAuth(): Promise<Auth> {
  if (authInstance) return authInstance;

  const [{ getAuth }, app] = await Promise.all([import("@firebase/auth"), getFirebaseApp()]);
  authInstance = getAuth(app);
  return authInstance;
}
