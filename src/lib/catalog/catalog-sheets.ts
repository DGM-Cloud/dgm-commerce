import type { AdminInventoryProduct } from "@/lib/admin-data";
import { deriveSubcollection, subcollectionSortRank } from "@/lib/product-subcollection";

export type CatalogProductSheet = {
  kind: "products";
  collection: string;
  subcollection: string;
  products: AdminInventoryProduct[];
};

export type CatalogCoverSheet = {
  kind: "cover";
  collection: string;
  subcollection: string;
  products: AdminInventoryProduct[];
};

export type CatalogSheet = CatalogCoverSheet | CatalogProductSheet;

function groupProducts(products: AdminInventoryProduct[]) {
  const collectionMap = new Map<string, Map<string, AdminInventoryProduct[]>>();

  for (const product of products) {
    const collection = product.collection || "General";
    const subcollection = product.subcollection || deriveSubcollection(product.product, product.collection);

    if (!collectionMap.has(collection)) {
      collectionMap.set(collection, new Map());
    }

    const subcollectionMap = collectionMap.get(collection)!;
    subcollectionMap.set(subcollection, [...(subcollectionMap.get(subcollection) || []), product]);
  }

  return Array.from(collectionMap.entries())
    .sort(([left], [right]) => left.localeCompare(right, "es"))
    .map(([collection, subcollectionMap]) => ({
      collection,
      subcollections: Array.from(subcollectionMap.entries())
        .sort(([left], [right]) => subcollectionSortRank(left) - subcollectionSortRank(right) || left.localeCompare(right, "es"))
        .map(([subcollection, groupProducts]) => ({
          subcollection,
          products: groupProducts.sort((left, right) => left.product.localeCompare(right.product, "es")),
        })),
    }));
}

export function buildCatalogSheets(products: AdminInventoryProduct[], productsPerPage: number): CatalogSheet[] {
  const sheets: CatalogSheet[] = [];

  for (const group of groupProducts(products)) {
    for (const section of group.subcollections) {
      sheets.push({
        kind: "cover",
        collection: group.collection,
        subcollection: section.subcollection,
        products: section.products,
      });

      for (let index = 0; index < section.products.length; index += productsPerPage) {
        sheets.push({
          kind: "products",
          collection: group.collection,
          subcollection: section.subcollection,
          products: section.products.slice(index, index + productsPerPage),
        });
      }
    }
  }

  return sheets;
}
