"use client";

import { useQuery } from "@tanstack/react-query";
import type { AdminCustomerInsight, AdminCustomerSummary } from "@/lib/admin-data";
import { adminFetch } from "@/lib/admin-query/fetcher";
import { adminKeys } from "@/lib/admin-query/keys";

export type CustomersResponse = {
  customers: AdminCustomerInsight[];
  summary: AdminCustomerSummary;
};

export function useCustomersQuery() {
  return useQuery({
    queryKey: adminKeys.customers(),
    queryFn: () => adminFetch<CustomersResponse>("/api/admin/customers"),
  });
}
