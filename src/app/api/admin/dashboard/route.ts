import { NextResponse } from "next/server";
import { getAdminDashboard } from "@/backend/admin-data.server";
import { requireStaffUser } from "@/backend/admin-api.server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { error: authError } = requireStaffUser(request);
  if (authError) return authError;

  try {
    const dashboard = await getAdminDashboard();
    return NextResponse.json({ dashboard });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cargar el dashboard.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
