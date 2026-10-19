import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/lib/firebase/auth", () => ({
  getFirebaseAuth: vi.fn(),
}));

vi.mock("@firebase/auth", () => ({
  GoogleAuthProvider: vi.fn(),
  GithubAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  getRedirectResult: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
}));

import * as FirebaseAuth from "@firebase/auth";
import { getFirebaseAuth } from "~/lib/firebase/auth";
import { formatFirebaseAuthError } from "~/lib/firebase/error";
import { AuthStore } from "~/stores/auth";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");

function readText(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
}

function readJson<T = unknown>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

const mockedGetFirebaseAuth = vi.mocked(getFirebaseAuth);
const mockedSignInWithPopup = vi.mocked(FirebaseAuth.signInWithPopup);
const mockedSignInWithRedirect = vi.mocked(FirebaseAuth.signInWithRedirect);
const mockedGetRedirectResult = vi.mocked(FirebaseAuth.getRedirectResult);
const mockedOnAuthStateChanged = vi.mocked(FirebaseAuth.onAuthStateChanged);
const MockedGoogleProvider = vi.mocked(FirebaseAuth.GoogleAuthProvider);
const MockedGithubProvider = vi.mocked(FirebaseAuth.GithubAuthProvider);

function createMockAuth(extra: Record<string, unknown> = {}) {
  return {
    _popupRedirectResolver: {
      _initialize: vi.fn().mockResolvedValue(undefined),
    },
    ...extra,
  };
}

function setupPrepareMocks(options: { initializeShouldFail?: boolean } = {}) {
  const resolverInit = options.initializeShouldFail
    ? vi.fn().mockRejectedValue(new Error("preload failed"))
    : vi.fn().mockResolvedValue(undefined);
  const mockAuth = createMockAuth({
    _popupRedirectResolver: { _initialize: resolverInit },
  });
  mockedGetFirebaseAuth.mockResolvedValue(mockAuth as never);
  MockedGoogleProvider.mockImplementation(function (this: unknown) {
    return { providerId: "google.com" };
  } as never);
  MockedGithubProvider.mockImplementation(function (this: unknown) {
    return { providerId: "github.com" };
  } as never);
  mockedGetRedirectResult.mockResolvedValue(null as never);
  mockedOnAuthStateChanged.mockImplementation(((_auth: unknown, cb: (user: null) => void) => {
    cb(null);
    return () => {};
  }) as never);
  return { mockAuth, resolverInit };
}

describe("AuthStore initial state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupPrepareMocks();
  });

  it("starts loading until initial auth readiness completes", () => {
    const store = new AuthStore();
    // NOTE: use `.value` (not `.get()`) — nanostores `get()` briefly mounts
    // the store and would trigger `initAuthListener` as a side effect.
    expect(store.$isLoading.value).toBe(true);
    expect(store.$user.value).toBeNull();
    expect(store.$error.value).toBeNull();
  });
});

describe("AuthStore pre-warming (prepareAuth)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pre-warms the popup resolver and caches providers on init", async () => {
    const { mockAuth, resolverInit } = setupPrepareMocks();
    const store = new AuthStore();
    const prepared = await (store as unknown as { prepareAuth(): Promise<unknown> }).prepareAuth();

    expect(mockedGetFirebaseAuth).toHaveBeenCalled();
    expect(resolverInit).toHaveBeenCalledTimes(1);
    expect(resolverInit).toHaveBeenCalledWith(mockAuth);
    expect(MockedGoogleProvider).toHaveBeenCalledTimes(1);
    expect(MockedGithubProvider).toHaveBeenCalledTimes(1);
    expect(prepared).not.toBeNull();
    expect((store as unknown as { preparedAuth: unknown }).preparedAuth).not.toBeNull();
  });

  it("does not crash mount when resolver pre-warming fails", async () => {
    setupPrepareMocks({ initializeShouldFail: true });
    const store = new AuthStore();
    const prepared = await (store as unknown as { prepareAuth(): Promise<unknown> }).prepareAuth();

    // Non-fatal preload errors are swallowed; providers are still cached.
    expect(prepared).not.toBeNull();
    expect(MockedGoogleProvider).toHaveBeenCalled();
  });

  it("resolves getRedirectResult during init and clears loading via onAuthStateChanged", async () => {
    const mockUser = { uid: "user-123" };
    setupPrepareMocks();
    mockedGetRedirectResult.mockResolvedValue({ user: mockUser } as never);
    const seen: unknown[] = [];
    mockedOnAuthStateChanged.mockImplementation(((auth: unknown, cb: (user: unknown) => void) => {
      seen.push(auth);
      cb(mockUser);
      return () => {};
    }) as never);

    const store = new AuthStore();
    await (store as unknown as { initAuthListener(): Promise<void> }).initAuthListener();

    expect(mockedGetRedirectResult).toHaveBeenCalledTimes(1);
    expect(mockedOnAuthStateChanged).toHaveBeenCalledTimes(1);
    expect(store.$user.value).toEqual(mockUser);
    expect(store.$isLoading.value).toBe(false);
  });

  it("ignores getRedirectResult errors and still subscribes to auth state", async () => {
    setupPrepareMocks();
    mockedGetRedirectResult.mockRejectedValue(new Error("no redirect"));
    const store = new AuthStore();
    await (store as unknown as { initAuthListener(): Promise<void> }).initAuthListener();

    expect(mockedOnAuthStateChanged).toHaveBeenCalledTimes(1);
    expect(store.$isLoading.value).toBe(false);
    expect(store.$error.value).toBeNull();
  });

  it("surfaces a connection error when preparation fails", async () => {
    mockedGetFirebaseAuth.mockRejectedValue(new Error("offline"));
    const store = new AuthStore();
    await (store as unknown as { initAuthListener(): Promise<void> }).initAuthListener();

    expect(store.$error.value).toBe(
      formatFirebaseAuthError(new Error("Could not instantiate a connection with firebase")),
    );
    expect(store.$isLoading.value).toBe(false);
  });
});

