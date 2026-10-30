import type { CSSProperties } from "react";
import { brand } from "@/config/brand";
import { siteContent } from "@/config/site-content";
import {
  DEFAULT_ORDER_STATUSES,
  normalizeOrderStatuses,
  type OrderStatusConfig,
} from "@/lib/order-status";

export type { OrderStatusConfig };

export type HeroSlideTone =
  | "dark"
  | "warm"
  | "cool"
  | "ink"
  | "sand"
  | "forest"
  | "wine"
  | "sky"
  | "custom";

export type HeroBackgroundMode = "solid" | "gradient" | "spotlight" | "image";

export const HERO_BACKGROUND_MODES: Array<{
  value: HeroBackgroundMode;
  label: string;
  hint: string;
}> = [
  { value: "solid", label: "Sólido", hint: "Un solo color limpio" },
  { value: "gradient", label: "Degradé", hint: "Dos colores en diagonal" },
  { value: "spotlight", label: "Foco", hint: "Luz suave desde una esquina" },
  { value: "image", label: "Imagen", hint: "Foto de fondo" },
];

const HERO_BACKGROUND_MODE_IDS: HeroBackgroundMode[] = HERO_BACKGROUND_MODES.map((item) => item.value);

/** Old modes that may still exist in saved CMS data. */
const LEGACY_BACKGROUND_MODE_MAP: Record<string, HeroBackgroundMode> = {
  primary: "solid",
  secondary: "solid",
};

const LEGACY_TONE_COLORS: Record<Exclude<HeroSlideTone, "custom">, [string, string]> = {
  dark: ["#09090b", "#44403c"],
  warm: ["#1c1917", "#78350f"],
  cool: ["#09090b", "#134e4a"],
  ink: ["#000000", "#27272a"],
  sand: ["#292524", "#78350f"],
  forest: ["#052e16", "#09090b"],
  wine: ["#4c0519", "#1c1917"],
  sky: ["#0c1a2e", "#082f49"],
};

export type StoreHeroSlide = {
  id: string;
  kicker: string;
  title: string;
  text: string;
  href: string;
  backgroundMode: HeroBackgroundMode;
  primaryColor: string;
  secondaryColor: string;
  /** Text / titles color on the banner */
  textColor: string;
  /** Optional background image URL */
  image?: string;
  /** Optional primary button label for this slide */
  ctaLabel?: string;
  /** @deprecated Migrated into backgroundMode / colors */
  tone?: HeroSlideTone;
  /** @deprecated Migrated into primaryColor */
  customColor?: string;
};

export type StoreCta = {
  label: string;
  href: string;
};

export type StoreHeroAlign = "left" | "center" | "right";

export const STORE_HERO_ALIGN_OPTIONS: Array<{
  value: StoreHeroAlign;
  label: string;
  hint: string;
}> = [
  { value: "left", label: "Izquierda", hint: "Clásico" },
  { value: "center", label: "Centro", hint: "Equilibrado" },
  { value: "right", label: "Derecha", hint: "Distinto" },
];

export function normalizeHeroAlign(value?: string | null): StoreHeroAlign {
  if (value === "center" || value === "right" || value === "left") return value;
  return "left";
}

export type StoreHomeContent = {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: StoreCta;
    secondaryCta: StoreCta;
    /** Tipografía solo de la portada */
    fontPair: StoreFontPairId;
    /** Alineación del contenido de la portada */
    align: StoreHeroAlign;
    slides: StoreHeroSlide[];
  };
  featured: {
    title: string;
    subtitle: string;
    cta: StoreCta;
    backgroundColor: string;
    textColor: string;
    fontPair: StoreFontPairId;
    /** How many products to show (2–8) */
    limit: number;
    /** newest | bestsellers | manual */
    source: StoreFeaturedSource;
    /** Product IDs when source is manual (order preserved) */
    productIds: number[];
  };
  value: {
    title: string;
    backgroundColor: string;
    textColor: string;
    fontPair: StoreFontPairId;
    points: Array<{ title: string; text: string }>;
  };
  collections: {
    title: string;
    subtitle: string;
    empty: string;
    backgroundColor: string;
    textColor: string;
    fontPair: StoreFontPairId;
    /** How many collection cards to show (2–8) */
    limit: number;
    /** all | in_stock | manual */
    source: StoreCollectionSource;
    /** Collection names when source is manual (order preserved) */
    selectedNames: string[];
    /** CTA text on each card */
    linkLabel: string;
  };
  finalCta: {
    title: string;
    subtitle: string;
    /** Short urgency / benefit line under the subtitle */
    urgency: string;
    backgroundColor: string;
    textColor: string;
    fontPair: StoreFontPairId;
    cta: StoreCta;
    /** Optional second button (often WhatsApp). Empty label hides it. */
    secondaryCta: StoreCta;
  };
};

