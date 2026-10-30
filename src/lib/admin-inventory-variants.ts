import type { AdminInventoryVariantInput } from "@/lib/admin-data";

export function variantKey(color: string, size: string) {
  return `${color}|${size}`;
}

export function parseVariantKey(key: string) {
  const split = key.indexOf("|");
  if (split < 0) return { color: key, size: "STD" };
  return { color: key.slice(0, split), size: key.slice(split + 1) };
}

export function buildCartesianVariants(
  colors: string[],
  sizes: string[],
  defaults: { price: number; onHand: number; status?: AdminInventoryVariantInput["status"] },
  existing: AdminInventoryVariantInput[] = [],
): AdminInventoryVariantInput[] {
  const byKey = new Map(existing.map((row) => [variantKey(row.color, row.size), row]));
  return colors.flatMap((color) =>
    sizes.map((size) => {
      const key = variantKey(color, size);
      const prev = byKey.get(key);
      return (
        prev ?? {
          color,
          size,
          price: defaults.price,
          onHand: defaults.onHand,
          status: defaults.status ?? "active",
        }
      );
    }),
  );
}

export function syncOptionLists(variants: AdminInventoryVariantInput[]) {
  return {
    colors: Array.from(new Set(variants.map((row) => row.color))),
    sizes: Array.from(new Set(variants.map((row) => row.size))),
  };
}