describe("AuthStore loginByProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls signInWithPopup synchronously on the pre-warmed fast path (no await ticks)", async () => {
    setupPrepareMocks();
    const mockUser = { uid: "popup-user" };
    mockedSignInWithPopup.mockResolvedValue({ user: mockUser } as never);

    const store = new AuthStore();
    await (store as unknown as { prepareAuth(): Promise<unknown> }).prepareAuth();
    vi.clearAllMocks();

    // Act without awaiting first: the fast path must invoke signInWithPopup
    // synchronously inside the click gesture so Safari keeps user activation.
    const pending = (
      store as unknown as { loginByProvider(p: string): Promise<void> }
    ).loginByProvider("google");
    expect(mockedSignInWithPopup).toHaveBeenCalledTimes(1);
    await pending;

    expect(store.$user.value).toEqual(mockUser);
    expect(store.$isLoading.value).toBe(false);
    expect(store.$error.value).toBeNull();
  });

  it("uses the cached Google vs GitHub providers", async () => {
    setupPrepareMocks();
    const googleProvider = { providerId: "google.com" };
    const githubProvider = { providerId: "github.com" };
    MockedGoogleProvider.mockImplementation(function (this: unknown) {
      return googleProvider;
    } as never);
    MockedGithubProvider.mockImplementation(function (this: unknown) {
      return githubProvider;
    } as never);
    mockedSignInWithPopup.mockResolvedValue({ user: { uid: "u" } } as never);

    const store = new AuthStore();
    await (store as unknown as { prepareAuth(): Promise<unknown> }).prepareAuth();

    await (store as unknown as { loginByProvider(p: string): Promise<void> }).loginByProvider(
      "github",
    );
    expect(mockedSignInWithPopup).toHaveBeenCalledWith(expect.anything(), githubProvider);

    vi.clearAllMocks();
    mockedSignInWithPopup.mockResolvedValue({ user: { uid: "u2" } } as never);
    await (store as unknown as { loginByProvider(p: string): Promise<void> }).loginByProvider(
      "google",
    );
    expect(mockedSignInWithPopup).toHaveBeenCalledWith(expect.anything(), googleProvider);
  });

  it("falls back to signInWithRedirect on auth/web-storage-unsupported", async () => {
    setupPrepareMocks();
    mockedSignInWithPopup.mockRejectedValue({ code: "auth/web-storage-unsupported" });
    mockedSignInWithRedirect.mockResolvedValue(undefined as never);

    const store = new AuthStore();
    await (store as unknown as { prepareAuth(): Promise<unknown> }).prepareAuth();
    await (store as unknown as { loginByProvider(p: string): Promise<void> }).loginByProvider(
      "google",
    );

    expect(mockedSignInWithRedirect).toHaveBeenCalledTimes(1);
    expect(store.$isLoading.value).toBe(false);
    // Redirect navigates away; no error is surfaced for this expected fallback.
    expect(store.$error.value).toBeNull();
  });

  it("surfaces popup errors other than web-storage-unsupported", async () => {
    setupPrepareMocks();
    const popupBlocked = Object.assign(new Error("Firebase: Error (auth/popup-blocked)."), {
      code: "auth/popup-blocked",
    });
    mockedSignInWithPopup.mockRejectedValue(popupBlocked);

    const store = new AuthStore();
    await (store as unknown as { prepareAuth(): Promise<unknown> }).prepareAuth();
    await (store as unknown as { loginByProvider(p: string): Promise<void> }).loginByProvider(
      "google",
    );

    expect(mockedSignInWithRedirect).not.toHaveBeenCalled();
    expect(store.$error.value).toContain("auth/popup-blocked");
    expect(store.$isLoading.value).toBe(false);
  });

  it("supports the slow path when auth was not pre-warmed yet", async () => {
    setupPrepareMocks();
    mockedSignInWithPopup.mockResolvedValue({ user: { uid: "slow" } } as never);

    const store = new AuthStore();
    // No explicit prepareAuth() call: loginByProvider must await preparation.
    await (store as unknown as { loginByProvider(p: string): Promise<void> }).loginByProvider(
      "google",
    );

    expect(mockedSignInWithPopup).toHaveBeenCalledTimes(1);
    expect(store.$user.value).toEqual({ uid: "slow" });
    expect(store.$isLoading.value).toBe(false);
  });
});

