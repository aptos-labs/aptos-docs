import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as firebaseErrors from "../src/lib/firebase/error";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

type ErrorFormatter = (error: unknown) => string;

function formatError(error: unknown): string | undefined {
  return (firebaseErrors as { formatFirebaseAuthError?: ErrorFormatter }).formatFirebaseAuthError?.(
    error,
  );
}

describe("formatFirebaseAuthError", () => {
  it("gives popup-blocked errors actionable retry guidance", () => {
    expect(formatError({ code: "auth/popup-blocked" })).toBe(
      "Your browser blocked the Google sign-in window. Allow pop-ups for aptos.dev and try again. (auth/popup-blocked)",
    );
  });

  it("exposes an unknown Firebase code without leaking its raw message", () => {
    const message = formatError({
      code: "auth/internal-error",
      message: "Authentication failed for private@example.com",
    });

    expect(message).toBe("Google sign-in failed. Try again. (auth/internal-error)");
    expect(message).not.toContain("private@example.com");
  });

  it("uses a safe fallback when no Firebase code is available", () => {
    expect(formatError(new Error("secret deployment detail"))).toBe(
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
