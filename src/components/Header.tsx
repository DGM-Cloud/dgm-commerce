"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faTimes,
  faShoppingBag,
  faUser,
  faSearch,
  faChevronDown,
  faGear,
  faBoxOpen,
  faHeart,
  faRightFromBracket,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/components/cart/CartProvider";
import BrandLogo from "@/components/BrandLogo";

interface HeaderProps {
  variant?: "transparent" | "solid";
}

const Header: React.FC<HeaderProps> = ({ variant = "solid" }) => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { itemCount } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const isOverlay = variant === "transparent" && !isScrolled;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => setIsMobileMenuOpen((open) => !open);
  const firstName = user?.firstName?.trim().split(/\s+/)[0] || user?.displayName?.trim().split(/\s+/)[0] || "";
  const canAccessAdmin = Boolean(user?.roles?.some((role) => role === "vendedor" || role === "admin"));

  const handleLogout = async () => {
    await signOut();
    setIsAccountMenuOpen(false);
    setIsMobileMenuOpen(false);
    router.replace("/login");
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md transition-all duration-300 ${
        isOverlay ? "shadow-none" : "shadow-lg"
      }`}
      style={{
        backgroundColor: isOverlay
          ? "color-mix(in srgb, var(--store-nav-bg) 80%, transparent)"
          : "color-mix(in srgb, var(--store-nav-bg) 95%, transparent)",
        color: "var(--store-nav-fg)",
        borderColor: "color-mix(in srgb, var(--store-nav-fg) 10%, transparent)",
        fontFamily: "var(--store-nav-sans)",
      }}
    >
      <nav className="mx-auto flex h-[4.75rem] max-w-7xl items-center gap-4 px-4 sm:px-6 lg:gap-8 lg:px-8">
        <BrandLogo />

        <div className="hidden flex-1 items-center justify-center lg:flex">
          <div className="flex items-center gap-1">
            <NavLink href="/">Inicio</NavLink>
            <NavLink href="/about">Nosotros</NavLink>
            <NavLink href="/products">Productos</NavLink>
            <NavLink href="/faq">FAQ</NavLink>
            <NavLink href="/contact">Contacto</NavLink>
          </div>
        </div>

        <div className="ml-auto hidden items-center gap-1 lg:flex">
          <IconButton ariaLabel="Buscar">
            <FontAwesomeIcon icon={faSearch} className="h-[1.125rem] w-[1.125rem]" />
          </IconButton>

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((value) => !value)}
                className="flex items-center gap-2 rounded-full px-3 py-2 text-current/70 transition-colors duration-200 hover:bg-current/5 hover:text-current"
                aria-label="Mi cuenta"
              >
                <FontAwesomeIcon icon={faUser} className="h-[1.125rem] w-[1.125rem]" />
                <span className="max-w-[7rem] truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-current">
                  {firstName}
                </span>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`h-2.5 w-2.5 transition-transform ${isAccountMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isAccountMenuOpen && (
                <div
                  className="absolute right-0 top-full z-[60] mt-2 w-64 rounded-2xl border p-2 shadow-2xl backdrop-blur-md"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--store-nav-bg) 95%, transparent)",
                    borderColor: "color-mix(in srgb, var(--store-nav-fg) 10%, transparent)",
                    color: "var(--store-nav-fg)",
                  }}
                >
                  <AccountLink href="/account" onClick={() => setIsAccountMenuOpen(false)} icon={faUser} label="Mi cuenta" />
                  {canAccessAdmin && (
                    <AccountLink href="/admin" onClick={() => setIsAccountMenuOpen(false)} icon={faChartLine} label="Admin" />
                  )}
                  <AccountLink href="/account/settings" onClick={() => setIsAccountMenuOpen(false)} icon={faGear} label="Configuración" />
                  <AccountLink href="/account/orders" onClick={() => setIsAccountMenuOpen(false)} icon={faBoxOpen} label="Mis órdenes" />
                  <AccountLink href="/account/wishlist" onClick={() => setIsAccountMenuOpen(false)} icon={faHeart} label="Wishlist" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-2 flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm text-current/70 transition-colors duration-200 hover:bg-current/10 hover:text-current"
                  >
                    <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-current/70 transition-colors duration-200 hover:text-current"
            >
              Cuenta
            </Link>
          )}

          <Link
            href="/cart"
            aria-label="Carrito"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-current/70 transition-colors duration-200 hover:bg-current/5 hover:text-current"
          >
            <FontAwesomeIcon icon={faShoppingBag} className="h-[1.125rem] w-[1.125rem]" />
            <CartBadge count={itemCount} />
          </Link>
        </div>

        <Link
          href="/cart"
          aria-label="Carrito"
          className="relative ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full text-current/70 transition-colors duration-200 hover:bg-current/5 hover:text-current lg:hidden"
        >
          <FontAwesomeIcon icon={faShoppingBag} className="h-[1.125rem] w-[1.125rem]" />
          <CartBadge count={itemCount} />
        </Link>

        <button
          type="button"
          onClick={toggleMobileMenu}
          className="inline-flex h-10 w-10 items-center justify-center text-current transition-colors duration-200 hover:text-current/70 lg:hidden"
          aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} className="h-5 w-5" />
        </button>
      </nav>

      <div
        className={`overflow-hidden border-t backdrop-blur-md transition-all duration-300 lg:hidden ${
          isMobileMenuOpen ? "max-h-[calc(100vh-4.75rem)] opacity-100" : "max-h-0 opacity-0"
        }`}
        style={{
          backgroundColor: "color-mix(in srgb, var(--store-nav-bg) 95%, transparent)",
          borderColor: "color-mix(in srgb, var(--store-nav-fg) 10%, transparent)",
        }}
      >
        <div className="space-y-1 overflow-y-auto px-4 py-4">
          <MobileNavLink href="/" onClick={() => setIsMobileMenuOpen(false)}>
            Inicio
          </MobileNavLink>
          <MobileNavLink href="/about" onClick={() => setIsMobileMenuOpen(false)}>
            Nosotros
          </MobileNavLink>
          <MobileNavLink href="/products" onClick={() => setIsMobileMenuOpen(false)}>
            Productos
          </MobileNavLink>
          <MobileNavLink href="/faq" onClick={() => setIsMobileMenuOpen(false)}>
            FAQ
          </MobileNavLink>
          <MobileNavLink href="/contact" onClick={() => setIsMobileMenuOpen(false)}>
            Contacto
          </MobileNavLink>
          <MobileNavLink href="/cart" onClick={() => setIsMobileMenuOpen(false)}>
            Carrito · {itemCount}
          </MobileNavLink>

          <div
            className="mt-3 border-t pt-3"
            style={{ borderColor: "color-mix(in srgb, var(--store-nav-fg) 10%, transparent)" }}
          >
            <MobileNavLink href={user ? "/account" : "/login"} onClick={() => setIsMobileMenuOpen(false)}>
              {user ? `Mi cuenta · ${firstName}` : "Iniciar sesión"}
            </MobileNavLink>
            {!user && (
              <MobileNavLink href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                Registrarme
              </MobileNavLink>
            )}
            {user && (
              <>
                <MobileNavLink href="/account/settings" onClick={() => setIsMobileMenuOpen(false)}>
                  Configuración
                </MobileNavLink>
                <MobileNavLink href="/account/orders" onClick={() => setIsMobileMenuOpen(false)}>
                  Mis órdenes
                </MobileNavLink>
                <MobileNavLink href="/account/wishlist" onClick={() => setIsMobileMenuOpen(false)}>
                  Wishlist
                </MobileNavLink>
                {canAccessAdmin && (
                  <MobileNavLink href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                    Admin
                  </MobileNavLink>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full rounded-lg px-4 py-3 text-left text-sm uppercase tracking-[0.14em] text-current/70 transition-colors duration-200 hover:bg-current/5 hover:text-current"
                >
                  Cerrar sesión
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const NavLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <Link
    href={href}
    className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-current/70 transition-colors duration-200 hover:text-current"
  >
    {children}
  </Link>
);

const MobileNavLink: React.FC<{ href: string; children: React.ReactNode; onClick: () => void }> = ({
  href,
  children,
  onClick,
}) => (
  <Link
    href={href}
    onClick={onClick}
    className="block rounded-lg px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-current/75 transition-colors duration-200 hover:bg-current/5 hover:text-current"
  >
    {children}
  </Link>
);

const CartBadge: React.FC<{ count: number }> = ({ count }) => (
  <span
    className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
    style={{ backgroundColor: "var(--store-nav-fg)", color: "var(--store-nav-bg)" }}
  >
    {count > 99 ? "99+" : count}
  </span>
);

const IconButton: React.FC<{ children: React.ReactNode; ariaLabel: string; className?: string }> = ({
  children,
  ariaLabel,
  className = "",
}) => (
  <button
    type="button"
    aria-label={ariaLabel}
    className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-current/70 transition-colors duration-200 hover:bg-current/5 hover:text-current ${className}`}
  >
    {children}
  </button>
);

const AccountLink: React.FC<{ href: string; label: string; icon: any; onClick: () => void }> = ({
  href,
  label,
  icon,
  onClick,
}) => (
  <Link
    href={href}
    onClick={onClick}
    className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-current/75 transition-colors duration-200 hover:bg-current/10 hover:text-current"
  >
    <FontAwesomeIcon icon={icon} className="h-4 w-4" />
    <span>{label}</span>
  </Link>
);

export default Header;
