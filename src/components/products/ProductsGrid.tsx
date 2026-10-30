"use client";

import React from "react";
import Link from "next/link";
import { isNewArrival, type StorefrontProduct } from "@/lib/storefront-products";
import type { ProductStockMap } from "@/lib/product-stock";

interface ProductsGridProps {
  products: StorefrontProduct[];
  stock?: ProductStockMap;
  stockLoading?: boolean;
  onClearFilters?: () => void;
}

const ProductsGrid: React.FC<ProductsGridProps> = ({
  products,
  stock = {},
  stockLoading = false,
  onClearFilters,
}) => {
  if (products.length === 0) {
    return (
      <section className="px-6 py-20 text-center">
        <h3 className="text-xl font-semibold text-zinc-950">No se encontraron productos</h3>
        <p className="mt-2 text-sm text-zinc-500">Prueba con otros filtros o términos de búsqueda.</p>
        {onClearFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-5 text-sm font-semibold text-zinc-950 underline"
          >
            Limpiar filtros
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <section>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.parentSku}
            product={product}
            inStock={stockLoading || (stock[product.id]?.available ?? 0) > 0}
          />
        ))}
      </div>
    </section>
  );
};

const ProductCard: React.FC<{
  product: StorefrontProduct;
  inStock: boolean;
}> = ({ product, inStock }) => {
  return (
    <Link href={product.path} className="group block" title={product.seoDescription}>
      <article>
        <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100">
          <img
            src={product.images[0]}
            alt={product.seoTitle || product.name}
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.03] ${inStock ? "" : "opacity-60 grayscale"}`}
            loading="lazy"
          />
          {isNewArrival(product.createdAt) ? <NewArrivalBadge /> : null}
          {!inStock ? <OutOfStockBadge /> : null}
        </div>

        <div className="pt-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
            {product.subcollection || product.category || product.collection}
          </p>
          <h3 className="mt-1 line-clamp-2 text-sm font-medium text-zinc-950">{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{product.seoDescription}</p>
          <p className="mt-1 text-sm text-zinc-950">S/ {product.price.toFixed(2)}</p>
        </div>
      </article>
    </Link>
  );
};

function NewArrivalBadge() {
  return (
    <span className="absolute left-2 top-2 bg-zinc-950/80 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white">
      Nuevo
    </span>
  );
}

function OutOfStockBadge() {
  return (
    <span className="absolute right-2 top-2 bg-zinc-950/80 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white">
      Sin stock
    </span>
  );
}

export default ProductsGrid;