export type StoreSeoContent = {
  title: string;
  titleTemplate: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  keywords: string;
};

export type StoreFontPairId =
  | "classic"
  | "editorial"
  | "modern"
  | "soft"
  | "bold"
  | "warm";

export type StoreLogoMode = "text" | "image";
export type StoreLogoScale = "sm" | "md" | "lg" | "xl";
export type StoreFeaturedSource = "newest" | "bestsellers" | "manual";
export type StoreCollectionSource = "all" | "in_stock" | "manual";

export const STORE_FEATURED_SOURCES: Array<{
  value: StoreFeaturedSource;
  label: string;
  hint: string;
}> = [
  { value: "newest", label: "Más recientes", hint: "Los últimos del inventario" },
  { value: "bestsellers", label: "Más vendidos", hint: "Según ventas reales" },
  { value: "manual", label: "Elegidos a mano", hint: "Tú escoges cuáles y el orden" },
];

export const STORE_FEATURED_LIMITS = [2, 3, 4, 6, 8] as const;

export const STORE_COLLECTION_SOURCES: Array<{
  value: StoreCollectionSource;
  label: string;
  hint: string;
}> = [
  { value: "all", label: "Todas", hint: "Todas las del inventario" },
  { value: "in_stock", label: "Con stock", hint: "Solo las que tienen productos disponibles" },
  { value: "manual", label: "Elegidas a mano", hint: "Tú escoges cuáles y el orden" },
];

export const STORE_COLLECTION_LIMITS = [2, 3, 4, 6, 8] as const;

export type StoreContact = {
  blurb: string;
  whatsapp: string;
  whatsappNote: string;
  email: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  locationLabel: string;
  description: string;
  bottomNote: string;
};

export type StoreTheme = {
  navbarBackground: string;
  navbarText: string;
  footerBackground: string;
  footerText: string;
  /** Typography for navbar links / chrome */
  fontPair: StoreFontPairId;
  /** Typography for footer text */
  footerFontPair: StoreFontPairId;
  /** Logo shown in navbar / footer */
  logoMode: StoreLogoMode;
  logoText: string;
  logoImage: string;
  logoFontPair: StoreFontPairId;
  logoScale: StoreLogoScale;
  contact: StoreContact;
};

export const STORE_LOGO_SCALES: Array<{
  value: StoreLogoScale;
  label: string;
  hint: string;
  textClass: string;
  imageClass: string;
  cssSize: string;
}> = [
  {
    value: "sm",
    label: "S",
    hint: "Compacto",
    textClass: "text-base sm:text-lg",
    imageClass: "h-6 max-w-[140px] sm:h-7 sm:max-w-[160px]",
    cssSize: "1.125rem",
  },
  {
    value: "md",
    label: "M",
    hint: "Normal",
    textClass: "text-lg sm:text-xl",
    imageClass: "h-7 max-w-[180px] sm:h-8 sm:max-w-[220px]",
    cssSize: "1.35rem",
  },
  {
    value: "lg",
    label: "L",
    hint: "Grande",
    textClass: "text-xl sm:text-2xl",
    imageClass: "h-9 max-w-[200px] sm:h-10 sm:max-w-[240px]",
    cssSize: "1.6rem",
  },
  {
    value: "xl",
    label: "XL",
    hint: "Muy grande",
    textClass: "text-2xl sm:text-3xl",
    imageClass: "h-11 max-w-[240px] sm:h-12 sm:max-w-[280px]",
    cssSize: "1.9rem",
  },
];

export function getStoreLogoScale(id?: string | null) {
  return STORE_LOGO_SCALES.find((item) => item.value === id) || STORE_LOGO_SCALES[1];
}

/** Business / store defaults — edited in Admin → Configuración. */
export type StoreSettings = {
  storeName: string;
  shortName: string;
  legalName: string;
  tagline: string;
  description: string;
  domain: string;
  email: string;
  supportEmail: string;
  whatsapp: string;
  whatsappNote: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  locationLabel: string;
  locale: string;
  timezone: string;
  currency: string;
  currencySymbol: string;
  /** Optional public business address line */
  address: string;
  /** Configurable sale/order statuses with badge colors. */
  orderStatuses: OrderStatusConfig[];
};

