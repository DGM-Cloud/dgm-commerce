import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, parseSessionUser } from "@/backend/auth.server";
import { listAccountOrders, listWishlistItems } from "@/backend/account-data.server";
import type { AccountDashboardData } from "@/lib/account-data";

function getCookieValue(request: Request) {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${AUTH_COOKIE_NAME}=`))
    ?.slice(AUTH_COOKIE_NAME.length + 1);
}

function isActiveOrderStatus(status: string) {
  const normalized = status.toLowerCase();
  return !(
    normalized.includes("entreg") ||
    normalized.includes("complet") ||
    normalized.includes("cancel") ||
    normalized.includes("anul")
  );
}

export async function GET(request: Request) {
  const user = parseSessionUser(getCookieValue(request) ? decodeURIComponent(getCookieValue(request) || "") : null);

  if (!user) {
    return NextResponse.json({ error: "No active session." }, { status: 401 });
  }

  const [orders, wishlist] = await Promise.all([listAccountOrders(user.id), listWishlistItems(user.id)]);
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
  const activeOrders = orders.filter((order) => isActiveOrderStatus(order.status)).length;

  const payload: AccountDashboardData = {
    orders,
    wishlist,
    stats: {
      totalOrders: orders.length,
      activeOrders,
      wishlistCount: wishlist.length,
      totalSpent,
    },
  };

  return NextResponse.json(payload);
}
