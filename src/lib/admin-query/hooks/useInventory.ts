"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminInventoryItem, AdminInventoryProduct } from "@/lib/admin-data";
import { adminFetch } from "@/lib/admin-query/fetcher";
import { adminKeys } from "@/lib/admin-query/keys";

export type InventoryListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  stock?: string;
  collection?: string;
  status?: string;
};

export type InventorySummary = {
  totalProducts: number;
  totalSkus: number;
  totalOnHand: number;
  totalReserved: number;
  totalSold: number;
  totalAvailable: number;
  lowStock: number;
  outOfStock: number;
  collections: string[];
  categories: string[];
};

export type InventoryListResponse = {
  inventory: AdminInventoryItem[];
  products: AdminInventoryProduct[];
  total?: number;
  page?: number;
  pageSize?: number;
  summary?: InventorySummary;
};

function compactInventoryParams(params?: InventoryListParams) {
  if (!params) return undefined;
  return {
    page: params.page,
    pageSize: params.pageSize,
    q: params.q?.trim() || undefined,
    stock: params.stock && params.stock !== "all" ? params.stock : undefined,
    collection: params.collection && params.collection !== "all" ? params.collection : undefined,
    status: params.status && params.status !== "all" ? params.status : undefined,
  };
}

function buildInventoryUrl(params?: InventoryListParams & { productsOnly?: boolean }) {
  if (!params) return "/api/admin/inventory";
  const compact = compactInventoryParams(params);
  const search = new URLSearchParams();
  if (params.productsOnly) search.set("productsOnly", "1");
  if (compact?.page) search.set("page", String(compact.page));
  if (compact?.pageSize) search.set("pageSize", String(compact.pageSize));
  if (compact?.q) search.set("q", compact.q);
  if (compact?.stock) search.set("stock", compact.stock);
  if (compact?.collection) search.set("collection", compact.collection);
  if (compact?.status) search.set("status", compact.status);
  const qs = search.toString();
  return qs ? `/api/admin/inventory?${qs}` : "/api/admin/inventory";
}

/** Full inventory+products (SaleModal / legacy). Omit pageSize for complete payload. */
export function useInventoryQuery(params?: InventoryListParams) {
  const compact = compactInventoryParams(params);
  return useQuery({
    queryKey: adminKeys.inventory(compact),
    queryFn: () => adminFetch<InventoryListResponse>(buildInventoryUrl(params)),
  });
}

/** Paginated product catalog for inventory UI. Metrics come from `summary`. */
export function useInventoryProductsQuery(params?: InventoryListParams) {
  const compact = compactInventoryParams(params);
  const queryParams = { ...params, productsOnly: true as const };
  return useQuery({
    queryKey: adminKeys.inventoryProducts(compact),
    queryFn: () => adminFetch<InventoryListResponse>(buildInventoryUrl(queryParams)),
  });
}

/** Full product list (catalog generator). */
export function useInventoryProductsCatalogQuery(enabled = true) {
  return useQuery({
    queryKey: adminKeys.inventoryProducts({ all: 1 }),
    queryFn: () => adminFetch<InventoryListResponse>(buildInventoryUrl({ productsOnly: true })),
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useInvalidateInventory() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [...adminKeys.all, "inventory"] }),
      queryClient.invalidateQueries({ queryKey: [...adminKeys.all, "inventory-products"] }),
    ]);
}

export function useRefreshInventory(params?: InventoryListParams) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: adminKeys.inventory(params as Record<string, string | number | undefined> | undefined),
    });
}
