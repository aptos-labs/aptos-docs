import {
  GithubAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type AuthProvider,
  type User,
} from "@firebase/auth";
import { atom, onMount } from "nanostores";

import { getFirebaseAuth } from "~/lib/firebase/auth";
import { singletonGetter } from "~/lib/singletonGetter";

export type { User } from "@firebase/auth";

export class AuthStore {
  $user = atom<User | null>(null);
  $isLoading = atom<boolean>(false);
  $error = atom<string | null>(null);

  constructor() {
    onMount(this.$user, () => {
      try {
        return onAuthStateChanged(getFirebaseAuth(), (currentUser) => {
          this.$isLoading.set(false);
          this.$user.set(currentUser);
        });
      } catch {
        this.$error.set("Could not instantiate a connection with firebase");
      }

      return;
    });
  }

  // Auth methods
  loginByGithub = (): void => {
    this.loginByProvider(new GithubAuthProvider());
  };

  loginByGoogle = (): void => {
    this.loginByProvider(new GoogleAuthProvider());
  };

  logout = (): void => {
    this.$error.set(null);
    this.$isLoading.set(true);
    signOut(getFirebaseAuth())
      .then(() => {
        this.$user.set(null);
      })
      .catch((e: unknown) => {
        this.$error.set(String(e));
      })
      .finally(() => {
        this.$isLoading.set(false);
      });
  };

  private loginByProvider(provider: AuthProvider): void {
    this.$error.set(null);
    this.$isLoading.set(true);
    signInWithPopup(getFirebaseAuth(), provider)
      .then((creds) => {
        this.$user.set(creds.user);
      })
      .catch((e: unknown) => {
        this.$error.set(String(e));
      })
      .finally(() => {
        this.$isLoading.set(false);
      });
  }
}

export const getAuthStore = singletonGetter(() => new AuthStore());
