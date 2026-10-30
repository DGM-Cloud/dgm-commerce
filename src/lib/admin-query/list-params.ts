export type AdminListQuery = {
  page: number;
  pageSize: number;
  q: string;
  stock: string;
  collection: string;
  status: string;
  productsOnly: boolean;
};

export function parseAdminListQuery(requestUrl: string): AdminListQuery {
  const url = new URL(requestUrl);
  const page = Math.max(1, Number(url.searchParams.get("page") || 1) || 1);
  const pageSizeRaw = Number(url.searchParams.get("pageSize") || 0) || 0;
  const pageSize = pageSizeRaw > 0 ? Math.min(200, pageSizeRaw) : 0;
  return {
    page,
    pageSize,
    q: (url.searchParams.get("q") || "").trim().toLowerCase(),
    stock: url.searchParams.get("stock") || "all",
    collection: url.searchParams.get("collection") || "all",
    status: url.searchParams.get("status") || "all",
    productsOnly: url.searchParams.get("productsOnly") === "1",
  };
}

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  if (!pageSize) {
    return { items, total: items.length, page: 1, pageSize: items.length || 25 };
  }
  const total = items.length;
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
  };
}
