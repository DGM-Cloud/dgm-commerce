"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import type { StorefrontProduct } from "@/lib/storefront-products";
import { sortStorefrontSizes } from "@/lib/storefront-products";
import { colorToHex } from "@/lib/catalog/catalog-utils";
import ProductsGrid from "@/components/products/ProductsGrid";
import { useProductStock } from "@/hooks/useProductStock";
import { siteContent } from "@/config/site-content";

type Facets = {
  categories: string[];
  collections: string[];
};

type ProductsCatalogProps = {
  initialProducts: StorefrontProduct[];
  facets: Facets;
  initialCategory?: string;
  initialCollection?: string;
  initialQuery?: string;
};

export default function ProductsCatalog({
  initialProducts,
  facets,
  initialCategory = "all",
  initialCollection = "all",
  initialQuery = "",
}: ProductsCatalogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedCollection, setSelectedCollection] = useState(initialCollection);
  const [selectedColor, setSelectedColor] = useState("all");
  const [selectedSize, setSelectedSize] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { stock, loading: stockLoading } = useProductStock();

  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || "all");
    setSelectedCollection(searchParams.get("collection") || "all");
    setSearchTerm(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    if (!filtersOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [filtersOpen]);

  const colors = useMemo(() => {
    const set = new Set<string>();
    for (const product of initialProducts) {
      for (const color of product.colors) set.add(color);
    }
    return Array.from(set).sort();
  }, [initialProducts]);

  const sizes = useMemo(() => {
    const set = new Set<string>();
    for (const product of initialProducts) {
      for (const size of product.sizes) set.add(size);
    }
    return sortStorefrontSizes(Array.from(set));
  }, [initialProducts]);

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return initialProducts.filter((product) => {
      if (selectedCategory !== "all" && product.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      if (
        selectedCollection !== "all" &&
        product.collection.toLowerCase() !== selectedCollection.toLowerCase()
      ) {
        return false;
      }
      if (selectedColor !== "all" && !product.colors.includes(selectedColor)) return false;
      if (selectedSize !== "all" && !product.sizes.includes(selectedSize)) return false;
      if (!query) return true;
      const haystack = [product.name, product.summary, product.seoDescription, product.category, product.collection]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [initialProducts, searchTerm, selectedCategory, selectedCollection, selectedColor, selectedSize]);

  function pushFilters(next: {
    category?: string;
    collection?: string;
    q?: string;
  }) {
    const params = new URLSearchParams();
    const category = next.category ?? selectedCategory;
    const collection = next.collection ?? selectedCollection;
    const q = next.q ?? searchTerm;

    if (category && category !== "all") params.set("category", category);
    if (collection && collection !== "all") params.set("collection", collection);
    if (q.trim()) params.set("q", q.trim());

    const query = params.toString();
    router.push(query ? `/products?${query}` : "/products", { scroll: false });
  }

  function clearFilters() {
    setSelectedColor("all");
    setSelectedSize("all");
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedCollection("all");
    router.push("/products", { scroll: false });
  }

  const activeFilterCount = [
    selectedCategory !== "all",
    selectedCollection !== "all",
    selectedColor !== "all",
    selectedSize !== "all",
    searchTerm.trim().length > 0,
  ].filter(Boolean).length;

  return (
    <main className="min-h-screen bg-white pt-20">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
            {siteContent.catalog.eyebrow}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
            {siteContent.catalog.title}
          </h1>
          <p className="mt-4 text-base leading-7 text-zinc-600">{siteContent.catalog.lead}</p>
        </header>

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <form
            className="flex w-full max-w-xl gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              pushFilters({ q: searchTerm });
            }}
          >
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar productos"
              className="w-full rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none ring-zinc-950 focus:ring-2"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Buscar
            </button>
          </form>

          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="inline-flex items-center justify-center rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-950 lg:hidden"
          >
            Filtros{activeFilterCount ? ` (${activeFilterCount})` : ""}
          </button>
        </div>

        <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <FiltersPanel
              facets={facets}
              colors={colors}
              sizes={sizes}
              selectedCategory={selectedCategory}
              selectedCollection={selectedCollection}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
              onCategory={(value) => {
                setSelectedCategory(value);
                pushFilters({ category: value });
              }}
              onCollection={(value) => {
                setSelectedCollection(value);
                pushFilters({ collection: value });
              }}
              onColor={setSelectedColor}
              onSize={setSelectedSize}
              onClear={clearFilters}
            />
          </aside>

          <div>
            <p className="mb-6 text-sm text-zinc-500">
              {filtered.length} producto{filtered.length === 1 ? "" : "s"}
            </p>
            <ProductsGrid products={filtered} stock={stock} stockLoading={stockLoading} onClearFilters={clearFilters} />
          </div>
        </div>
      </div>

      {filtersOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden">
          <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filtros</h2>
              <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Cerrar filtros">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <FiltersPanel
                facets={facets}
                colors={colors}
                sizes={sizes}
                selectedCategory={selectedCategory}
                selectedCollection={selectedCollection}
                selectedColor={selectedColor}
                selectedSize={selectedSize}
                onCategory={(value) => {
                  setSelectedCategory(value);
                  pushFilters({ category: value });
                }}
                onCollection={(value) => {
                  setSelectedCollection(value);
                  pushFilters({ collection: value });
                }}
                onColor={setSelectedColor}
                onSize={setSelectedSize}
                onClear={clearFilters}
              />
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="mt-4 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white"
            >
              Ver {filtered.length} resultados
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function FiltersPanel({
  facets,
  colors,
  sizes,
  selectedCategory,
  selectedCollection,
  selectedColor,
  selectedSize,
  onCategory,
  onCollection,
  onColor,
  onSize,
  onClear,
}: {
  facets: Facets;
  colors: string[];
  sizes: string[];
  selectedCategory: string;
  selectedCollection: string;
  selectedColor: string;
  selectedSize: string;
  onCategory: (value: string) => void;
  onCollection: (value: string) => void;
  onColor: (value: string) => void;
  onSize: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-950">Filtros</p>
        <button type="button" onClick={onClear} className="text-xs font-medium text-zinc-500 underline">
          Limpiar
        </button>
      </div>

      <FilterGroup label="Categoría">
        <FilterChip active={selectedCategory === "all"} onClick={() => onCategory("all")} label="Todas" />
        {facets.categories.map((category) => (
          <FilterChip
            key={category}
            active={selectedCategory.toLowerCase() === category.toLowerCase()}
            onClick={() => onCategory(category)}
            label={category}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="Colección">
        <FilterChip active={selectedCollection === "all"} onClick={() => onCollection("all")} label="Todas" />
        {facets.collections.map((collection) => (
          <FilterChip
            key={collection}
            active={selectedCollection.toLowerCase() === collection.toLowerCase()}
            onClick={() => onCollection(collection)}
            label={collection}
          />
        ))}
      </FilterGroup>

      {colors.length ? (
        <FilterGroup label="Color">
          <FilterChip active={selectedColor === "all"} onClick={() => onColor("all")} label="Todos" />
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onColor(color)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
                selectedColor === color
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-zinc-200 text-zinc-700"
              }`}
            >
              <span
                className="h-3.5 w-3.5 rounded-full border border-zinc-200"
                style={{ backgroundColor: colorToHex(color) }}
              />
              {color}
            </button>
          ))}
        </FilterGroup>
      ) : null}

      {sizes.length ? (
        <FilterGroup label="Talla">
          <FilterChip active={selectedSize === "all"} onClick={() => onSize("all")} label="Todas" />
          {sizes.map((size) => (
            <FilterChip key={size} active={selectedSize === size} onClick={() => onSize(size)} label={size} />
          ))}
        </FilterGroup>
      ) : null}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 text-zinc-700 hover:border-zinc-400"
      }`}
    >
      {label}
    </button>
  );
}
