import { NextResponse } from "next/server";
import { deleteContact, updateContact } from "@/backend/admin-data.server";
import { requireStaffUser, readJsonBody } from "@/backend/admin-api.server";
import type { AdminContact } from "@/lib/admin-data";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { error: authError } = requireStaffUser(request);
  if (authError) return authError;

  const { id } = await context.params;
  const body = await readJsonBody<Partial<Omit<AdminContact, "id">>>(request);
  const contact = await updateContact(id, body);

  if (!contact) {
    return NextResponse.json({ error: "Contact not found." }, { status: 404 });
  }

  return NextResponse.json({ contact });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { error: authError } = requireStaffUser(request);
  if (authError) return authError;

  const { id } = await context.params;
  const deleted = await deleteContact(id);

  if (!deleted) {
    return NextResponse.json({ error: "Contact not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
