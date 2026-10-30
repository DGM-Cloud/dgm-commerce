import { supabaseTableRequest } from "@/backend/supabase.server";
import type { AccountOrder, AccountOrderItem, WishlistItem } from "@/lib/account-data";

interface AccountOrderRow {
  id: string;
  placed_at: string;
  status: string;
  total: number;
  shipping: string | null;
  account_order_items?: AccountOrderItemRow[];
}

interface AccountOrderItemRow {
  product_id: number;
  name: string;
  quantity: number;
  price: number;
  image: string | null;
}

interface WishlistItemRow {
  product_id: number;
  name: string;
  price: number;
  collection: string;
  image: string | null;
}

function orderItemFromRow(row: AccountOrderItemRow): AccountOrderItem {
  return {
    id: row.product_id,
    name: row.name,
    quantity: row.quantity,
    price: row.price,
    image: row.image ?? "/images/polo.avif",
  };
}

function orderFromRow(row: AccountOrderRow): AccountOrder {
  return {
    id: row.id,
    placedAt: row.placed_at,
    status: row.status,
    total: row.total,
    shipping: row.shipping ?? "",
    items: row.account_order_items?.map(orderItemFromRow) ?? [],
  };
}

function wishlistItemFromRow(row: WishlistItemRow): WishlistItem {
  return {
    id: row.product_id,
    name: row.name,
    price: row.price,
    collection: row.collection,
    image: row.image ?? "/images/polo.avif",
  };
}

export async function listAccountOrders(userId: string) {
  const query = `/account_orders?user_id=eq.${encodeURIComponent(userId)}&select=*,account_order_items(*)&order=placed_at.desc`;
  const rows = await supabaseTableRequest<AccountOrderRow[]>(query);
  return rows.map(orderFromRow);
}

export async function listWishlistItems(userId: string) {
  const rows = await supabaseTableRequest<WishlistItemRow[]>(
    `/wishlist_items?user_id=eq.${encodeURIComponent(userId)}&select=*&order=created_at.desc`
  );
  return rows.map(wishlistItemFromRow);
}
