import { Suspense } from "react";
import type { Metadata } from "next";
import ProductsCatalog from "@/components/products/ProductsCatalog";
import { getStorefrontCatalog } from "@/backend/storefront.server";
import { brand } from "@/config/brand";
import { absoluteUrl } from "@/lib/site-url";

export const revalidate = 60;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const category = firstParam(params.category);
  const collection = firstParam(params.collection);
  const q = firstParam(params.q);

  const parts = [category, collection, q ? `“${q}”` : null].filter(Boolean);
  const title = parts.length
    ? `${parts.join(" · ")} | Catálogo`
    : "Catálogo de productos";
  const description = parts.length
    ? `Explora ${parts.join(", ")} en ${brand.name}. ${brand.tagline}`
    : `Catálogo completo de ${brand.name}. ${brand.tagline}`;

  const query = new URLSearchParams();
  if (category) query.set("category", category);
  if (collection) query.set("collection", collection);
  if (q) query.set("q", q);
  const path = query.toString() ? `/products?${query}` : "/products";

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      siteName: brand.name,
      type: "website",
      locale: brand.locale === "es" ? "es_LA" : brand.locale,
    },
  };
}

async function CatalogSection({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const category = firstParam(params.category);
  const collection = firstParam(params.collection);
  const q = firstParam(params.q);

  const { products, facets } = await getStorefrontCatalog();

  return (
    <ProductsCatalog
      initialProducts={products}
      facets={facets}
      initialCategory={category || "all"}
      initialCollection={collection || "all"}
      initialQuery={q || ""}
    />
  );
}

export default function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-white pt-20 text-sm text-zinc-500">
          Cargando catálogo...
        </main>
      }
    >
      <CatalogSection searchParams={searchParams} />
    </Suspense>
  );
}