export type StoreCms = {
  seo: StoreSeoContent;
  home: StoreHomeContent;
  theme: StoreTheme;
  settings: StoreSettings;
  updatedAt?: string | null;
};

export const STORE_FONT_PAIRS: Array<{
  id: StoreFontPairId;
  label: string;
  hint: string;
  displayName: string;
  bodyName: string;
  displayVar: string;
  sansVar: string;
}> = [
  {
    id: "classic",
    label: "Clásica",
    hint: "Elegante y clara",
    displayName: "Fraunces",
    bodyName: "Manrope",
    displayVar: "--font-fraunces",
    sansVar: "--font-manrope",
  },
  {
    id: "editorial",
    label: "Editorial",
    hint: "Estilo revista",
    displayName: "Playfair",
    bodyName: "Source Sans",
    displayVar: "--font-playfair",
    sansVar: "--font-source-sans",
  },
  {
    id: "modern",
    label: "Moderna",
    hint: "Geométrica",
    displayName: "Space Grotesk",
    bodyName: "Outfit",
    displayVar: "--font-space-grotesk",
    sansVar: "--font-outfit",
  },
  {
    id: "soft",
    label: "Suave",
    hint: "Cálida y amable",
    displayName: "Cormorant",
    bodyName: "Nunito",
    displayVar: "--font-cormorant",
    sansVar: "--font-nunito",
  },
  {
    id: "bold",
    label: "Fuerte",
    hint: "Con carácter",
    displayName: "Archivo",
    bodyName: "DM Sans",
    displayVar: "--font-archivo",
    sansVar: "--font-dm-sans",
  },
  {
    id: "warm",
    label: "Cálida",
    hint: "Artesanal",
    displayName: "Libre Baskerville",
    bodyName: "Karla",
    displayVar: "--font-libre-baskerville",
    sansVar: "--font-karla",
  },
];

export function getStoreFontPair(id?: string | null) {
  return STORE_FONT_PAIRS.find((pair) => pair.id === id) || STORE_FONT_PAIRS[0];
}

export const STORE_THEME_PRESETS: Array<{
  id: string;
  label: string;
  theme: Pick<StoreTheme, "navbarBackground" | "navbarText" | "footerBackground" | "footerText">;
}> = [
  {
    id: "ink",
    label: "Negro",
    theme: {
      navbarBackground: "#000000",
      navbarText: "#ffffff",
      footerBackground: "#09090b",
      footerText: "#ffffff",
    },
  },
  {
    id: "stone",
    label: "Piedra",
    theme: {
      navbarBackground: "#1c1917",
      navbarText: "#fafaf9",
      footerBackground: "#0c0a09",
      footerText: "#fafaf9",
    },
  },
  {
    id: "forest",
    label: "Verde",
    theme: {
      navbarBackground: "#052e16",
      navbarText: "#ecfdf5",
      footerBackground: "#022c22",
      footerText: "#ecfdf5",
    },
  },
  {
    id: "wine",
    label: "Vino",
    theme: {
      navbarBackground: "#4c0519",
      navbarText: "#fff1f2",
      footerBackground: "#1c1917",
      footerText: "#fff1f2",
    },
  },
  {
    id: "navy",
    label: "Azul",
    theme: {
      navbarBackground: "#0c1a2e",
      navbarText: "#f0f9ff",
      footerBackground: "#020617",
      footerText: "#f0f9ff",
    },
  },
  {
    id: "cream",
    label: "Claro",
    theme: {
      navbarBackground: "#fafaf9",
      navbarText: "#18181b",
      footerBackground: "#f5f5f4",
      footerText: "#18181b",
    },
  },
];

export function createEmptyBanner(index = 0): StoreHeroSlide {
  return normalizeHeroSlide(
    {
      id: `banner-${Date.now()}-${index}`,
      kicker: "Nueva",
      title: "Nuevo banner",
      text: "Cuenta en una frase qué ofreces.",
      href: "/products",
      backgroundMode: "gradient",
      primaryColor: "#18181b",
      secondaryColor: "#000000",
      textColor: "#ffffff",
      image: "",
      ctaLabel: "",
    },
    index,
  );
}

export function normalizeHeroBackgroundMode(value?: string | null): HeroBackgroundMode | null {
  if (!value) return null;
  if (HERO_BACKGROUND_MODE_IDS.includes(value as HeroBackgroundMode)) {
    return value as HeroBackgroundMode;
  }
  return LEGACY_BACKGROUND_MODE_MAP[value] || null;
}

