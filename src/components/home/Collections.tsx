"use client";

import React, { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { getStoreFontPair, type StoreHomeContent } from "@/lib/store-cms";
import type { StorefrontProduct } from "@/lib/storefront-products";

type CollectionCard = {
  key: string;
  title: string;
  href: string;
  image?: string;
  count: number;
};

function collectionsGridClass(count: number) {
  if (count <= 1) return "sm:grid-cols-1";
  if (count === 2) return "sm:grid-cols-2";
  if (count === 3) return "sm:grid-cols-2 md:grid-cols-3";
  if (count === 4) return "sm:grid-cols-2 md:grid-cols-4";
  return "sm:grid-cols-2 md:grid-cols-3";
}

function buildCollectionCards(
  products: StorefrontProduct[],
  facetNames: string[],
  content: StoreHomeContent["collections"],
): CollectionCard[] {
  const limit = Math.max(1, Math.min(8, content.limit || 6));
  const source = content.source || "all";

  const buildCard = (name: string, matches: StorefrontProduct[]): CollectionCard => ({
    key: name,
    title: name,
    href: `/products?collection=${encodeURIComponent(name)}`,
    image: matches[0]?.images?.[0],
    count: matches.length,
  });

  if (source === "manual") {
    const names = (content.selectedNames || []).slice(0, limit);
    return names
      .map((name) => {
        const matches = products.filter((product) => product.collection === name);
        if (!matches.length) return null;
        return buildCard(name, matches);
      })
      .filter((card): card is CollectionCard => Boolean(card));
  }

  const names = facetNames.length
    ? facetNames
    : Array.from(new Set(products.map((product) => product.collection).filter(Boolean)));

  let cards = names.map((name) => {
    const allMatches = products.filter((product) => product.collection === name);
    const matches =
      source === "in_stock" ? allMatches.filter((product) => product.available) : allMatches;
    return buildCard(name, matches);
  });

  if (source === "in_stock") {
    cards = cards.filter((card) => card.count > 0);
  }

  return cards.slice(0, limit);
}

export default function Collections({
  content,
}: {
  content: StoreHomeContent["collections"];
}) {
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [facetNames, setFacetNames] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  const font = getStoreFontPair(content.fontPair);
  const backgroundColor = content.backgroundColor || "#ffffff";
  const textColor = content.textColor || "#09090b";
  const linkLabel = content.linkLabel?.trim() || "Ver colección →";

  useEffect(() => {
    let cancelled = false;

    async function loadCollections() {
      try {
        const response = await fetch("/api/products");
        const data = (await response.json()) as {
          products?: StorefrontProduct[];
          facets?: { collections?: string[] };
        };

        if (!cancelled) {
          setProducts(data.products ?? []);
          setFacetNames(data.facets?.collections ?? []);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setFacetNames([]);
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    loadCollections();
    return () => {
      cancelled = true;
    };
  }, []);

  const collections = useMemo(
    () => buildCollectionCards(products, facetNames, content),
    [products, facetNames, content],
  );

  const sectionStyle = {
    backgroundColor,
    color: textColor,
    fontFamily: `var(${font.sansVar})`,
    "--store-collections-display": `var(${font.displayVar})`,
    "--store-collections-muted": `color-mix(in srgb, ${textColor} 58%, transparent)`,
  } as CSSProperties;

  if (loaded && !collections.length) {
    return (
      <section style={sectionStyle}>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
            style={{ fontFamily: "var(--store-collections-display)" }}
          >
            {content.title}
          </h2>
          <p className="mt-3 text-base" style={{ color: "var(--store-collections-muted)" }}>
            {content.empty}
          </p>
        </div>
      </section>
    );
  }

  if (!collections.length) return null;

  return (
    <section style={sectionStyle}>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <h2
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
          style={{ fontFamily: "var(--store-collections-display)" }}
        >
          {content.title}
        </h2>
        {content.subtitle ? (
          <p className="mt-3 max-w-2xl text-base" style={{ color: "var(--store-collections-muted)" }}>
            {content.subtitle}
          </p>
        ) : null}

        <div className={`mt-12 grid gap-10 md:gap-8 ${collectionsGridClass(collections.length)}`}>
          {collections.map((collection) => (
            <Link key={collection.key} href={collection.href} className="group block">
              <div
                className="aspect-[4/5] overflow-hidden"
                style={{ backgroundColor: "color-mix(in srgb, currentColor 8%, transparent)" }}
              >
                {collection.image ? (
                  <img
                    src={collection.image}
                    alt={collection.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="flex h-full items-end p-6"
                    style={{
                      background:
                        "linear-gradient(to bottom right, color-mix(in srgb, currentColor 12%, transparent), color-mix(in srgb, currentColor 6%, transparent))",
                    }}
                  >
                    <span
                      className="text-sm font-semibold uppercase tracking-[0.2em]"
                      style={{ color: "var(--store-collections-muted)" }}
                    >
                      {collection.title}
                    </span>
                  </div>
                )}
              </div>
              <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.22em]">{collection.title}</h3>
              <p className="mt-3 text-2xl font-medium tracking-tight">
                {collection.count} producto{collection.count === 1 ? "" : "s"}
              </p>
              <span className="mt-6 inline-flex text-xs font-semibold uppercase tracking-[0.18em]">
                {linkLabel}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
