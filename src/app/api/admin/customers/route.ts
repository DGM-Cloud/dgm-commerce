import { NextResponse } from "next/server";
import { listCustomerInsights } from "@/backend/admin-data.server";
import { requireStaffUser } from "@/backend/admin-api.server";

export async function GET(request: Request) {
  const { error: authError } = requireStaffUser(request);
  if (authError) return authError;

  const payload = await listCustomerInsights();
  return NextResponse.json(payload);
}
