"use client";

import { useEffect, useState } from "react";
import type { ProductStockMap } from "@/lib/product-stock";

export function useProductStock() {
  const [stock, setStock] = useState<ProductStockMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetch("/api/products/stock", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (mounted) setStock(payload.stock || {});
      })
      .catch(() => {
        if (mounted) setStock({});
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { stock, loading };
}
