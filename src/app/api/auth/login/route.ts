import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, signInWithSupabase } from "@/backend/auth.server";
import type { AuthProvider } from "@/lib/auth";

async function readBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  const body = await readBody(request);
  const provider = (body.provider ?? "email") as AuthProvider;

  if (provider !== "email") {
    return NextResponse.json({ error: "Usa el botón de Google para iniciar sesión con tu cuenta social." }, { status: 400 });
  }

  try {
    const user = await signInWithSupabase({
      email: body.email,
      password: body.password,
      provider,
      rememberMe: body.rememberMe ?? false,
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
    const message = error instanceof Error ? error.message : "Invalid credentials.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
