"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { CartProvider } from "@/components/cart/CartProvider";
import { StoreChromeProvider } from "@/components/StoreChromeProvider";
import type { StoreSettings, StoreTheme } from "@/lib/store-cms";

const ClientWrapper: React.FC<{
  children: React.ReactNode;
  theme: StoreTheme;
  settings: StoreSettings;
}> = ({ children, theme, settings }) => {
  const pathname = usePathname();
  const isStandaloneRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/admin");
  const isHomeRoute = pathname === "/" || pathname === "/home";

  return (
    <AuthProvider>
      <CartProvider>
        <StoreChromeProvider theme={theme} settings={settings}>
          <div className="flex min-h-screen flex-col bg-stone-50 text-zinc-900">
            {!isStandaloneRoute && <Header variant={isHomeRoute ? "transparent" : "solid"} />}
            <main className="flex-1">{children}</main>
            {!isStandaloneRoute && <Footer />}
          </div>
        </StoreChromeProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default ClientWrapper;
