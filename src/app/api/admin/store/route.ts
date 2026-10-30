import { NextResponse } from "next/server";
import { requireStaffUser, readJsonBody } from "@/backend/admin-api.server";
import { getStoreCms, updateStoreCms } from "@/backend/store-cms.server";
import type { StoreCms } from "@/lib/store-cms";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { error: authError } = requireStaffUser(request);
  if (authError) return authError;

  try {
    const cms = await getStoreCms();
    return NextResponse.json({ cms });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cargar el CMS.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { error: authError } = requireStaffUser(request);
  if (authError) return authError;

  try {
    const body = await readJsonBody<{ cms: StoreCms }>(request);
    if (!body.cms) {
      return NextResponse.json({ error: "Payload cms requerido." }, { status: 400 });
    }

    const cms = await updateStoreCms(body.cms as StoreCms);
    return NextResponse.json({ cms });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar el CMS.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
