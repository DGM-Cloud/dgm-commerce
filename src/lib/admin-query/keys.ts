export const adminKeys = {
  all: ["admin"] as const,
  me: () => [...adminKeys.all, "me"] as const,
  dashboard: () => [...adminKeys.all, "dashboard"] as const,
  inventory: (params?: Record<string, string | number | undefined>) =>
    [...adminKeys.all, "inventory", params ?? {}] as const,
  inventoryProducts: (params?: Record<string, string | number | undefined>) =>
    [...adminKeys.all, "inventory-products", params ?? {}] as const,
  sales: (params?: Record<string, string | number | undefined>) =>
    [...adminKeys.all, "sales", params ?? {}] as const,
  contacts: (params?: Record<string, string | number | undefined>) =>
    [...adminKeys.all, "contacts", params ?? {}] as const,
  customers: () => [...adminKeys.all, "customers"] as const,
  storeCms: () => [...adminKeys.all, "store-cms"] as const,
};
