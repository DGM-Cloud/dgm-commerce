import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, parseSessionUser } from "@/backend/auth.server";
import AdminProviders from "@/components/admin/AdminProviders";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const user = parseSessionUser(cookieValue ? decodeURIComponent(cookieValue) : null);

  if (!user) {
    redirect("/login?next=/admin");
  }

  return (
    <AdminProviders>
      <AdminShell>{children}</AdminShell>
    </AdminProviders>
  );
}
