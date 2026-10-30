import { NextResponse } from "next/server";
import { establishSessionFromOAuthUser, resolveAuthProviderFromSupabaseUser } from "@/backend/auth.server";
import { getSupabaseUserFromAccessToken } from "@/backend/supabase.server";
import { sanitizeAuthRedirect } from "@/lib/auth-redirect";
import type { AuthProvider } from "@/lib/auth";
import { applySessionCookie } from "@/lib/session-cookie";

async function readBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function resolveRequestedProvider(value: unknown): AuthProvider | undefined {
  if (value === "google" || value === "facebook" || value === "apple") {
    return value;
  }

  return undefined;
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const accessToken = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";

  if (!accessToken) {
    return NextResponse.json({ error: "Token de acceso requerido." }, { status: 401 });
  }

  const body = await readBody(request);

  try {
    const supabaseUser = await getSupabaseUserFromAccessToken(accessToken);
    const provider = resolveRequestedProvider(body.provider) ?? resolveAuthProviderFromSupabaseUser(supabaseUser);
    const user = await establishSessionFromOAuthUser(supabaseUser, {
      provider,
      rememberMe: true,
      termsAccepted: body.termsAccepted ?? true,
      marketingOptIn: body.marketingOptIn ?? false,
    });

    const response = NextResponse.json({
      user,
      next: sanitizeAuthRedirect(typeof body.next === "string" ? body.next : null),
    });

    return applySessionCookie(response, user);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo completar el inicio de sesión.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
