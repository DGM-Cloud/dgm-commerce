"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminSale } from "@/lib/admin-data";
import { adminFetch } from "@/lib/admin-query/fetcher";
import { adminKeys } from "@/lib/admin-query/keys";

export type SalesListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  channel?: string[];
  status?: string[];
  customer?: string[];
  id?: string[];
  amountMin?: string;
  amountMax?: string;
};

export type SalesFacets = {
  ids: string[];
  channels: string[];
  customers: string[];
  statuses: string[];
};

export type SalesListResponse = {
  sales: AdminSale[];
  total?: number;
  page?: number;
  pageSize?: number;
  facets?: SalesFacets;
};

function buildSalesUrl(params?: SalesListParams) {
  if (!params) return "/api/admin/sales";
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  if (params.q) search.set("q", params.q);
  if (params.channel?.length) search.set("channel", params.channel.join(","));
  if (params.status?.length) search.set("status", params.status.join(","));
  if (params.customer?.length) search.set("customer", params.customer.join(","));
  if (params.id?.length) search.set("id", params.id.join(","));
  if (params.amountMin) search.set("amountMin", params.amountMin);
  if (params.amountMax) search.set("amountMax", params.amountMax);
  const qs = search.toString();
  return qs ? `/api/admin/sales?${qs}` : "/api/admin/sales";
}

function toKey(params?: SalesListParams) {
  if (!params) return undefined;
  return {
    page: params.page,
    pageSize: params.pageSize,
    q: params.q,
    channel: params.channel?.join(",") || undefined,
    status: params.status?.join(",") || undefined,
    customer: params.customer?.join(",") || undefined,
    id: params.id?.join(",") || undefined,
    amountMin: params.amountMin,
    amountMax: params.amountMax,
  };
}

export function useSalesQuery(params?: SalesListParams) {
  return useQuery({
    queryKey: adminKeys.sales(toKey(params)),
    queryFn: () => adminFetch<SalesListResponse>(buildSalesUrl(params)),
  });
}

export function useInvalidateSales() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [...adminKeys.all, "sales"] });
}