describe("faucet auth proxy rewrites (vercel.json)", () => {
  const vercel = readJson<{
    rewrites?: { source: string; destination: string }[];
  }>("vercel.json");

  it("serves /__/auth/* same-origin to eliminate third-party storage partitioning", () => {
    const entry = vercel.rewrites?.find((rewrite) => rewrite.source === "/__/auth/:path*");
    expect(entry, "missing /__/auth rewrite").toBeDefined();
    expect(entry?.destination).toBe(
      "https://aptos-api-gateway-prod.firebaseapp.com/__/auth/:path*",
    );
  });

  it("serves /__/firebase/* same-origin alongside the auth handler", () => {
    const entry = vercel.rewrites?.find((rewrite) => rewrite.source === "/__/firebase/:path*");
    expect(entry, "missing /__/firebase rewrite").toBeDefined();
    expect(entry?.destination).toBe(
      "https://aptos-api-gateway-prod.firebaseapp.com/__/firebase/:path*",
    );
  });
});

describe("LoginButton disabled wiring", () => {
  it("accepts and forwards a disabled prop to Button", () => {
    const source = readText("src/components/react/LoginButton/LoginButton.tsx");
    expect(source).toMatch(/disabled\?:\s*boolean/);
    expect(source).toMatch(/disabled=\{disabled\}/);
  });

  it("gates both login buttons on isLoading in Faucet", () => {
    const source = readText("src/components/react/Faucet/Faucet.tsx");
    expect(source).toMatch(/isLoading/);
    expect(source).toMatch(/const\s*\{\s*[^}]*isLoading[^}]*\}\s*=\s*useAuth\(\)/);
    const disabledUsages = source.match(/disabled=\{isLoading\}/g) ?? [];
    expect(disabledUsages.length).toBeGreaterThanOrEqual(2);
  });
});

describe("CSP frame-src allows first-party + fallback auth domains", () => {
  it("keeps 'self' and firebaseapp.com in frame-src", () => {
    const source = readText("src/config/csp.ts");
    expect(source).toMatch(/frame-src/);
    expect(source).toContain("'self'");
    expect(source).toContain("aptos-api-gateway-prod.firebaseapp.com");
  });
});

describe("formatFirebaseAuthError", () => {
  it("gives popup-blocked errors actionable retry guidance", () => {
    expect(formatFirebaseAuthError({ code: "auth/popup-blocked" })).toBe(
      "Your browser blocked the Google sign-in window. Allow pop-ups for aptos.dev and try again. (auth/popup-blocked)",
    );
  });

  it("exposes an unknown Firebase code without leaking its raw message", () => {
    const message = formatFirebaseAuthError({
      code: "auth/internal-error",
      message: "Authentication failed for private@example.com",
    });

    expect(message).toBe("Google sign-in failed. Try again. (auth/internal-error)");
    expect(message).not.toContain("private@example.com");
  });

  it("uses a safe fallback when no Firebase code is available", () => {
    expect(formatFirebaseAuthError(new Error("secret deployment detail"))).toBe(
      "Google sign-in is temporarily unavailable. Try again later.",
    );
  });
});

describe("Faucet authentication UI", () => {
  const source = readFileSync(resolve(ROOT, "src/components/react/Faucet/Faucet.tsx"), "utf8");

  it("keeps sign-in controls available while showing an authentication error", () => {
    expect(source).not.toMatch(/if\s*\(\s*error\s*\)/);
    expect(source).toContain('role="alert"');
  });

  it("does not misdiagnose every authentication failure as missing configuration", () => {
    expect(source).not.toMatch(
      /Please make sure the correct environment\s+variables are specified/,
    );
  });
});