export function normalizeHeroSlide(slide: Partial<StoreHeroSlide>, index = 0): StoreHeroSlide {
  const rawTone = slide.tone;
  const legacyPair =
    rawTone && rawTone !== "custom" && LEGACY_TONE_COLORS[rawTone]
      ? LEGACY_TONE_COLORS[rawTone]
      : (["#18181b", "#000000"] as [string, string]);

  let primaryColor =
    normalizeHex(slide.primaryColor) ||
    normalizeHex(slide.customColor) ||
    legacyPair[0];
  const secondaryColor = normalizeHex(slide.secondaryColor) || legacyPair[1];
  const textColor = normalizeHex(slide.textColor) || "#ffffff";
  const image = slide.image?.trim() || "";

  // Old "secondary" mode used the secondary swatch as the solid fill.
  if ((slide.backgroundMode as string | undefined) === "secondary" && !normalizeHex(slide.primaryColor)) {
    primaryColor = secondaryColor;
  }

  let backgroundMode = normalizeHeroBackgroundMode(slide.backgroundMode);
  if (!backgroundMode) {
    if (image) backgroundMode = "image";
    else if (rawTone === "custom") backgroundMode = "solid";
    else if (rawTone) backgroundMode = "gradient";
    else backgroundMode = "solid";
  }

  return {
    id: slide.id?.trim() || `banner-${index + 1}`,
    kicker: slide.kicker?.trim() || "",
    title: slide.title?.trim() || "",
    text: slide.text?.trim() || "",
    href: slide.href?.trim() || "/products",
    backgroundMode,
    primaryColor,
    secondaryColor,
    textColor,
    image,
    ctaLabel: slide.ctaLabel?.trim() || "",
  };
}

export function normalizeHex(value?: string | null) {
  if (!value) return "";
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return `#${trimmed.toLowerCase()}`;
  return "";
}

