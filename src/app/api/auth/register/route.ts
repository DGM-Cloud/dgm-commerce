import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, signUpWithSupabase } from "@/backend/auth.server";

async function readBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  const body = await readBody(request);
  try {
    const user = await signUpWithSupabase({
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      provider: body.provider ?? "email",
      rememberMe: body.rememberMe ?? true,
      termsAccepted: body.termsAccepted,
      marketingOptIn: body.marketingOptIn,
    });

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
    const message = error instanceof Error ? error.message : "Registration failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
