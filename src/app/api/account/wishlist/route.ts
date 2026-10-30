import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, parseSessionUser } from "@/backend/auth.server";
import { listWishlistItems } from "@/backend/account-data.server";

function getCookieValue(request: Request) {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${AUTH_COOKIE_NAME}=`))
    ?.slice(AUTH_COOKIE_NAME.length + 1);
}

export async function GET(request: Request) {
  const user = parseSessionUser(getCookieValue(request) ? decodeURIComponent(getCookieValue(request) || "") : null);

  if (!user) {
    return NextResponse.json({ error: "No active session." }, { status: 401 });
  }

  const items = await listWishlistItems(user.id);
  return NextResponse.json({ items });
}
