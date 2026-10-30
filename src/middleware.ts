import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, parseSessionUser } from "@/backend/auth.server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieValue = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const user = parseSessionUser(cookieValue ? decodeURIComponent(cookieValue) : null);

  if ((pathname.startsWith("/account") || pathname.startsWith("/admin")) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && user && !user.roles?.some((role) => role === "vendedor" || role === "admin")) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  if ((pathname === "/login" || pathname === "/register") && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register", "/account/:path*", "/admin/:path*"],
};
