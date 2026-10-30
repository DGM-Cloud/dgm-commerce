import { NextResponse } from "next/server";
import { deleteInventoryItem, updateInventoryItem } from "@/backend/admin-data.server";
import { requireStaffUser, readJsonBody } from "@/backend/admin-api.server";
import type { AdminInventoryItem } from "@/lib/admin-data";

export async function PATCH(request: Request, context: { params: Promise<{ sku: string }> }) {
  const { error: authError } = requireStaffUser(request);
  if (authError) return authError;

  const { sku } = await context.params;
  const body = await readJsonBody<Partial<Omit<AdminInventoryItem, "sku">>>(request);
  const item = await updateInventoryItem(sku, body);

  if (!item) {
    return NextResponse.json({ error: "Inventory item not found." }, { status: 404 });
  }

  return NextResponse.json({ item });
}

export async function DELETE(request: Request, context: { params: Promise<{ sku: string }> }) {
  const { error: authError } = requireStaffUser(request);
  if (authError) return authError;

  const { sku } = await context.params;
  const deleted = await deleteInventoryItem(sku);

  if (!deleted) {
    return NextResponse.json({ error: "Inventory item not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
