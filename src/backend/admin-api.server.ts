import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, parseSessionUser } from "@/backend/auth.server";
import type { AuthUser } from "@/lib/auth";

function getCookieValue(request: Request) {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${AUTH_COOKIE_NAME}=`))
    ?.slice(AUTH_COOKIE_NAME.length + 1);
}

export function getSessionUserFromRequest(request: Request) {
  const rawCookie = getCookieValue(request);
  return parseSessionUser(rawCookie ? decodeURIComponent(rawCookie) : null);
}

export function isStaffUser(user: AuthUser | null | undefined) {
  return Boolean(user?.roles?.some((role) => role === "vendedor" || role === "admin"));
}

/** Session required. Returns 401 JSON when missing. */
export function requireSessionUser(request: Request) {
  const user = getSessionUserFromRequest(request);
  if (!user) {
    return { user: null as AuthUser | null, error: NextResponse.json({ error: "No active session." }, { status: 401 }) };
  }
  return { user, error: null as NextResponse | null };
}

/** Staff (vendedor/admin) required for /api/admin mutations and reads. */
export function requireStaffUser(request: Request) {
  const { user, error } = requireSessionUser(request);
  if (error || !user) return { user: null as AuthUser | null, error: error! };
  if (!isStaffUser(user)) {
    return {
      user: null as AuthUser | null,
      error: NextResponse.json({ error: "No tienes permiso para esta acción." }, { status: 403 }),
    };
  }
  return { user, error: null as NextResponse | null };
}

export async function readJsonBody<T>(request: Request): Promise<Partial<T>> {
  try {
    const text = await request.text();
    if (!text) return {};

    try {
      return JSON.parse(text) as Partial<T>;
    } catch {
      return {};
    }
  } catch {
    return {};
  }
}