/** CSS for the color/gradient layer of a banner (image handled separately). */
export function heroSlideSurfaceStyle(slide: StoreHeroSlide): CSSProperties {
  const primary = normalizeHex(slide.primaryColor) || "#18181b";
  const secondary = normalizeHex(slide.secondaryColor) || "#000000";
  const mode = slide.backgroundMode;

  if (mode === "gradient") {
    return { backgroundImage: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` };
  }
  if (mode === "spotlight") {
    return {
      backgroundColor: secondary,
      backgroundImage: `radial-gradient(circle at 18% 22%, ${primary} 0%, ${secondary} 58%, #000000 100%)`,
    };
  }
  // solid | image fallback
  return { backgroundColor: primary };
}

export function heroSlideUsesImage(slide: StoreHeroSlide) {
  return slide.backgroundMode === "image" && Boolean(slide.image?.trim());
}

export function heroSlideTextColor(slide: StoreHeroSlide) {
  return normalizeHex(slide.textColor) || "#ffffff";
}

export function normalizeStoreFeatured(
  featured?: Partial<StoreHomeContent["featured"]> | null,
): StoreHomeContent["featured"] {
  const defaults = cloneHomeDefaults().featured;
  const source = STORE_FEATURED_SOURCES.some((item) => item.value === featured?.source)
    ? (featured!.source as StoreFeaturedSource)
    : defaults.source;
  const rawLimit = Number(featured?.limit);
  const limit = STORE_FEATURED_LIMITS.includes(rawLimit as (typeof STORE_FEATURED_LIMITS)[number])
    ? rawLimit
    : defaults.limit;
  const productIds = Array.from(
    new Set(
      (featured?.productIds || [])
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  ).slice(0, 8);

  return {
    title: featured?.title?.trim() || defaults.title,
    subtitle: typeof featured?.subtitle === "string" ? featured.subtitle.trim() : defaults.subtitle,
    cta: {
      label: featured?.cta?.label?.trim() || defaults.cta.label,
      href: featured?.cta?.href?.trim() || defaults.cta.href,
    },
    backgroundColor: normalizeHex(featured?.backgroundColor) || defaults.backgroundColor,
    textColor: normalizeHex(featured?.textColor) || defaults.textColor,
    fontPair: getStoreFontPair(featured?.fontPair).id,
    limit,
    source,
    productIds,
  };
}

export function normalizeStoreValue(
  value?: Partial<StoreHomeContent["value"]> | null,
): StoreHomeContent["value"] {
  const defaults = cloneHomeDefaults().value;
  const points = (value?.points || [])
    .filter((point) => point && (point.title?.trim() || point.text?.trim()))
    .slice(0, 8)
    .map((point) => ({
      title: point.title?.trim() || "",
      text: point.text?.trim() || "",
    }));

  // If the payload omitted points entirely, keep defaults. An explicit empty list stays empty.
  const resolvedPoints =
    value?.points === undefined
      ? defaults.points.map((point) => ({ ...point }))
      : points;

  return {
    title: value?.title?.trim() || defaults.title,
    backgroundColor: normalizeHex(value?.backgroundColor) || defaults.backgroundColor,
    textColor: normalizeHex(value?.textColor) || defaults.textColor,
    fontPair: getStoreFontPair(value?.fontPair).id,
    points: resolvedPoints,
  };
}

function cloneHomeDefaults(): StoreHomeContent {
  const home = siteContent.home;
  return {
    hero: {
      eyebrow: home.hero.eyebrow,
      title: home.hero.title,
      subtitle: home.hero.subtitle,
      primaryCta: { ...home.hero.primaryCta },
      secondaryCta: { ...home.hero.secondaryCta },
      fontPair: "classic",
      align: "left",
      slides: home.hero.slides.map((slide, index) => normalizeHeroSlide({ ...slide }, index)),
    },
    featured: {
      title: home.featured.title,
      subtitle: home.featured.subtitle,
      cta: { ...home.featured.cta },
      backgroundColor: "#ffffff",
      textColor: "#09090b",
      fontPair: "classic",
      limit: 3,
      source: "newest",
      productIds: [],
    },
    value: {
      title: home.value.title,
      backgroundColor: "#09090b",
      textColor: "#ffffff",
      fontPair: "classic",
      points: home.value.points.map((point) => ({ ...point })),
    },
    collections: {
      title: home.collections.title,
      subtitle: home.collections.subtitle,
      empty: home.collections.empty,
      backgroundColor: "#ffffff",
      textColor: "#09090b",
      fontPair: "classic",
      limit: 6,
      source: "all",
      selectedNames: [],
      linkLabel: "Ver colección →",
    },
    finalCta: {
      title: home.finalCta.title,
      subtitle: home.finalCta.subtitle,
      urgency: "",
      backgroundColor: "#ffffff",
      textColor: "#09090b",
      fontPair: "classic",
      cta: { ...home.finalCta.cta },
      secondaryCta: { label: "Hablar por WhatsApp", href: "__whatsapp__" },
    },
  };
}

export function normalizeStoreCollections(
  collections?: Partial<StoreHomeContent["collections"]> | null,
): StoreHomeContent["collections"] {
  const defaults = cloneHomeDefaults().collections;
  const source = STORE_COLLECTION_SOURCES.some((item) => item.value === collections?.source)
    ? (collections!.source as StoreCollectionSource)
    : defaults.source;
  const rawLimit = Number(collections?.limit);
  const limit = STORE_COLLECTION_LIMITS.includes(rawLimit as (typeof STORE_COLLECTION_LIMITS)[number])
    ? rawLimit
    : defaults.limit;
  const selectedNames = Array.from(
    new Set(
      (collections?.selectedNames || [])
        .map((name) => (typeof name === "string" ? name.trim() : ""))
        .filter(Boolean),
    ),
  ).slice(0, 8);

  return {
    title: collections?.title?.trim() || defaults.title,
    subtitle: typeof collections?.subtitle === "string" ? collections.subtitle.trim() : defaults.subtitle,
    empty: collections?.empty?.trim() || defaults.empty,
    backgroundColor: normalizeHex(collections?.backgroundColor) || defaults.backgroundColor,
    textColor: normalizeHex(collections?.textColor) || defaults.textColor,
    fontPair: getStoreFontPair(collections?.fontPair).id,
    limit,
    source,
    selectedNames,
    linkLabel: collections?.linkLabel?.trim() || defaults.linkLabel,
  };
}

export function normalizeStoreFinalCta(
  finalCta?: Partial<StoreHomeContent["finalCta"]> | null,
): StoreHomeContent["finalCta"] {
  const defaults = cloneHomeDefaults().finalCta;
  return {
    title: finalCta?.title?.trim() || defaults.title,
    subtitle: typeof finalCta?.subtitle === "string" ? finalCta.subtitle.trim() : defaults.subtitle,
    urgency: typeof finalCta?.urgency === "string" ? finalCta.urgency.trim() : defaults.urgency,
    backgroundColor: normalizeHex(finalCta?.backgroundColor) || defaults.backgroundColor,
    textColor: normalizeHex(finalCta?.textColor) || defaults.textColor,
    fontPair: getStoreFontPair(finalCta?.fontPair).id,
    cta: {
      label: finalCta?.cta?.label?.trim() || defaults.cta.label,
      href: finalCta?.cta?.href?.trim() || defaults.cta.href,
    },
    secondaryCta: {
      label:
        finalCta?.secondaryCta === undefined
          ? defaults.secondaryCta.label
          : finalCta.secondaryCta.label?.trim() || "",
      href: finalCta?.secondaryCta?.href?.trim() || defaults.secondaryCta.href,
    },
  };
}

export function defaultStoreSeo(): StoreSeoContent {
  return {
    title: `${brand.name} | ${brand.tagline}`,
    titleTemplate: `%s | ${brand.name}`,
    description: brand.description,
    ogTitle: brand.name,
    ogDescription: brand.description,
    ogImage: "",
    keywords: "ropa, tienda online, ecommerce, moda",
  };
}

export function defaultStoreContact(): StoreContact {
  return {
    blurb: brand.tagline,
    whatsapp: brand.social.whatsapp,
    whatsappNote: "WhatsApp · respuesta rápida",
    email: brand.email,
    instagram: brand.social.instagram,
    tiktok: brand.social.tiktok,
    facebook: brand.social.facebook,
    locationLabel: brand.countryLabel,
    description: brand.description,
    bottomNote: siteContent.footer.bottomNote,
  };
}

export function normalizeStoreContact(contact?: Partial<StoreContact> | null): StoreContact {
  const defaults = defaultStoreContact();
  const pick = (value: string | undefined, fallback: string) =>
    typeof value === "string" ? value.trim() : fallback;
  return {
    blurb: pick(contact?.blurb, defaults.blurb),
    whatsapp: pick(contact?.whatsapp, defaults.whatsapp),
    whatsappNote: pick(contact?.whatsappNote, defaults.whatsappNote),
    email: pick(contact?.email, defaults.email),
    instagram: pick(contact?.instagram, defaults.instagram),
    tiktok: pick(contact?.tiktok, defaults.tiktok),
    facebook: pick(contact?.facebook, defaults.facebook),
    locationLabel: pick(contact?.locationLabel, defaults.locationLabel),
    description: pick(contact?.description, defaults.description),
    bottomNote: pick(contact?.bottomNote, defaults.bottomNote),
  };
}

/** Accepts a wa.me URL or a phone number and returns a usable WhatsApp link. */
export function buildWhatsAppUrl(raw?: string | null, message?: string) {
  const trimmed = raw?.trim() || "";
  if (!trimmed) return "";

  let base = trimmed;
  if (!/^https?:\/\//i.test(trimmed)) {
    const digits = trimmed.replace(/\D/g, "");
    if (!digits) return "";
    base = `https://wa.me/${digits}`;
  }

  if (!message?.trim()) return base;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}text=${encodeURIComponent(message.trim())}`;
}

export function defaultStoreTheme(): StoreTheme {
  return {
    ...STORE_THEME_PRESETS[0].theme,
    fontPair: "classic",
    footerFontPair: "classic",
    logoMode: "text",
    logoText: brand.name,
    logoImage: "",
    logoFontPair: "classic",
    logoScale: "md",
    contact: defaultStoreContact(),
  };
}

export function normalizeStoreTheme(theme?: Partial<StoreTheme> | null): StoreTheme {
  const defaults = defaultStoreTheme();
  const logoMode = theme?.logoMode === "image" ? "image" : "text";
  const legacyFont = getStoreFontPair(theme?.fontPair).id;
  return {
    navbarBackground: normalizeHex(theme?.navbarBackground) || defaults.navbarBackground,
    navbarText: normalizeHex(theme?.navbarText) || defaults.navbarText,
    footerBackground: normalizeHex(theme?.footerBackground) || defaults.footerBackground,
    footerText: normalizeHex(theme?.footerText) || defaults.footerText,
    fontPair: legacyFont,
    footerFontPair: getStoreFontPair(theme?.footerFontPair || theme?.fontPair).id,
    logoMode,
    logoText: theme?.logoText?.trim() || defaults.logoText,
    logoImage: theme?.logoImage?.trim() || "",
    logoFontPair: getStoreFontPair(theme?.logoFontPair || theme?.fontPair).id,
    logoScale: getStoreLogoScale(theme?.logoScale).value,
    contact: normalizeStoreContact(theme?.contact),
  };
}

export function storeThemeCssVars(theme: StoreTheme): Record<string, string> {
  const normalized = normalizeStoreTheme(theme);
  const navFont = getStoreFontPair(normalized.fontPair);
  const footerFont = getStoreFontPair(normalized.footerFontPair);
  const logoFont = getStoreFontPair(normalized.logoFontPair);
  const logoScale = getStoreLogoScale(normalized.logoScale);
  return {
    "--store-nav-bg": normalized.navbarBackground,
    "--store-nav-fg": normalized.navbarText,
    "--store-footer-bg": normalized.footerBackground,
    "--store-footer-fg": normalized.footerText,
    "--store-nav-display": `var(${navFont.displayVar})`,
    "--store-nav-sans": `var(${navFont.sansVar})`,
    "--store-footer-display": `var(${footerFont.displayVar})`,
    "--store-footer-sans": `var(${footerFont.sansVar})`,
    "--store-logo-font": `var(${logoFont.displayVar})`,
    "--store-logo-size": logoScale.cssSize,
    // Back-compat aliases used by older chrome styles
    "--store-chrome-display": `var(${navFont.displayVar})`,
    "--store-chrome-sans": `var(${navFont.sansVar})`,
  };
}

export function defaultStoreSettings(): StoreSettings {
  return {
    storeName: brand.name,
    shortName: brand.shortName,
    legalName: brand.legalName,
    tagline: brand.tagline,
    description: brand.description,
    domain: brand.domain,
    email: brand.email,
    supportEmail: brand.supportEmail,
    whatsapp: brand.social.whatsapp,
    whatsappNote: "WhatsApp · respuesta rápida",
    instagram: brand.social.instagram,
    tiktok: brand.social.tiktok,
    facebook: brand.social.facebook,
    locationLabel: brand.countryLabel,
    locale: brand.locale,
    timezone: "America/Lima",
    currency: brand.currency,
    currencySymbol: brand.currencySymbol,
    address: "",
    orderStatuses: DEFAULT_ORDER_STATUSES.map((item) => ({ ...item })),
  };
}

export function normalizeStoreSettings(settings?: Partial<StoreSettings> | null): StoreSettings {
  const defaults = defaultStoreSettings();
  const pick = (value: string | undefined, fallback: string) =>
    typeof value === "string" ? value.trim() : fallback;

  return {
    storeName: pick(settings?.storeName, defaults.storeName) || defaults.storeName,
    shortName: pick(settings?.shortName, defaults.shortName) || defaults.shortName,
    legalName: pick(settings?.legalName, defaults.legalName) || defaults.legalName,
    tagline: pick(settings?.tagline, defaults.tagline),
    description: pick(settings?.description, defaults.description),
    domain: pick(settings?.domain, defaults.domain) || defaults.domain,
    email: pick(settings?.email, defaults.email),
    supportEmail: pick(settings?.supportEmail, defaults.supportEmail),
    whatsapp: pick(settings?.whatsapp, defaults.whatsapp),
    whatsappNote: pick(settings?.whatsappNote, defaults.whatsappNote),
    instagram: pick(settings?.instagram, defaults.instagram),
    tiktok: pick(settings?.tiktok, defaults.tiktok),
    facebook: pick(settings?.facebook, defaults.facebook),
    locationLabel: pick(settings?.locationLabel, defaults.locationLabel),
    locale: pick(settings?.locale, defaults.locale) || defaults.locale,
    timezone: pick(settings?.timezone, defaults.timezone) || defaults.timezone,
    currency: (pick(settings?.currency, defaults.currency) || defaults.currency).toUpperCase(),
    currencySymbol: pick(settings?.currencySymbol, defaults.currencySymbol) || defaults.currencySymbol,
    address: pick(settings?.address, defaults.address),
    orderStatuses: normalizeOrderStatuses(settings?.orderStatuses ?? defaults.orderStatuses),
  };
}

/** Keep theme.contact in sync with Settings (settings is source of truth). */
export function contactFromSettings(settings: StoreSettings): StoreContact {
  return {
    blurb: settings.tagline,
    whatsapp: settings.whatsapp,
    whatsappNote: settings.whatsappNote,
    email: settings.email,
    instagram: settings.instagram,
    tiktok: settings.tiktok,
    facebook: settings.facebook,
    locationLabel: settings.locationLabel,
    description: settings.description,
    bottomNote: "",
  };
}

/** Persist theme + settings inside the home jsonb column (no DB migration needed). */
export function packHomeForStorage(cms: StoreCms) {
  return {
    ...cms.home,
    theme: cms.theme,
    settings: cms.settings,
  };
}

export function unpackHomeFromStorage(raw: unknown): {
  home: unknown;
  theme: unknown;
  settings: unknown;
} {
  if (!isObject(raw)) return { home: raw, theme: undefined, settings: undefined };
  const { theme, settings, ...home } = raw;
  return { home, theme, settings };
}

export function defaultStoreCms(): StoreCms {
  const settings = defaultStoreSettings();
  const theme = defaultStoreTheme();
  return {
    seo: defaultStoreSeo(),
    home: cloneHomeDefaults(),
    theme: {
      ...theme,
      logoText: settings.storeName,
      contact: contactFromSettings(settings),
    },
    settings,
    updatedAt: null,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeDeep<T>(base: T, patch: unknown): T {
  if (patch === undefined || patch === null) return base;
  if (Array.isArray(base)) {
    return (Array.isArray(patch) ? patch : base) as T;
  }
  if (!isObject(base)) {
    return (patch as T) ?? base;
  }
  if (!isObject(patch)) return base;

  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    const current = result[key];
    result[key] = isObject(current) && isObject(value) ? mergeDeep(current, value) : value;
  }
  return result as T;
}

export function mergeStoreCms(
  partial?: {
    seo?: unknown;
    home?: unknown;
    theme?: unknown;
    settings?: unknown;
    updatedAt?: string | null;
  } | null,
): StoreCms {
  const defaults = defaultStoreCms();
  if (!partial) return defaults;

  const unpacked = unpackHomeFromStorage(partial.home);
  const themeSource = partial.theme ?? unpacked.theme;
  const settingsSource = partial.settings ?? unpacked.settings;

  // Migrate legacy theme.contact into settings when settings blob is missing fields.
  const legacyContact = isObject(themeSource) && isObject(themeSource.contact) ? themeSource.contact : null;
  const settingsMerged = normalizeStoreSettings(
    mergeDeep(
      defaults.settings,
      mergeDeep(
        legacyContact
          ? {
              email: legacyContact.email,
              whatsapp: legacyContact.whatsapp,
              whatsappNote: legacyContact.whatsappNote,
              instagram: legacyContact.instagram,
              tiktok: legacyContact.tiktok,
              facebook: legacyContact.facebook,
              locationLabel: legacyContact.locationLabel,
              description: legacyContact.description,
              tagline: legacyContact.blurb,
            }
          : {},
        settingsSource,
      ),
    ) as StoreSettings,
  );

  const themeMerged = normalizeStoreTheme(mergeDeep(defaults.theme, themeSource) as StoreTheme);

  return {
    seo: mergeDeep(defaults.seo, partial.seo),
    home: mergeDeep(defaults.home, unpacked.home),
    settings: settingsMerged,
    theme: {
      ...themeMerged,
      contact: contactFromSettings(settingsMerged),
      logoText: themeMerged.logoText?.trim() || settingsMerged.storeName,
    },
    updatedAt: partial.updatedAt ?? null,
  };
}

export function sanitizeStoreCms(input: StoreCms): StoreCms {
  const merged = mergeStoreCms(input);
  merged.home.hero.slides = (merged.home.hero.slides || [])
    .filter((slide) => slide && (slide.title || slide.text || slide.id))
    .map((slide, index) => normalizeHeroSlide(slide, index));

  if (!merged.home.hero.slides.length) {
    merged.home.hero.slides = cloneHomeDefaults().hero.slides;
  }

  merged.home.hero.fontPair = getStoreFontPair(merged.home.hero.fontPair).id;
  merged.home.hero.align = normalizeHeroAlign(merged.home.hero.align);

  merged.home.featured = normalizeStoreFeatured(merged.home.featured);
  merged.home.value = normalizeStoreValue(merged.home.value);
  merged.home.collections = normalizeStoreCollections(merged.home.collections);
  merged.home.finalCta = normalizeStoreFinalCta(merged.home.finalCta);

  // Drop legacy "A medida" block if still present in saved CMS JSON.
  delete (merged.home as { personalization?: unknown }).personalization;

  merged.seo.title = merged.seo.title.trim() || defaultStoreSeo().title;
  merged.seo.description = merged.seo.description.trim() || defaultStoreSeo().description;
  merged.seo.ogTitle = merged.seo.ogTitle.trim() || merged.seo.title;
  merged.seo.ogDescription = merged.seo.ogDescription.trim() || merged.seo.description;
  merged.seo.titleTemplate = merged.seo.titleTemplate.trim() || defaultStoreSeo().titleTemplate;
  merged.seo.ogImage = merged.seo.ogImage.trim();
  merged.seo.keywords = merged.seo.keywords.trim();
  merged.settings = normalizeStoreSettings(merged.settings);
  merged.theme = normalizeStoreTheme({
    ...merged.theme,
    contact: contactFromSettings(merged.settings),
    logoText: merged.theme.logoText?.trim() || merged.settings.storeName,
  });

  return merged;
}
