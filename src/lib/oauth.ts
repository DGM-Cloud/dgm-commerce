import type { AuthProvider } from "@/lib/auth";
import { sanitizeAuthRedirect } from "@/lib/auth-redirect";

export type OAuthProvider = Exclude<AuthProvider, "email" | "apple">;

export interface OAuthSignInOptions {
  next?: string;
  termsAccepted?: boolean;
  marketingOptIn?: boolean;
}

export function buildOAuthCallbackUrl(provider: OAuthProvider, options?: OAuthSignInOptions) {
  const params = new URLSearchParams({
    next: sanitizeAuthRedirect(options?.next),
    provider,
  });

  if (options?.termsAccepted) {
    params.set("terms", "1");
  }

  if (options?.marketingOptIn) {
    params.set("marketing", "1");
  }

  return `${window.location.origin}/auth/callback?${params.toString()}`;
}

export function parseOAuthProvider(value: string | null | undefined): OAuthProvider | null {
  if (value === "google" || value === "facebook") {
    return value;
  }

  return null;
}

export function oauthProviderLabel(provider: OAuthProvider) {
  return provider === "google" ? "Google" : "Facebook";
}
