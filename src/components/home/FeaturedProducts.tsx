"use client";

import React, { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import type { StorefrontProduct } from "@/lib/storefront-products";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { useStoreSettings } from "@/components/StoreChromeProvider";
import { getStoreFontPair, type StoreHomeContent } from "@/lib/store-cms";

function featuredGridClass(count: number) {
  if (count <= 1) return "sm:grid-cols-1";
  if (count === 2) return "sm:grid-cols-2";
  if (count === 3) return "sm:grid-cols-3";
  if (count === 4) return "sm:grid-cols-2 lg:grid-cols-4";
  if (count <= 6) return "sm:grid-cols-2 lg:grid-cols-3";
  return "sm:grid-cols-2 lg:grid-cols-4";
}

function buildFeaturedQuery(content: StoreHomeContent["featured"]) {
  const limit = Math.max(1, Math.min(8, content.limit || 3));
  if (content.source === "manual" && content.productIds?.length) {
    const ids = content.productIds.slice(0, limit).join(",");
    return `/api/products?ids=${encodeURIComponent(ids)}`;
  }
  if (content.source === "bestsellers") {
    return `/api/products?sort=bestsellers&limit=${limit}`;
  }
  return `/api/products?limit=${limit}`;
}

export default function FeaturedProducts({
  content,
}: {
  content: StoreHomeContent["featured"];
}) {
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const settings = useStoreSettings();
  const currencySymbol = settings.currencySymbol || "S/";

  const font = getStoreFontPair(content.fontPair);
  const backgroundColor = content.backgroundColor || "#ffffff";
  const textColor = content.textColor || "#09090b";
  const query = useMemo(() => buildFeaturedQuery(content), [content]);
  const skeletonCount = Math.max(1, Math.min(8, content.limit || 3));

  useEffect(() => {
    let cancelled = false;

    async function loadFeaturedProducts() {
      setLoading(true);
      try {
        const response = await fetch(query);
        const data = (await response.json()) as { products?: StorefrontProduct[]; error?: string };
        if (!response.ok) throw new Error(data.error || "No se pudieron cargar los productos.");
        if (!cancelled) {
          setProducts(data.products ?? []);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setProducts([]);
          setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los productos.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFeaturedProducts();
    return () => {
      cancelled = true;
    };
  }, [query]);

  if (!loading && !error && products.length === 0) return null;

  return (
    <section
      className="border-t"
      style={
        {
          backgroundColor,
          color: textColor,
          borderColor: "color-mix(in srgb, currentColor 12%, transparent)",
          fontFamily: `var(${font.sansVar})`,
          "--store-featured-display": `var(${font.displayVar})`,
          "--store-featured-muted": `color-mix(in srgb, ${textColor} 58%, transparent)`,
        } as CSSProperties
      }
    >
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              className="text-4xl font-semibold tracking-tight md:text-5xl"
              style={{ fontFamily: "var(--store-featured-display)" }}
            >
              {content.title}
            </h2>
            {content.subtitle ? (
              <p className="mt-4 text-lg" style={{ color: "var(--store-featured-muted)" }}>
                {content.subtitle}
              </p>
            ) : null}
          </div>
          {content.cta?.label && content.cta?.href ? (
            <Link
              href={content.cta.href}
              className="inline-flex shrink-0 items-center gap-2 font-semibold transition-all duration-300 hover:gap-4"
            >
              {content.cta.label}
              <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          ) : null}
        </div>

        {loading ? (
          <div className={`grid grid-cols-1 gap-8 ${featuredGridClass(skeletonCount)}`}>
            {Array.from({ length: skeletonCount }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div
                  className="aspect-[4/5]"
                  style={{ backgroundColor: "color-mix(in srgb, currentColor 8%, transparent)" }}
                />
                <div
                  className="mt-4 h-4 w-28"
                  style={{ backgroundColor: "color-mix(in srgb, currentColor 8%, transparent)" }}
                />
                <div
                  className="mt-2 h-3 w-16"
                  style={{ backgroundColor: "color-mix(in srgb, currentColor 8%, transparent)" }}
                />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-red-700">{error}</p>
        ) : (
          <div className={`grid grid-cols-1 gap-8 ${featuredGridClass(products.length)}`}>
            {products.map((product) => (
              <Link
                key={product.parentSku}
                href={product.path}
                title={product.seoDescription}
                className="group block"
              >
                <article>
                  <div
                    className="aspect-[4/5] overflow-hidden"
                    style={{ backgroundColor: "color-mix(in srgb, currentColor 8%, transparent)" }}
                  >
                    <img
                      src={product.images[0]}
                      alt={product.seoTitle || product.name}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="mt-4 text-base font-medium">{product.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm" style={{ color: "var(--store-featured-muted)" }}>
                    {product.seoDescription}
                  </p>
                  <p className="mt-1 text-sm">
                    {currencySymbol} {product.price.toFixed(2)}
                  </p>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
