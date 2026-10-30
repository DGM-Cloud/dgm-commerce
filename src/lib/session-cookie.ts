import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, type AuthUser } from "@/lib/auth";

export function applySessionCookie(response: NextResponse, user: AuthUser) {
  response.cookies.set(AUTH_COOKIE_NAME, JSON.stringify(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: user.rememberMe ? 60 * 60 * 24 * 30 : undefined,
  });

  return response;
}
