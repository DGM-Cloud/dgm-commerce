"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { cartItemCount, cartLineKey, cartSubtotal, isCartLine, normalizeCoupon, type CartLine } from "@/lib/cart";
import { storageKeys } from "@/config/brand";

const STORAGE_KEY = storageKeys.cart;

type StoredCart = {
  lines: CartLine[];
  coupon: string | null;
};

type CartContextValue = {
  lines: CartLine[];
  coupon: string | null;
  ready: boolean;
  itemCount: number;
  subtotal: number;
  addItem: (item: CartLine, maxAvailable: number) => void;
  setQuantity: (key: string, quantity: number, maxAvailable: number) => void;
  removeItem: (key: string) => void;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
  clear: () => void;
};

function readStoredCart(raw: string | null): StoredCart {
  if (!raw) return { lines: [], coupon: null };

  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { lines: parsed.filter(isCartLine), coupon: null };
    }

    if (parsed && typeof parsed === "object") {
      const record = parsed as { lines?: unknown; coupon?: unknown };
      const coupon = typeof record.coupon === "string" ? normalizeCoupon(record.coupon) : "";
      return {
        lines: Array.isArray(record.lines) ? record.lines.filter(isCartLine) : [],
        coupon: coupon || null,
      };
    }
  } catch {
    return { lines: [], coupon: null };
  }

  return { lines: [], coupon: null };
}

const CartContext = createContext<CartContextValue | null>(null);

function clampQuantity(quantity: number, maxAvailable: number) {
  return Math.max(0, Math.min(Math.floor(quantity), Math.floor(maxAvailable)));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<StoredCart>({ lines: [], coupon: null });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCart(readStoredCart(window.localStorage.getItem(STORAGE_KEY)));
    setReady(true);
  }, []);

  const commit = (recipe: (current: StoredCart) => StoredCart) => {
    setCart((current) => {
      const next = recipe(current);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const value = useMemo<CartContextValue>(() => {
    const { lines, coupon } = cart;

    return {
      lines,
      coupon,
      ready,
      itemCount: cartItemCount(lines),
      subtotal: cartSubtotal(lines),
      addItem(item, maxAvailable) {
        commit((current) => {
          const key = cartLineKey(item);
          const existing = current.lines.find((line) => cartLineKey(line) === key);
          const nextQuantity = clampQuantity((existing?.quantity ?? 0) + item.quantity, maxAvailable);
          if (nextQuantity <= 0) return current;

          const nextLine: CartLine = {
            productId: item.productId,
            name: item.name,
            price: item.price,
            image: item.image,
            color: item.color,
            size: item.size,
            quantity: nextQuantity,
          };

          const lines = existing
            ? current.lines.map((line) => (cartLineKey(line) === key ? nextLine : line))
            : [...current.lines, nextLine];

          return { ...current, lines };
        });
      },
      setQuantity(key, quantity, maxAvailable) {
        const nextQuantity = clampQuantity(quantity, maxAvailable);
        commit((current) => ({
          ...current,
          lines:
            nextQuantity <= 0
              ? current.lines.filter((line) => cartLineKey(line) !== key)
              : current.lines.map((line) => (cartLineKey(line) === key ? { ...line, quantity: nextQuantity } : line)),
        }));
      },
      removeItem(key) {
        commit((current) => ({
          ...current,
          lines: current.lines.filter((line) => cartLineKey(line) !== key),
        }));
      },
      applyCoupon(code) {
        const nextCoupon = normalizeCoupon(code);
        if (!nextCoupon) return;
        commit((current) => ({ ...current, coupon: nextCoupon }));
      },
      removeCoupon() {
        commit((current) => ({ ...current, coupon: null }));
      },
      clear() {
        commit(() => ({ lines: [], coupon: null }));
      },
    };
  }, [cart, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) {
    throw new Error("useCart debe usarse dentro de CartProvider.");
  }
  return cart;
}
