import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getUserRoles, parseSessionUser } from "@/backend/auth.server";

export async function GET(request: Request) {
  const cookieValue = request.headers.get("cookie")
    ?.split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${AUTH_COOKIE_NAME}=`))
    ?.slice(AUTH_COOKIE_NAME.length + 1);

  const user = parseSessionUser(cookieValue ? decodeURIComponent(cookieValue) : null);

  if (!user) {
    return NextResponse.json({ user: null });
  }

  const roles = await getUserRoles(user.id);
  const refreshedUser = { ...user, roles };
  const response = NextResponse.json({ user: refreshedUser });

  response.cookies.set(AUTH_COOKIE_NAME, JSON.stringify(refreshedUser), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: refreshedUser.rememberMe ? 60 * 60 * 24 * 30 : undefined,
  });

  return response;
}
