import type { Auth, GithubAuthProvider, GoogleAuthProvider, User } from "@firebase/auth";
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

type FirebaseAuthModule = Awaited<ReturnType<typeof loadFirebaseAuth>>;

interface PreparedAuth {
  firebaseAuth: FirebaseAuthModule;
  auth: Auth;
  googleProvider: GoogleAuthProvider;
  githubProvider: GithubAuthProvider;
}

interface PopupRedirectResolverLike {
  _initialize(auth: Auth): Promise<unknown>;
}

function getErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") {
      return code;
    }
  }
  return undefined;
}

/**
 * Best-effort pre-warming of the hidden cross-origin auth iframe
 * (`gapi.iframes` + `__/auth/iframe`). Running this on mount -- on all
 * browsers, not just Safari -- means the Firebase bundle, `api.js`, and the
 * iframe are already cached when the user clicks, so `signInWithPopup` can
 * call `window.open()` synchronously inside the user-activation window.
 */
async function warmPopupResolver(auth: Auth): Promise<void> {
  try {
    const resolver = (auth as unknown as { _popupRedirectResolver?: PopupRedirectResolverLike })
      ._popupRedirectResolver;
    if (resolver) {
      await resolver._initialize(auth).catch(() => {});
    }
  } catch {
    // Pre-warming is best-effort; ignore failures so mount never crashes.
  }
}

export class AuthStore {
  $user = atom<User | null>(null);
  $isLoading = atom<boolean>(true);
  $error = atom<string | null>(null);

  private preparedAuth: PreparedAuth | null = null;
  private preparePromise: Promise<PreparedAuth | null> | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    onMount(this.$user, () => {
      void this.initAuthListener();
      return;
    });
  }

  private prepareAuth(): Promise<PreparedAuth | null> {
    if (this.preparedAuth) {
      return Promise.resolve(this.preparedAuth);
    }
    this.preparePromise ??= this.doPrepare();
    return this.preparePromise;
  }

  private async doPrepare(): Promise<PreparedAuth | null> {
    try {
      const [firebaseAuth, auth] = await Promise.all([loadFirebaseAuth(), getFirebaseAuth()]);
      await warmPopupResolver(auth);
      const googleProvider = new firebaseAuth.GoogleAuthProvider();
      const githubProvider = new firebaseAuth.GithubAuthProvider();
      const prepared: PreparedAuth = { firebaseAuth, auth, googleProvider, githubProvider };
      this.preparedAuth = prepared;
      return prepared;
    } catch {
      // Allow a later retry (e.g. transient network failure during preload).
      this.preparePromise = null;
      return null;
    }
  }

  private initAuthListener(): Promise<void> {
    // Nanostores `atom.get()` briefly mounts the store (listen + immediate
    // unsubscribe), so without this guard every `$user.get()` would re-run
    // initialization, re-subscribe `onAuthStateChanged`, and flip `isLoading`
    // back to `true` after login. Cache the promise so init runs once.
    this.initPromise ??= this.doInitAuthListener();
    return this.initPromise;
  }

  private async doInitAuthListener(): Promise<void> {
    this.$isLoading.set(true);
    try {
      const prepared = await this.prepareAuth();
      if (!prepared) {
        throw new Error("Could not instantiate a connection with firebase");
      }
      const { firebaseAuth, auth } = prepared;
      // Resolve a pending redirect result when we fell back to
      // `signInWithRedirect` (e.g. `auth/web-storage-unsupported` in
      // partitioned-storage browsers).
      try {
        const redirectResult = await firebaseAuth.getRedirectResult(auth);
        if (redirectResult?.user) {
          this.$user.set(redirectResult.user);
        }
      } catch {
        // Non-fatal: onAuthStateChanged below will still sync auth state.
      }
      firebaseAuth.onAuthStateChanged(auth, (currentUser) => {
        this.$isLoading.set(false);
        this.$user.set(currentUser);
      });
    } catch {
      this.$error.set("Could not instantiate a connection with firebase");
      this.$isLoading.set(false);
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
      // Fast path: auth was pre-warmed on mount, so call `signInWithPopup`
      // immediately with no extra `await` ticks before it. That keeps
      // `window.open()` inside the click's transient user-activation window
      // (Safari ~1s) instead of after async bundle/iframe loading.
      if (this.preparedAuth) {
        const { firebaseAuth, auth, googleProvider, githubProvider } = this.preparedAuth;
        const authProvider = provider === "github" ? githubProvider : googleProvider;
        try {
          const creds = await firebaseAuth.signInWithPopup(auth, authProvider);
          this.$user.set(creds.user);
        } catch (e: unknown) {
          if (getErrorCode(e) === "auth/web-storage-unsupported") {
            await firebaseAuth.signInWithRedirect(auth, authProvider);
            return;
          }
          throw e;
        }
      } else {
        // Slow path: mount hasn't finished warming (button should normally be
        // disabled via `isLoading`, but handle direct calls defensively).
        const prepared = await this.prepareAuth();
        if (!prepared) {
          throw new Error("Could not instantiate a connection with firebase");
        }
        const { firebaseAuth, auth, googleProvider, githubProvider } = prepared;
        const authProvider = provider === "github" ? githubProvider : googleProvider;
        try {
          const creds = await firebaseAuth.signInWithPopup(auth, authProvider);
          this.$user.set(creds.user);
        } catch (e: unknown) {
          if (getErrorCode(e) === "auth/web-storage-unsupported") {
            await firebaseAuth.signInWithRedirect(auth, authProvider);
            return;
          }
          throw e;
        }
      }
    } catch (e: unknown) {
      this.$error.set(String(e));
    } finally {
      this.$isLoading.set(false);
    }
  }
}

export const getAuthStore = singletonGetter(() => new AuthStore());
