import { NextResponse } from "next/server";
import { deleteSale, updateSale } from "@/backend/admin-data.server";
import { requireStaffUser, readJsonBody } from "@/backend/admin-api.server";
import type { AdminSale } from "@/lib/admin-data";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { error: authError } = requireStaffUser(request);
  if (authError) return authError;

  const { id } = await context.params;
  const body = await readJsonBody<Partial<Omit<AdminSale, "id">>>(request);
  const sale = await updateSale(id, body);

  if (!sale) {
    return NextResponse.json({ error: "Sale not found." }, { status: 404 });
  }

  return NextResponse.json({ sale });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { error: authError } = requireStaffUser(request);
  if (authError) return authError;

  const { id } = await context.params;
  const deleted = await deleteSale(id);

  if (!deleted) {
    return NextResponse.json({ error: "Sale not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
