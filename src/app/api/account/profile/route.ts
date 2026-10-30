import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, parseSessionUser, updateSupabaseProfile } from "@/backend/auth.server";

function getCookieValue(request: Request) {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${AUTH_COOKIE_NAME}=`))
    ?.slice(AUTH_COOKIE_NAME.length + 1);
}

async function readBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function PATCH(request: Request) {
  const currentUser = parseSessionUser(getCookieValue(request) ? decodeURIComponent(getCookieValue(request) || "") : null);

  if (!currentUser) {
    return NextResponse.json({ error: "No active session." }, { status: 401 });
  }

  const body = await readBody(request);
  try {
    const user = await updateSupabaseProfile(currentUser, body);
    const response = NextResponse.json({ user });
    response.cookies.set(AUTH_COOKIE_NAME, JSON.stringify(user), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: user.rememberMe ? 60 * 60 * 24 * 30 : undefined,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Profile update failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
