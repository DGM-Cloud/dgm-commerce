"use client";

import { useQuery } from "@tanstack/react-query";
import type { AdminDashboard } from "@/lib/admin-data";
import { adminFetch } from "@/lib/admin-query/fetcher";
import { adminKeys } from "@/lib/admin-query/keys";
import { normalizeDashboard } from "@/lib/admin-query/normalize-dashboard";

export { normalizeDashboard } from "@/lib/admin-query/normalize-dashboard";

export function useDashboardQuery() {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: async () => {
      const payload = await adminFetch<{ dashboard?: AdminDashboard } & Partial<AdminDashboard>>(
        "/api/admin/dashboard",
      );
      return normalizeDashboard(payload);
    },
    staleTime: 60_000,
    select: (data) => normalizeDashboard(data),
  });
}
