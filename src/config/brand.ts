/**
 * Brand config for the storefront demo.
 * Dev-only notes belong in TEMPLATE.md — never in customer-facing copy.
 */
export const brand = {
  name: "DGM Commerce",
  shortName: "DGM",
  legalName: "DGM Commerce",
  tagline: "Ropa con estilo para tu día a día",
  description: "Tienda online de ropa urbana, casual y personalizable",
  domain: "dgmcommerce.com",
  email: "hola@dgmcommerce.com",
  supportEmail: "soporte@dgmcommerce.com",
  social: {
    instagram: "https://instagram.com/",
    tiktok: "https://tiktok.com/",
    facebook: "https://facebook.com/",
    whatsapp: "https://wa.me/",
  },
  logo: {
    src: "/images/logo.svg",
    alt: "DGM Commerce",
  },
  logoMark: {
    src: "/images/logo-mark.svg",
    alt: "DGM Commerce",
  },
  locale: "es",
  countryLabel: "Envíos a todo el país",
  currency: "PEN",
  currencySymbol: "S/",
} as const;

/** Browser / cookie keys — keep unique per deployment */
export const storageKeys = {
  cart: "dgm-commerce-cart",
  supabaseAuth: "dgm-commerce-supabase-auth",
  sessionCookie: "dgm-commerce-session",
} as const;

export type BrandConfig = typeof brand;
