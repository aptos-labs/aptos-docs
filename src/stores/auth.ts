import type { User } from "@firebase/auth";
import { atom, onMount } from "nanostores";

import { getFirebaseAuth } from "~/lib/firebase/auth";
import { singletonGetter } from "~/lib/singletonGetter";

export type { User } from "@firebase/auth";

/**
 * Lazily loads @firebase/auth providers and methods.
 * This avoids pulling the full Firebase Auth SDK into the initial bundle --
 * it is only fetched when the user actually interacts with auth.
 */
async function loadFirebaseAuth() {
  return import("@firebase/auth");
}

export class AuthStore {
  $user = atom<User | null>(null);
  $isLoading = atom<boolean>(false);
  $error = atom<string | null>(null);

  constructor() {
    onMount(this.$user, () => {
      void this.initAuthListener();
      return;
    });
  }

  private async initAuthListener(): Promise<void> {
    try {
      const [{ onAuthStateChanged }, auth] = await Promise.all([
        loadFirebaseAuth(),
        getFirebaseAuth(),
      ]);
      onAuthStateChanged(auth, (currentUser) => {
        this.$isLoading.set(false);
        this.$user.set(currentUser);
      });
    } catch {
      this.$error.set("Could not instantiate a connection with firebase");
    }
  }

  // Auth methods
  loginByGithub = (): void => {
    void this.loginByProvider("github");
  };

  loginByGoogle = (): void => {
    void this.loginByProvider("google");
  };

  logout = (): void => {
    this.$error.set(null);
    this.$isLoading.set(true);
    void (async () => {
      try {
        const [{ signOut }, auth] = await Promise.all([loadFirebaseAuth(), getFirebaseAuth()]);
        await signOut(auth);
        this.$user.set(null);
      } catch (e: unknown) {
        this.$error.set(String(e));
      } finally {
        this.$isLoading.set(false);
      }
    })();
  };

  private async loginByProvider(provider: "github" | "google"): Promise<void> {
    this.$error.set(null);
    this.$isLoading.set(true);
    try {
      const [firebaseAuth, auth] = await Promise.all([loadFirebaseAuth(), getFirebaseAuth()]);
      const authProvider =
        provider === "github"
          ? new firebaseAuth.GithubAuthProvider()
          : new firebaseAuth.GoogleAuthProvider();
      const creds = await firebaseAuth.signInWithPopup(auth, authProvider);
      this.$user.set(creds.user);
    } catch (e: unknown) {
      this.$error.set(String(e));
    } finally {
      this.$isLoading.set(false);
    }
  }
}

export const getAuthStore = singletonGetter(() => new AuthStore());
