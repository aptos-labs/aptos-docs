export class FirebaseError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(`[Firebase]: ${message}`, options);
    this.name = "FirebaseError";
  }
}

const AUTH_ERROR_CODE_PATTERN = /^auth\/[a-z0-9-]+$/;

function getAuthErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) return null;

  const { code } = error as { code?: unknown };
  return typeof code === "string" && AUTH_ERROR_CODE_PATTERN.test(code) ? code : null;
}

export function formatFirebaseAuthError(error: unknown): string {
  const code = getAuthErrorCode(error);

  switch (code) {
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in window. Allow pop-ups for aptos.dev and try again. (auth/popup-blocked)";
    case "auth/popup-closed-by-user":
      return "Google sign-in closed before it finished. Try again. (auth/popup-closed-by-user)";
    case "auth/web-storage-unsupported":
      return "Your browser's privacy settings blocked storage required for Google sign-in. Allow site data for aptos.dev and try again. (auth/web-storage-unsupported)";
    case "auth/network-request-failed":
      return "Could not connect to Google sign-in. Check your connection and try again. (auth/network-request-failed)";
    case "auth/unauthorized-domain":
      return "Google sign-in is not configured for this domain. (auth/unauthorized-domain)";
    default:
      return code
        ? `Google sign-in failed. Try again. (${code})`
        : "Google sign-in is temporarily unavailable. Try again later.";
  }
}
