"use client";

import { FormEvent, useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faCheck,
  faCircleExclamation,
  faEye,
  faFloppyDisk,
  faGem,
  faGlobe,
  faHouse,
  faImage,
  faLayerGroup,
  faLightbulb,
  faPalette,
  faChevronRight,
  faPlus,
  faRocket,
  faSearch,
  faShoppingBag,
  faStar,
  faTrash,
  faUpload,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { faFacebook, faInstagram, faTiktok, faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import AdminModuleSkeleton from "@/components/admin/AdminModuleSkeleton";
import { brand } from "@/config/brand";
import { useSaveStoreCms, useStoreCmsQuery, useSyncAdminFetching } from "@/lib/admin-query";
import {
  defaultStoreCms,
  sanitizeStoreCms,
  getStoreFontPair,
  heroSlideSurfaceStyle,
  heroSlideTextColor,
  heroSlideUsesImage,
  normalizeHeroAlign,
  STORE_COLLECTION_LIMITS,
  STORE_COLLECTION_SOURCES,
  STORE_FEATURED_LIMITS,
  STORE_FEATURED_SOURCES,
  STORE_FONT_PAIRS,
  STORE_HERO_ALIGN_OPTIONS,
  STORE_LOGO_SCALES,
  STORE_THEME_PRESETS,
  getStoreLogoScale,
  type StoreCms,
  type StoreCollectionSource,
  type StoreFeaturedSource,
  type StoreFontPairId,
  type StoreTheme,
} from "@/lib/store-cms";
import type { StorefrontProduct } from "@/lib/storefront-products";

type TabId = "seo" | "theme" | "hero" | "featured" | "value" | "collections" | "finalCta";

type Step = {
  id: TabId;
  number: string;
  label: string;
  tip: string;
  icon: IconDefinition;
};

const LINK_PRESETS = [
  { value: "/products", label: "Catálogo" },
  { value: "/contact", label: "Contacto" },
  { value: "/", label: "Inicio" },
  { value: "/about", label: "Nosotros" },
  { value: "__whatsapp__", label: "WhatsApp" },
  { value: "__custom__", label: "Otra página…" },
] as const;

const steps: Step[] = [
  {
    id: "seo",
    number: "01",
    label: "Google y redes",
    tip: "Escribe como le hablarías a un cliente.",
    icon: faGlobe,
  },
  {
    id: "theme",
    number: "02",
    label: "Barra y pie",
    tip: "Logo, colores, tipografía y contacto del pie (WhatsApp y redes).",
    icon: faPalette,
  },
  {
    id: "hero",
    number: "03",
    label: "Portada",
    tip: "Textos, alineación, tipografía y banners de la portada.",
    icon: faHouse,
  },
  {
    id: "featured",
    number: "04",
    label: "Productos nuevos",
    tip: "Estilo, cantidad y si son recientes, más vendidos o elegidos a mano.",
    icon: faStar,
  },
  {
    id: "value",
    number: "05",
    label: "Por qué elegirte",
    tip: "Habla de calidad, envío, atención y diseño.",
    icon: faGem,
  },
  {
    id: "collections",
    number: "06",
    label: "Colecciones",
    tip: "Estilo, cantidad y si son todas, con stock o elegidas a mano.",
    icon: faLayerGroup,
  },
  {
    id: "finalCta",
    number: "07",
    label: "Cierre",
    tip: "Estilo, urgencia y hasta dos botones (catálogo + WhatsApp).",
    icon: faRocket,
  },
];

const inputClass =
  "w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5";
const softCard = "rounded-[1.75rem] border border-zinc-200/80 bg-white shadow-[0_18px_50px_-28px_rgba(24,24,27,0.45)]";

function friendlyError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("session") || lower.includes("auth") || lower.includes("401")) {
    return "Tu sesión expiró. Vuelve a iniciar sesión e intenta otra vez.";
  }
  if (lower.includes("store_cms") || lower.includes("column") || lower.includes("schema") || lower.includes("pgrst")) {
    return "Aún falta activar esta función en la base de datos. Avisa a quien configuró el proyecto.";
  }
  if (lower.includes("fetch") || lower.includes("network") || lower.includes("failed")) {
    return "No hay conexión con el servidor. Revisa internet e intenta de nuevo.";
  }
  return "No se pudo guardar. Intenta otra vez o avisa a soporte.";
}

function FriendlyField({
  label,
  hint,
  children,
  counter,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  counter?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="flex items-end justify-between gap-3">
        <span className="text-sm font-bold text-zinc-900">{label}</span>
        {counter ? <span className="text-xs font-medium text-zinc-400">{counter}</span> : null}
      </span>
      {children}
      {hint ? <span className="block text-sm leading-6 text-zinc-500">{hint}</span> : null}
    </label>
  );
}

function CharBar({ value, max, goodMin }: { value: string; max: number; goodMin?: number }) {
  const length = value.trim().length;
  const ratio = Math.min(100, Math.round((length / max) * 100));
  const good = goodMin ? length >= goodMin && length <= max : length <= max;
  return (
    <div className="space-y-1.5">
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-full rounded-full transition-all ${good ? "bg-emerald-500" : "bg-amber-500"}`}
          style={{ width: `${ratio}%` }}
        />
      </div>
      <p className={`text-xs ${good ? "text-zinc-500" : "font-semibold text-amber-700"}`}>
        {length}/{max} caracteres{goodMin && length < goodMin ? ` · ideal desde ${goodMin}` : ""}
      </p>
    </div>
  );
}

function resolveLinkPreset(href: string) {
  const match = LINK_PRESETS.find((item) => item.value !== "__custom__" && item.value === href);
  return match ? match.value : "__custom__";
}

function ButtonLinkEditor({
  title,
  value,
  onChange,
}: {
  title: string;
  value: { label: string; href: string };
  onChange: (next: { label: string; href: string }) => void;
}) {
  const preset = resolveLinkPreset(value.href);
  const isCustom = preset === "__custom__";

  return (
    <div className="space-y-3 rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50/80 p-4">
      <p className="text-sm font-bold text-zinc-900">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <FriendlyField label="Texto del botón" hint="Ej: Ver catálogo">
          <input className={inputClass} value={value.label} onChange={(e) => onChange({ ...value, label: e.target.value })} />
        </FriendlyField>
        <FriendlyField label="¿A dónde lleva?">
          <select
            className={inputClass}
            value={preset}
            onChange={(e) => {
              const next = e.target.value;
              if (next === "__custom__") {
                onChange({ ...value, href: value.href.startsWith("/") && !LINK_PRESETS.some((p) => p.value === value.href) ? value.href : "" });
                return;
              }
              onChange({ ...value, href: next });
            }}
          >
            {LINK_PRESETS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </FriendlyField>
      </div>
      {isCustom ? (
        <FriendlyField label="Escribe la página" hint="Si no estás seguro, elige Catálogo arriba.">
          <input
            className={inputClass}
            value={value.href}
            placeholder="/mi-pagina"
            onChange={(e) => onChange({ ...value, href: e.target.value })}
          />
        </FriendlyField>
      ) : null}
    </div>
  );
}

function SeoPreview({ cms }: { cms: StoreCms }) {
  const domain = (cms.theme.contact?.email?.split("@")[1] || brand.domain || "tudominio.com").replace(/^www\./, "");
  const siteUrl = `https://www.${domain}`;
  const googleTitle = cms.seo.title?.trim() || "Título de tu tienda";
  const googleDescription = cms.seo.description?.trim() || "La descripción que verán en Google.";
  const ogTitle = cms.seo.ogTitle?.trim() || googleTitle;
  const ogDescription = cms.seo.ogDescription?.trim() || googleDescription;
  const ogImage = cms.seo.ogImage?.trim() || "";
  const keywords = (cms.seo.keywords || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
  const titleLen = googleTitle.length;
  const descLen = googleDescription.length;
  const titleOk = titleLen >= 30 && titleLen <= 60;
  const descOk = descLen >= 70 && descLen <= 158;
  const pageTitleExample = (cms.seo.titleTemplate || `%s | ${brand.name}`)
    .replace("%s", "Producto ejemplo")
    .trim();

  return (
    <div className="space-y-3">
      {/* Google SERP */}
      <div className="overflow-hidden rounded-[1.25rem] border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-300" />
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            <span className="ml-1 text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">Google</span>
          </div>
          <span className="text-[10px] font-medium text-zinc-400">Resultado de búsqueda</span>
        </div>
        <div className="space-y-3 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-600">
              {(cms.theme.logoText || brand.shortName || "D").trim().slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-800">{cms.theme.logoText || brand.name}</p>
              <p className="truncate text-xs text-zinc-500">
                {siteUrl} <span className="text-zinc-300">›</span> inicio
              </p>
            </div>
          </div>
          <div>
            <p className="line-clamp-2 text-xl font-medium leading-snug text-[#1a0dab]">{googleTitle}</p>
            <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-zinc-600">{googleDescription}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.12em]">
            <span
              className={[
                "rounded-full px-2.5 py-1",
                titleOk ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
              ].join(" ")}
            >
              Título {titleLen}/60
            </span>
            <span
              className={[
                "rounded-full px-2.5 py-1",
                descOk ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
              ].join(" ")}
            >
              Descripción {descLen}/158
            </span>
          </div>
        </div>
      </div>

      {/* Social / Open Graph card */}
      <div className="overflow-hidden rounded-[1.25rem] border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50 px-4 py-2.5">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">Redes sociales</span>
          <span className="text-[10px] font-medium text-zinc-400">Facebook · LinkedIn · iMessage</span>
        </div>
        <div className="overflow-hidden bg-zinc-50">
          {ogImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ogImage} alt="" className="aspect-[1.91/1] w-full object-cover" />
          ) : (
            <div className="flex aspect-[1.91/1] w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-200 via-zinc-100 to-stone-200 px-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Sin imagen</p>
              <p className="max-w-[14rem] text-xs text-zinc-500">
                Pega un link de imagen para ver cómo se comparte el enlace.
              </p>
            </div>
          )}
          <div className="border-t border-zinc-200 bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">{domain}</p>
            <p className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-zinc-950">{ogTitle}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{ogDescription}</p>
          </div>
        </div>
      </div>

      {/* Keywords + template */}
      <div className="overflow-hidden rounded-[1.25rem] border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-2.5">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">Detalle SEO</span>
        </div>
        <div className="space-y-4 px-4 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">Palabras clave</p>
            {keywords.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-700"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-zinc-400">Todavía no agregaste palabras clave.</p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">Plantilla de título</p>
            <p className="mt-1.5 rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              {pageTitleExample}
            </p>
            <p className="mt-1 text-[11px] text-zinc-400">Así se vería el título de una página interna.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorPickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <FriendlyField label={label}>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-14 cursor-pointer rounded-xl border border-zinc-200 bg-white p-1"
          aria-label={label}
        />
        <input
          className={inputClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
        />
      </div>
    </FriendlyField>
  );
}

function ThemeLogoMark({ theme }: { theme: StoreTheme }) {
  const label = theme.logoText?.trim() || "Tu marca";
  const scale = getStoreLogoScale(theme.logoScale);
  const logoFont = getStoreFontPair(theme.logoFontPair);
  if (theme.logoMode === "image" && theme.logoImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={theme.logoImage}
        alt={label}
        className={`${scale.imageClass} object-contain object-left`}
      />
    );
  }
  return (
    <span
      className={`font-bold tracking-tight leading-none ${scale.textClass}`}
      style={{ fontFamily: `var(${logoFont.displayVar})` }}
    >
      {label}
    </span>
  );
}

function FontPairPicker({
  value,
  onChange,
  compact = false,
}: {
  value: StoreFontPairId;
  onChange: (next: StoreFontPairId) => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "grid grid-cols-2 gap-2 sm:grid-cols-3" : "grid gap-2 sm:grid-cols-2 lg:grid-cols-3"}>
      {STORE_FONT_PAIRS.map((pair) => {
        const selected = value === pair.id;
        return (
          <button
            key={pair.id}
            type="button"
            onClick={() => onChange(pair.id)}
            className={[
              "rounded-2xl border-2 px-3 py-2.5 text-left transition",
              selected ? "border-zinc-950 bg-white" : "border-transparent bg-white ring-1 ring-zinc-200",
            ].join(" ")}
            style={
              {
                "--store-preview-display": `var(${pair.displayVar})`,
                "--store-preview-sans": `var(${pair.sansVar})`,
              } as CSSProperties
            }
          >
            <p
              className="text-lg font-semibold leading-none text-zinc-950"
              style={{ fontFamily: "var(--store-preview-display)" }}
            >
              Aa
            </p>
            <p className="mt-1.5 text-xs font-bold text-zinc-900">{pair.label}</p>
            <p className="text-[11px] text-zinc-500">{pair.hint}</p>
          </button>
        );
      })}
    </div>
  );
}

function ThemePreview({ theme }: { theme: StoreTheme }) {
  const navFont = getStoreFontPair(theme.fontPair);
  const footerFont = getStoreFontPair(theme.footerFontPair);
  const contact = theme.contact;
  const socials = [
    { href: contact.instagram, label: "Instagram", icon: faInstagram },
    { href: contact.tiktok, label: "TikTok", icon: faTiktok },
    { href: contact.facebook, label: "Facebook", icon: faFacebook },
  ].filter((item) => Boolean(item.href?.trim()));
  const hasWhatsapp = Boolean(contact.whatsapp?.trim());
  const previewVars = {
    "--store-nav-sans": `var(${navFont.sansVar})`,
    "--store-footer-sans": `var(${footerFont.sansVar})`,
    "--store-footer-display": `var(${footerFont.displayVar})`,
  } as CSSProperties;

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-zinc-200 bg-white shadow-sm" style={previewVars}>
      {/* Navbar */}
      <div
        className="border-b px-3 py-3 sm:px-4"
        style={{
          backgroundColor: theme.navbarBackground,
          color: theme.navbarText,
          borderColor: "color-mix(in srgb, currentColor 12%, transparent)",
          fontFamily: "var(--store-nav-sans)",
        }}
      >
        <div className="flex items-center gap-3">
          <ThemeLogoMark theme={theme} />
          <div className="ml-auto hidden items-center gap-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] opacity-75 sm:flex">
            {["Inicio", "Nosotros", "Productos", "FAQ", "Contacto"].map((label) => (
              <span key={label} className="rounded-full px-2 py-1.5">
                {label}
              </span>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1 sm:ml-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-full opacity-70" title="Buscar">
              <FontAwesomeIcon icon={faSearch} className="h-3.5 w-3.5" />
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full opacity-70" title="Cuenta">
              <FontAwesomeIcon icon={faUser} className="h-3.5 w-3.5" />
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full opacity-70" title="Carrito">
              <FontAwesomeIcon icon={faShoppingBag} className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] opacity-75 sm:hidden">
          {["Inicio", "Nosotros", "Productos", "FAQ", "Contacto"].map((label) => (
            <span key={label} className="rounded-full px-2 py-1">
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Mid page stub */}
      <div className="bg-stone-100 px-4 py-5 font-sans sm:px-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Página de la tienda</p>
        <p className="mt-1 text-sm text-zinc-600">Así se ven la barra y el pie con tu configuración.</p>
      </div>

      {/* Footer */}
      <div
        className="border-t px-3 py-5 sm:px-4 sm:py-6"
        style={{
          backgroundColor: theme.footerBackground,
          color: theme.footerText,
          borderColor: "color-mix(in srgb, currentColor 12%, transparent)",
          fontFamily: "var(--store-footer-sans)",
        }}
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          <div className="min-w-0">
            <ThemeLogoMark theme={theme} />
            {contact.blurb ? (
              <p className="mt-2 text-[11px] leading-5 opacity-60">{contact.blurb}</p>
            ) : null}
            {socials.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {socials.map((social) => (
                  <span
                    key={social.label}
                    title={social.label}
                    className="flex h-8 w-8 items-center justify-center rounded-full border text-[11px] opacity-70"
                    style={{ borderColor: "color-mix(in srgb, currentColor 28%, transparent)" }}
                  >
                    <FontAwesomeIcon icon={social.icon} />
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[10px] opacity-40">Sin redes configuradas</p>
            )}
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] opacity-45">Tienda</p>
            <ul className="mt-2 space-y-1.5 text-[11px] opacity-70">
              <li>Catálogo</li>
              <li>Carrito</li>
              <li>Mi cuenta</li>
              <li>Contacto</li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] opacity-45">Ayuda</p>
            <ul className="mt-2 space-y-1.5 text-[11px] opacity-70">
              <li>Nosotros</li>
              <li>Preguntas frecuentes</li>
              <li>Contacto</li>
              <li>Términos</li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] opacity-45">Hablemos</p>
            <ul className="mt-2 space-y-2.5 text-[11px]">
              {hasWhatsapp ? (
                <li>
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <FontAwesomeIcon icon={faWhatsapp} className="text-[12px]" />
                    WhatsApp
                  </span>
                  {contact.whatsappNote ? (
                    <p className="mt-0.5 opacity-45">{contact.whatsappNote}</p>
                  ) : null}
                  <p className="mt-0.5 break-all opacity-55">{contact.whatsapp}</p>
                </li>
              ) : (
                <li className="opacity-40">Sin WhatsApp</li>
              )}
              {contact.email ? (
                <li className="break-all opacity-70">{contact.email}</li>
              ) : null}
              {contact.locationLabel || contact.description ? (
                <li>
                  {contact.locationLabel ? <p className="opacity-70">{contact.locationLabel}</p> : null}
                  {contact.description ? (
                    <p className="mt-0.5 opacity-45">{contact.description}</p>
                  ) : null}
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div
          className="mt-5 border-t pt-4 text-center"
          style={{ borderColor: "color-mix(in srgb, currentColor 12%, transparent)" }}
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.28em] opacity-40">Powered by</p>
          <p className="mt-1 text-[11px] font-semibold tracking-tight opacity-70">DGM Cloud</p>
          <p className="mt-1 text-[10px] opacity-40">Producto de DGM Cloud · Crea tu tienda online</p>
        </div>
      </div>
    </div>
  );
}

function CollectionsPreview({ collections }: { collections: StoreCms["home"]["collections"] }) {
  const font = getStoreFontPair(collections.fontPair);
  const backgroundColor = collections.backgroundColor || "#ffffff";
  const textColor = collections.textColor || "#09090b";
  const count = Math.max(1, Math.min(8, collections.limit || 6));
  const sourceLabel =
    STORE_COLLECTION_SOURCES.find((item) => item.value === collections.source)?.label || "Todas";
  const linkLabel = collections.linkLabel?.trim() || "Ver colección →";
  const gridClass =
    count <= 1
      ? "sm:grid-cols-1"
      : count === 2
        ? "sm:grid-cols-2"
        : count === 3
          ? "sm:grid-cols-2 md:grid-cols-3"
          : count === 4
            ? "sm:grid-cols-2 md:grid-cols-4"
            : "sm:grid-cols-2 md:grid-cols-3";

  return (
    <div
      className="overflow-hidden rounded-[1.25rem] border px-5 py-5 sm:px-6 sm:py-6"
      style={
        {
          backgroundColor,
          color: textColor,
          borderColor: "color-mix(in srgb, currentColor 12%, transparent)",
          fontFamily: `var(${font.sansVar})`,
          "--store-collections-display": `var(${font.displayVar})`,
        } as CSSProperties
      }
    >
      <p
        className="text-xl font-semibold leading-snug sm:text-2xl"
        style={{ fontFamily: "var(--store-collections-display)" }}
      >
        {collections.title || "Título"}
      </p>
      {collections.subtitle ? (
        <p
          className="mt-2 max-w-md text-sm"
          style={{ color: "color-mix(in srgb, currentColor 58%, transparent)" }}
        >
          {collections.subtitle}
        </p>
      ) : null}
      <p
        className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em]"
        style={{ color: "color-mix(in srgb, currentColor 45%, transparent)" }}
      >
        {sourceLabel} · {count} tarjetas
        {collections.source === "manual" && collections.selectedNames?.length
          ? ` · ${collections.selectedNames.length} elegidas`
          : ""}
      </p>
      <div className={`mt-4 grid gap-3 ${gridClass}`}>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index}>
            <div
              className="aspect-[4/5] rounded-lg"
              style={{ backgroundColor: "color-mix(in srgb, currentColor 8%, transparent)" }}
            />
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em]">
              Colección {index + 1}
            </p>
            <p className="mt-1 text-sm font-medium">0 productos</p>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em]">{linkLabel}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CollectionNamePicker({
  selectedNames,
  limit,
  onChange,
}: {
  selectedNames: string[];
  limit: number;
  onChange: (names: string[]) => void;
}) {
  const [names, setNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const response = await fetch("/api/products");
        const data = (await response.json()) as {
          facets?: { collections?: string[] };
          error?: string;
        };
        if (!response.ok) throw new Error(data.error || "No se pudieron cargar colecciones.");
        if (!cancelled) {
          setNames(data.facets?.collections ?? []);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setNames([]);
          setError(loadError instanceof Error ? loadError.message : "Error al cargar.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return names;
    return names.filter((name) => name.toLowerCase().includes(q));
  }, [names, query]);

  function toggle(name: string) {
    if (selectedNames.includes(name)) {
      onChange(selectedNames.filter((item) => item !== name));
      return;
    }
    if (selectedNames.length >= limit) return;
    onChange([...selectedNames, name]);
  }

  function move(name: string, direction: -1 | 1) {
    const index = selectedNames.indexOf(name);
    if (index < 0) return;
    const next = index + direction;
    if (next < 0 || next >= selectedNames.length) return;
    const copy = [...selectedNames];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    onChange(copy);
  }

  return (
    <div className="space-y-3 rounded-[1.5rem] border border-zinc-200 bg-zinc-50/80 p-4">
      <div>
        <p className="text-sm font-bold text-zinc-900">Colecciones elegidas</p>
        <p className="text-xs text-zinc-500">
          {selectedNames.length}/{limit} seleccionadas. El orden de la lista es el de la tienda.
        </p>
      </div>

      {selectedNames.length ? (
        <ul className="space-y-2">
          {selectedNames.map((name, index) => (
            <li
              key={name}
              className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-900">{name}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(name, -1)}
                  className="rounded-lg px-2 py-1 text-xs font-bold text-zinc-600 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={index === selectedNames.length - 1}
                  onClick={() => move(name, 1)}
                  className="rounded-lg px-2 py-1 text-xs font-bold text-zinc-600 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => toggle(name)}
                  className="rounded-lg px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50"
                >
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white px-3 py-4 text-center text-sm text-zinc-500">
          Todavía no elegiste colecciones.
        </p>
      )}

      <FriendlyField label="Buscar colección">
        <input
          className={inputClass}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nombre de colección"
        />
      </FriendlyField>

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando colecciones...</p>
      ) : error ? (
        <p className="text-sm text-rose-700">{error}</p>
      ) : (
        <div className="max-h-56 space-y-1 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-2">
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-sm text-zinc-500">Sin resultados.</p>
          ) : (
            filtered.map((name) => {
              const selected = selectedNames.includes(name);
              const disabled = !selected && selectedNames.length >= limit;
              return (
                <button
                  key={name}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggle(name)}
                  className={[
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition",
                    selected ? "bg-zinc-950 text-white" : "hover:bg-zinc-50 disabled:opacity-40",
                  ].join(" ")}
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</span>
                  <span className="text-xs font-bold">{selected ? "✓" : "+"}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function FeaturedPreview({ featured }: { featured: StoreCms["home"]["featured"] }) {
  const font = getStoreFontPair(featured.fontPair);
  const backgroundColor = featured.backgroundColor || "#ffffff";
  const textColor = featured.textColor || "#09090b";
  const count = Math.max(1, Math.min(8, featured.limit || 3));
  const sourceLabel =
    STORE_FEATURED_SOURCES.find((item) => item.value === featured.source)?.label || "Más recientes";
  const gridClass =
    count <= 1
      ? "sm:grid-cols-1"
      : count === 2
        ? "sm:grid-cols-2"
        : count === 3
          ? "sm:grid-cols-3"
          : count === 4
            ? "sm:grid-cols-2 lg:grid-cols-4"
            : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div
      className="overflow-hidden rounded-[1.25rem] border px-5 py-5 sm:px-6 sm:py-6"
      style={
        {
          backgroundColor,
          color: textColor,
          borderColor: "color-mix(in srgb, currentColor 12%, transparent)",
          fontFamily: `var(${font.sansVar})`,
          "--store-featured-display": `var(${font.displayVar})`,
        } as CSSProperties
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p
            className="text-xl font-semibold leading-snug sm:text-2xl"
            style={{ fontFamily: "var(--store-featured-display)" }}
          >
            {featured.title || "Título"}
          </p>
          {featured.subtitle ? (
            <p
              className="mt-2 text-sm"
              style={{ color: "color-mix(in srgb, currentColor 58%, transparent)" }}
            >
              {featured.subtitle}
            </p>
          ) : null}
        </div>
        {featured.cta?.label ? (
          <p className="text-sm font-semibold">{featured.cta.label} →</p>
        ) : null}
      </div>
      <p
        className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em]"
        style={{ color: "color-mix(in srgb, currentColor 45%, transparent)" }}
      >
        {sourceLabel} · {count} productos
        {featured.source === "manual" && featured.productIds?.length
          ? ` · ${featured.productIds.length} elegidos`
          : ""}
      </p>
      <div className={`mt-4 grid gap-3 ${gridClass}`}>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index}>
            <div
              className="aspect-[4/5] rounded-lg"
              style={{ backgroundColor: "color-mix(in srgb, currentColor 8%, transparent)" }}
            />
            <p className="mt-2 text-xs font-semibold">Producto {index + 1}</p>
            <p
              className="mt-0.5 text-[11px]"
              style={{ color: "color-mix(in srgb, currentColor 50%, transparent)" }}
            >
              S/ 00.00
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeaturedProductPicker({
  selectedIds,
  limit,
  onChange,
}: {
  selectedIds: number[];
  limit: number;
  onChange: (ids: number[]) => void;
}) {
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const response = await fetch("/api/products?limit=100");
        const data = (await response.json()) as { products?: StorefrontProduct[]; error?: string };
        if (!response.ok) throw new Error(data.error || "No se pudieron cargar productos.");
        if (!cancelled) {
          setProducts(data.products ?? []);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setProducts([]);
          setError(loadError instanceof Error ? loadError.message : "Error al cargar.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) =>
      [product.name, product.parentSku, product.collection, product.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [products, query]);

  function toggle(id: number) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
      return;
    }
    if (selectedIds.length >= limit) return;
    onChange([...selectedIds, id]);
  }

  function move(id: number, direction: -1 | 1) {
    const index = selectedIds.indexOf(id);
    if (index < 0) return;
    const next = index + direction;
    if (next < 0 || next >= selectedIds.length) return;
    const copy = [...selectedIds];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    onChange(copy);
  }

  const selectedProducts = selectedIds
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is StorefrontProduct => Boolean(product));

  return (
    <div className="space-y-3 rounded-[1.5rem] border border-zinc-200 bg-zinc-50/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-zinc-900">Productos elegidos</p>
          <p className="text-xs text-zinc-500">
            {selectedIds.length}/{limit} seleccionados. El orden de la lista es el de la tienda.
          </p>
        </div>
      </div>

      {selectedProducts.length ? (
        <ul className="space-y-2">
          {selectedProducts.map((product, index) => (
            <li
              key={product.id}
              className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.images[0]}
                alt=""
                className="h-10 w-10 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-900">{product.name}</p>
                <p className="truncate text-[11px] text-zinc-500">{product.parentSku}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(product.id, -1)}
                  className="rounded-lg px-2 py-1 text-xs font-bold text-zinc-600 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={index === selectedProducts.length - 1}
                  onClick={() => move(product.id, 1)}
                  className="rounded-lg px-2 py-1 text-xs font-bold text-zinc-600 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => toggle(product.id)}
                  className="rounded-lg px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50"
                >
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white px-3 py-4 text-center text-sm text-zinc-500">
          Todavía no elegiste productos.
        </p>
      )}

      <FriendlyField label="Buscar en inventario">
        <input
          className={inputClass}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nombre, SKU o colección"
        />
      </FriendlyField>

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando productos...</p>
      ) : error ? (
        <p className="text-sm text-rose-700">{error}</p>
      ) : (
        <div className="max-h-56 space-y-1 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-2">
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-sm text-zinc-500">Sin resultados.</p>
          ) : (
            filtered.map((product) => {
              const selected = selectedIds.includes(product.id);
              const disabled = !selected && selectedIds.length >= limit;
              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggle(product.id)}
                  className={[
                    "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition",
                    selected ? "bg-zinc-950 text-white" : "hover:bg-zinc-50 disabled:opacity-40",
                  ].join(" ")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.images[0]}
                    alt=""
                    className="h-9 w-9 rounded-lg object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{product.name}</span>
                    <span className={`block truncate text-[11px] ${selected ? "text-white/70" : "text-zinc-500"}`}>
                      {product.parentSku}
                    </span>
                  </span>
                  <span className="text-xs font-bold">{selected ? "✓" : "+"}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function ValuePreview({ value }: { value: StoreCms["home"]["value"] }) {
  const font = getStoreFontPair(value.fontPair);
  const backgroundColor = value.backgroundColor || "#09090b";
  const textColor = value.textColor || "#ffffff";
  const points = value.points || [];
  const gridClass =
    points.length <= 1
      ? "sm:grid-cols-1"
      : points.length === 2
        ? "sm:grid-cols-2"
        : points.length === 3
          ? "sm:grid-cols-2 lg:grid-cols-3"
          : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div
      className="overflow-hidden rounded-[1.25rem] px-5 py-5 sm:px-6 sm:py-6"
      style={
        {
          backgroundColor,
          color: textColor,
          fontFamily: `var(${font.sansVar})`,
          "--store-value-display": `var(${font.displayVar})`,
        } as CSSProperties
      }
    >
      <p
        className="text-xl font-semibold leading-snug sm:text-2xl"
        style={{ fontFamily: "var(--store-value-display)" }}
      >
        {value.title || "Título"}
      </p>
      {points.length ? (
        <div
          className={`mt-5 grid gap-3 border-t pt-4 ${gridClass}`}
          style={{ borderColor: "color-mix(in srgb, currentColor 15%, transparent)" }}
        >
          {points.map((point, index) => (
            <div
              key={index}
              className="rounded-xl border px-3 py-3"
              style={{
                borderColor: "color-mix(in srgb, currentColor 12%, transparent)",
                backgroundColor: "color-mix(in srgb, currentColor 6%, transparent)",
              }}
            >
              <p className="text-sm font-semibold">{point.title || `Razón ${index + 1}`}</p>
              <p
                className="mt-1 text-xs leading-5"
                style={{ color: "color-mix(in srgb, currentColor 65%, transparent)" }}
              >
                {point.text || "Texto"}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p
          className="mt-4 text-sm"
          style={{ color: "color-mix(in srgb, currentColor 55%, transparent)" }}
        >
          Sin razones todavía
        </p>
      )}
    </div>
  );
}

function HeroPreview({ cms, slideIndex = 0 }: { cms: StoreCms; slideIndex?: number }) {
  const slide = cms.home.hero.slides[slideIndex] ?? cms.home.hero.slides[0];
  const primary = slide?.ctaLabel?.trim() || cms.home.hero.primaryCta.label || "Botón principal";
  const secondary = cms.home.hero.secondaryCta.label || "Botón secundario";
  const align = normalizeHeroAlign(cms.home.hero.align);
  const fontPair = getStoreFontPair(cms.home.hero.fontPair);
  const contentAlign =
    align === "center" ? "items-center text-center" : align === "right" ? "items-end text-right" : "items-start text-left";
  const rowAlign = align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start";
  const blockAlign = align === "center" ? "mx-auto" : align === "right" ? "ml-auto" : "";
  const surfaceStyle = slide ? heroSlideSurfaceStyle(slide) : { backgroundColor: "#18181b" };
  const showImage = slide ? heroSlideUsesImage(slide) : false;
  const textColor = slide ? heroSlideTextColor(slide) : "#ffffff";

  return (
    <div
      className="relative min-h-[170px] overflow-hidden rounded-[1.25rem] px-5 py-5 sm:min-h-[190px] sm:px-8 sm:py-6"
      style={
        {
          ...(showImage ? undefined : surfaceStyle),
          "--store-hero-display": `var(${fontPair.displayVar})`,
          "--store-hero-sans": `var(${fontPair.sansVar})`,
          fontFamily: "var(--store-hero-sans)",
          color: textColor,
        } as CSSProperties
      }
    >
      {showImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slide?.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/45" />
        </>
      ) : null}
      <div className={`relative flex flex-col gap-3 ${contentAlign}`}>
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] opacity-55">{slide?.kicker || "Etiqueta"}</p>
        <p
          className={`max-w-xl text-2xl font-semibold leading-tight sm:text-3xl ${blockAlign}`}
          style={{ fontFamily: "var(--store-hero-display)" }}
        >
          <span className="opacity-40">{cms.home.hero.title || "Tu marca"}</span>
          <span className="mt-1 block">{slide?.title || "Título"}</span>
        </p>
        <p className={`max-w-xl text-sm leading-6 opacity-70 ${blockAlign}`}>{slide?.text || "Mensaje corto"}</p>
        <div className={`flex flex-wrap gap-2 ${rowAlign}`}>
          <span
            className="inline-flex w-fit rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-wide"
            style={{ backgroundColor: textColor, color: textColor === "#ffffff" || textColor === "#fafaf9" || textColor === "#e7e5e4" ? "#18181b" : "#ffffff" }}
          >
            {primary}
          </span>
          <span
            className="inline-flex w-fit rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-wide"
            style={{ borderColor: "color-mix(in srgb, currentColor 40%, transparent)" }}
          >
            {secondary}
          </span>
        </div>
      </div>
    </div>
  );
}

function TextPreview({ title, subtitle, cta }: { title: string; subtitle: string; cta?: string }) {
  return (
    <div className="grid gap-4 rounded-[1.25rem] border border-zinc-200 bg-white px-5 py-5 sm:grid-cols-[1.2fr_1fr_auto] sm:items-center">
      <p className="font-serif text-2xl font-semibold text-zinc-950">{title || "Título"}</p>
      <p className="text-sm leading-6 text-zinc-600">{subtitle || "Subtítulo"}</p>
      {cta ? (
        <span className="inline-flex w-fit rounded-full bg-zinc-950 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
          {cta} →
        </span>
      ) : (
        <span />
      )}
    </div>
  );
}

function FinalCtaPreview({ finalCta }: { finalCta: StoreCms["home"]["finalCta"] }) {
  const font = getStoreFontPair(finalCta.fontPair);
  const backgroundColor = finalCta.backgroundColor || "#ffffff";
  const textColor = finalCta.textColor || "#09090b";
  const secondaryLabel = finalCta.secondaryCta?.label?.trim() || "";

  return (
    <div
      className="overflow-hidden rounded-[1.25rem] border px-5 py-8 text-center sm:px-8 sm:py-10"
      style={
        {
          backgroundColor,
          color: textColor,
          borderColor: "color-mix(in srgb, currentColor 12%, transparent)",
          fontFamily: `var(${font.sansVar})`,
          "--store-final-display": `var(${font.displayVar})`,
        } as CSSProperties
      }
    >
      <p
        className="text-2xl font-semibold leading-snug tracking-tight sm:text-3xl"
        style={{ fontFamily: "var(--store-final-display)" }}
      >
        {finalCta.title || "Título final"}
      </p>
      {finalCta.subtitle ? (
        <p
          className="mx-auto mt-3 max-w-md text-sm leading-6"
          style={{ color: "color-mix(in srgb, currentColor 58%, transparent)" }}
        >
          {finalCta.subtitle}
        </p>
      ) : null}
      {finalCta.urgency ? (
        <p className="mt-2 text-xs font-semibold tracking-wide">{finalCta.urgency}</p>
      ) : null}
      <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
        {finalCta.cta?.label ? (
          <span
            className="inline-flex px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em]"
            style={{ backgroundColor: textColor, color: backgroundColor }}
          >
            {finalCta.cta.label} →
          </span>
        ) : null}
        {secondaryLabel ? (
          <span
            className="inline-flex border px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em]"
            style={{ borderColor: "color-mix(in srgb, currentColor 35%, transparent)" }}
          >
            {secondaryLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ProgressMeter({ cms }: { cms: StoreCms }) {
  const checks = [
    Boolean(cms.seo?.title && cms.seo?.description),
    (cms.home?.hero?.slides ?? []).some((s) => s.title && s.text),
    Boolean(cms.home?.featured?.title),
    (cms.home?.value?.points ?? []).every((p) => p.title && p.text),
    Boolean(cms.home?.finalCta?.title && cms.home?.finalCta?.cta?.label),
  ];
  const done = checks.filter(Boolean).length;
  const total = checks.length;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="flex min-w-[8.5rem] items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="shrink-0 text-xs font-bold text-zinc-600">
        {done}/{total}
      </p>
    </div>
  );
}

export default function StoreCmsStudio() {
  const storeQuery = useStoreCmsQuery();
  const saveCms = useSaveStoreCms();
  useSyncAdminFetching(storeQuery.isFetching || saveCms.isPending);

  const [cms, setCms] = useState<StoreCms>(defaultStoreCms());
  const [tab, setTab] = useState<TabId>("seo");
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const loading = storeQuery.isLoading && !hydrated;
  const saving = saveCms.isPending;

  const stepIndex = steps.findIndex((step) => step.id === tab);
  const active = steps[stepIndex] ?? steps[0];
  const prev = steps[stepIndex - 1];
  const next = steps[stepIndex + 1];

  useEffect(() => {
    if (!storeQuery.data || dirty) return;
    setCms(sanitizeStoreCms(storeQuery.data));
    setHydrated(true);
  }, [storeQuery.data, dirty]);

  useEffect(() => {
    if (storeQuery.error) {
      setError(friendlyError(storeQuery.error.message));
    }
  }, [storeQuery.error]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function patchCms(updater: (previous: StoreCms) => StoreCms) {
    setCms((previous) => updater(previous));
    setDirty(true);
    setSavedAt(null);
  }

  async function uploadLogo(file: File) {
    setUploadingLogo(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("image", file);
      const response = await fetch("/api/admin/inventory/upload-image", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No se pudo subir el logo.");
      patchCms((previous) => ({
        ...previous,
        theme: {
          ...previous.theme,
          logoMode: "image",
          logoImage: payload.url,
        },
      }));
    } catch (caught: unknown) {
      setError(friendlyError(caught instanceof Error ? caught.message : "upload"));
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSave(event?: FormEvent) {
    event?.preventDefault();
    if (!dirty || saving) return;

    setError(null);

    try {
      // Keep settings aligned with Tienda online (logo + pie), without duplicating those editors in Configuración.
      const contact = cms.theme.contact;
      const nextCms: StoreCms = {
        ...cms,
        settings: {
          ...cms.settings,
          storeName: cms.theme.logoText?.trim() || cms.settings.storeName,
          email: contact.email,
          whatsapp: contact.whatsapp,
          whatsappNote: contact.whatsappNote,
          instagram: contact.instagram,
          tiktok: contact.tiktok,
          facebook: contact.facebook,
          locationLabel: contact.locationLabel,
          tagline: contact.blurb || cms.settings.tagline,
          description: contact.description || cms.settings.description,
        },
      };

      const saved = await saveCms.mutateAsync(nextCms);
      setCms(saved);
      setDirty(false);
      setSavedAt(new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }));
    } catch (caught: unknown) {
      setError(friendlyError(caught instanceof Error ? caught.message : "save"));
    }
  }

  function goToStep(nextTab: TabId) {
    setTab(nextTab);
  }

  // Always render against a complete CMS shape (guards stale persist / partial API blobs).
  const viewCms = useMemo(() => sanitizeStoreCms(cms), [cms]);

  const previewPanel = useMemo(() => {
    if (tab === "seo") return <SeoPreview cms={viewCms} />;
    if (tab === "theme") return <ThemePreview theme={viewCms.theme} />;
    if (tab === "hero") return <HeroPreview cms={viewCms} slideIndex={0} />;
    if (tab === "featured") {
      return <FeaturedPreview featured={viewCms.home.featured} />;
    }
    if (tab === "value") {
      return <ValuePreview value={viewCms.home.value} />;
    }
    if (tab === "collections") {
      return <CollectionsPreview collections={viewCms.home.collections} />;
    }
    return <FinalCtaPreview finalCta={viewCms.home.finalCta} />;
  }, [viewCms, tab]);

  if (loading) {
    return <AdminModuleSkeleton cards={2} />;
  }

  const previewCard = (
    <section className={`${softCard} overflow-hidden`}>
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 sm:px-5">
        <div>
          <p className="text-sm font-bold text-zinc-900">Vista previa</p>
          <p className="text-xs text-zinc-500">Se actualiza al editar · {active.label}</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
          En vivo
        </span>
      </div>
      <div className="max-h-[min(70vh,44rem)] overflow-y-auto bg-[linear-gradient(180deg,#fafafa,white)] p-3 sm:p-4">
        {previewPanel}
      </div>
    </section>
  );

  return (
    <form onSubmit={handleSave} className="relative space-y-4">
      <div className="sticky top-3 z-30">
        <div className={`${softCard} flex flex-wrap items-center justify-between gap-3 px-4 py-3 shadow-md sm:px-5`}>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4">
            <p className="text-sm text-zinc-600">
              {dirty ? (
                <span className="font-semibold text-amber-700">Cambios sin guardar</span>
              ) : savedAt ? (
                <span className="font-semibold text-emerald-700">Guardado a las {savedAt}</span>
              ) : (
                <span>Edita a la izquierda y mira el resultado al instante.</span>
              )}
            </p>
            <ProgressMeter cms={viewCms} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-zinc-800 transition hover:border-zinc-400"
            >
              <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
              Ver tienda
            </Link>
            <button
              type="submit"
              disabled={saving || !dirty}
              className="inline-flex items-center gap-2 rounded-2xl bg-zinc-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:opacity-40"
            >
              <FontAwesomeIcon icon={faFloppyDisk} className="h-4 w-4" />
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="font-semibold">{error}</p>
        </div>
      ) : null}

      {/* Mobile: preview stays on screen while the form scrolls */}
      <div className="sticky top-[4.75rem] z-20 lg:hidden">
        <div className="max-h-[42vh] overflow-auto rounded-[1.75rem] border border-zinc-200/80 bg-white/95 p-2 shadow-[0_18px_50px_-28px_rgba(24,24,27,0.55)] backdrop-blur">
          {previewCard}
        </div>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 lg:hidden">
        <div className="flex min-w-max gap-2 pb-1">
          {steps.map((step) => {
            const selected = step.id === tab;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => goToStep(step.id)}
                className={[
                  "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold transition",
                  selected ? "bg-zinc-950 text-white" : "bg-white text-zinc-700 ring-1 ring-zinc-200",
                ].join(" ")}
              >
                <span className="text-[10px] opacity-60">{step.number}</span>
                {step.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.95fr)] xl:grid-cols-[200px_minmax(0,1fr)_minmax(360px,0.9fr)]">
        <aside className={`${softCard} hidden h-fit p-2 xl:sticky xl:top-[5.25rem] xl:block`}>
          <nav className="space-y-1">
            {steps.map((step) => {
              const selected = step.id === tab;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(step.id)}
                  className={[
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition",
                    selected ? "bg-zinc-950 text-white" : "text-zinc-700 hover:bg-zinc-50",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm",
                      selected ? "bg-white/10 text-white" : "bg-zinc-100 text-zinc-700",
                    ].join(" ")}
                  >
                    <FontAwesomeIcon icon={step.icon} className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{step.label}</span>
                  </span>
                  {selected ? <FontAwesomeIcon icon={faCheck} className="ml-auto h-3 w-3 opacity-70" /> : null}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className={`${softCard} p-5 sm:p-6`}>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Paso {active.number}</p>
              <h4 className="mt-1 font-serif text-2xl font-semibold text-zinc-950 sm:text-3xl">{active.label}</h4>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!prev}
                onClick={() => prev && goToStep(prev.id)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-30"
                aria-label="Paso anterior"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              <button
                type="button"
                disabled={!next}
                onClick={() => next && goToStep(next.id)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-30"
                aria-label="Siguiente paso"
              >
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </div>
          </div>

          <div className="mb-5 flex gap-2 rounded-2xl bg-zinc-50 px-3 py-2.5 text-sm leading-6 text-zinc-600">
            <FontAwesomeIcon icon={faLightbulb} className="mt-1 h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span>{active.tip}</span>
          </div>

          {tab === "seo" ? (
            <div className="space-y-5">
              <FriendlyField label="Título en Google" hint="Ejemplo: DGM Commerce | Ropa con estilo" counter={`${cms.seo.title.length}/60`}>
                <input
                  className={inputClass}
                  value={cms.seo.title}
                  onChange={(e) => patchCms((p) => ({ ...p, seo: { ...p.seo, title: e.target.value } }))}
                />
                <CharBar value={cms.seo.title} max={60} goodMin={30} />
              </FriendlyField>

              <FriendlyField label="Descripción corta" hint="Una o dos frases que inviten a entrar." counter={`${cms.seo.description.length}/158`}>
                <textarea
                  rows={3}
                  className={inputClass}
                  value={cms.seo.description}
                  onChange={(e) => patchCms((p) => ({ ...p, seo: { ...p.seo, description: e.target.value } }))}
                />
                <CharBar value={cms.seo.description} max={158} goodMin={70} />
              </FriendlyField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FriendlyField label="Título para redes">
                  <input
                    className={inputClass}
                    value={cms.seo.ogTitle}
                    onChange={(e) => patchCms((p) => ({ ...p, seo: { ...p.seo, ogTitle: e.target.value } }))}
                  />
                </FriendlyField>
                <FriendlyField label="Palabras clave" hint="Opcional. Sepáralas con coma.">
                  <input
                    className={inputClass}
                    value={cms.seo.keywords}
                    onChange={(e) => patchCms((p) => ({ ...p, seo: { ...p.seo, keywords: e.target.value } }))}
                    placeholder="ropa, polos, hoodies"
                  />
                </FriendlyField>
              </div>

              <FriendlyField label="Descripción para redes">
                <textarea
                  rows={3}
                  className={inputClass}
                  value={cms.seo.ogDescription}
                  onChange={(e) => patchCms((p) => ({ ...p, seo: { ...p.seo, ogDescription: e.target.value } }))}
                />
              </FriendlyField>

              <FriendlyField label="Imagen para compartir" hint="Opcional. Pega el link de una imagen.">
                <input
                  className={inputClass}
                  value={cms.seo.ogImage}
                  onChange={(e) => patchCms((p) => ({ ...p, seo: { ...p.seo, ogImage: e.target.value } }))}
                  placeholder="https://..."
                />
              </FriendlyField>

              <details className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <summary className="cursor-pointer text-sm font-bold text-zinc-800">Más opciones</summary>
                <div className="mt-3">
                  <FriendlyField label="Plantilla de títulos internos" hint="Deja %s donde va el nombre de la página.">
                    <input
                      className={inputClass}
                      value={cms.seo.titleTemplate}
                      onChange={(e) => patchCms((p) => ({ ...p, seo: { ...p.seo, titleTemplate: e.target.value } }))}
                    />
                  </FriendlyField>
                </div>
              </details>
            </div>
          ) : null}

          {tab === "theme" ? (
            <div className="space-y-6">
              <div>
                <p className="mb-3 text-sm font-bold text-zinc-900">Atajos de color</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {STORE_THEME_PRESETS.map((preset) => {
                    const selected =
                      cms.theme.navbarBackground === preset.theme.navbarBackground &&
                      cms.theme.footerBackground === preset.theme.footerBackground &&
                      cms.theme.navbarText === preset.theme.navbarText &&
                      cms.theme.footerText === preset.theme.footerText;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() =>
                          patchCms((p) => ({
                            ...p,
                            theme: { ...p.theme, ...preset.theme },
                          }))
                        }
                        className={[
                          "overflow-hidden rounded-2xl border-2 text-left transition",
                          selected ? "border-zinc-950" : "border-transparent ring-1 ring-zinc-200",
                        ].join(" ")}
                      >
                        <div className="flex h-12">
                          <span className="w-1/2" style={{ backgroundColor: preset.theme.navbarBackground }} />
                          <span className="w-1/2" style={{ backgroundColor: preset.theme.footerBackground }} />
                        </div>
                        <p className="px-2 py-2 text-xs font-bold text-zinc-900">{preset.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <section className="space-y-5 rounded-[1.5rem] border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Navbar</p>
                    <h5 className="mt-1 text-lg font-bold text-zinc-950">Barra de navegación</h5>
                    <p className="mt-1 text-sm text-zinc-500">Logo, colores y tipografía del menú de arriba.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-bold text-zinc-900">Logo</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { value: "text" as const, label: "Texto", hint: "Nombre de la marca" },
                        { value: "image" as const, label: "Imagen", hint: "Archivo o link" },
                      ] as const
                    ).map((option) => {
                      const selected = cms.theme.logoMode === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            patchCms((p) => ({
                              ...p,
                              theme: { ...p.theme, logoMode: option.value },
                            }))
                          }
                          className={[
                            "rounded-2xl border-2 px-3 py-3 text-left transition",
                            selected ? "border-zinc-950 bg-zinc-50" : "border-transparent bg-zinc-50 ring-1 ring-zinc-200",
                          ].join(" ")}
                        >
                          <p className="text-sm font-bold text-zinc-900">{option.label}</p>
                          <p className="text-xs text-zinc-500">{option.hint}</p>
                        </button>
                      );
                    })}
                  </div>

                  {cms.theme.logoMode === "text" ? (
                    <div className="space-y-4">
                      <FriendlyField label="Nombre en el logo" hint="Ejemplo: Alua Moda">
                        <input
                          className={inputClass}
                          value={cms.theme.logoText}
                          onChange={(e) =>
                            patchCms((p) => ({
                              ...p,
                              theme: { ...p.theme, logoText: e.target.value },
                            }))
                          }
                          placeholder="Tu marca"
                        />
                      </FriendlyField>

                      <div>
                        <p className="mb-2 text-sm font-bold text-zinc-900">Tamaño del logo</p>
                        <div className="grid grid-cols-4 gap-2">
                          {STORE_LOGO_SCALES.map((scale) => {
                            const selected = cms.theme.logoScale === scale.value;
                            return (
                              <button
                                key={scale.value}
                                type="button"
                                onClick={() =>
                                  patchCms((p) => ({
                                    ...p,
                                    theme: { ...p.theme, logoScale: scale.value },
                                  }))
                                }
                                className={[
                                  "rounded-2xl border-2 px-2 py-2.5 text-center transition",
                                  selected ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-zinc-50 text-zinc-800",
                                ].join(" ")}
                              >
                                <p className="text-sm font-black">{scale.label}</p>
                                <p className={`text-[10px] ${selected ? "text-white/70" : "text-zinc-500"}`}>{scale.hint}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-sm font-bold text-zinc-900">Fuente del logo</p>
                        <FontPairPicker
                          value={cms.theme.logoFontPair}
                          compact
                          onChange={(logoFontPair) =>
                            patchCms((p) => ({
                              ...p,
                              theme: { ...p.theme, logoFontPair },
                            }))
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-zinc-950 px-4 py-2.5 text-sm font-bold text-white">
                          <FontAwesomeIcon icon={faUpload} />
                          {uploadingLogo ? "Subiendo..." : "Subir logo"}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                            className="hidden"
                            disabled={uploadingLogo}
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) void uploadLogo(file);
                              event.currentTarget.value = "";
                            }}
                          />
                        </label>
                        {cms.theme.logoImage ? (
                          <button
                            type="button"
                            onClick={() =>
                              patchCms((p) => ({
                                ...p,
                                theme: { ...p.theme, logoImage: "" },
                              }))
                            }
                            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700"
                          >
                            Quitar imagen
                          </button>
                        ) : null}
                      </div>
                      <FriendlyField
                        label="O pega el link de la imagen"
                        hint="PNG o SVG transparente. Wordmark: 240×64 px. Ícono: 128×128 px."
                      >
                        <input
                          className={inputClass}
                          value={cms.theme.logoImage}
                          onChange={(e) =>
                            patchCms((p) => ({
                              ...p,
                              theme: { ...p.theme, logoImage: e.target.value, logoMode: "image" },
                            }))
                          }
                          placeholder="https://..."
                        />
                      </FriendlyField>
                      <div>
                        <p className="mb-2 text-sm font-bold text-zinc-900">Tamaño del logo</p>
                        <div className="grid grid-cols-4 gap-2">
                          {STORE_LOGO_SCALES.map((scale) => {
                            const selected = cms.theme.logoScale === scale.value;
                            return (
                              <button
                                key={scale.value}
                                type="button"
                                onClick={() =>
                                  patchCms((p) => ({
                                    ...p,
                                    theme: { ...p.theme, logoScale: scale.value },
                                  }))
                                }
                                className={[
                                  "rounded-2xl border-2 px-2 py-2.5 text-center transition",
                                  selected ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-zinc-50 text-zinc-800",
                                ].join(" ")}
                              >
                                <p className="text-sm font-black">{scale.label}</p>
                                <p className={`text-[10px] ${selected ? "text-white/70" : "text-zinc-500"}`}>{scale.hint}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex h-20 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-zinc-50">
                        {cms.theme.logoImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cms.theme.logoImage} alt="" className="h-12 w-auto max-w-[220px] object-contain" />
                        ) : (
                          <div className="text-center text-xs text-zinc-400">
                            <FontAwesomeIcon icon={faImage} className="mb-1 h-4 w-4" />
                            <p>Sin logo todavía</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-zinc-500">Este logo también se usa en el pie de página.</p>
                </div>

                <div className="grid gap-4 border-t border-zinc-100 pt-4 sm:grid-cols-2">
                  <ColorPickerField
                    label="Fondo de la barra"
                    value={cms.theme.navbarBackground}
                    onChange={(navbarBackground) =>
                      patchCms((p) => ({ ...p, theme: { ...p.theme, navbarBackground } }))
                    }
                  />
                  <ColorPickerField
                    label="Texto e iconos del menú"
                    value={cms.theme.navbarText}
                    onChange={(navbarText) => patchCms((p) => ({ ...p, theme: { ...p.theme, navbarText } }))}
                  />
                </div>

                <div className="border-t border-zinc-100 pt-4">
                  <p className="mb-2 text-sm font-bold text-zinc-900">Tipografía del menú</p>
                  <p className="mb-3 text-xs text-zinc-500">Afecta Inicio, Productos, Contacto y el resto de enlaces.</p>
                  <FontPairPicker
                    value={cms.theme.fontPair}
                    compact
                    onChange={(fontPair) =>
                      patchCms((p) => ({
                        ...p,
                        theme: { ...p.theme, fontPair },
                      }))
                    }
                  />
                </div>
              </section>

              <section className="space-y-5 rounded-[1.5rem] border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="border-b border-zinc-100 pb-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Footer</p>
                  <h5 className="mt-1 text-lg font-bold text-zinc-950">Pie de página</h5>
                  <p className="mt-1 text-sm text-zinc-500">
                    Colores, tipografía, WhatsApp, redes y textos de contacto.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <ColorPickerField
                    label="Fondo del pie"
                    value={cms.theme.footerBackground}
                    onChange={(footerBackground) =>
                      patchCms((p) => ({ ...p, theme: { ...p.theme, footerBackground } }))
                    }
                  />
                  <ColorPickerField
                    label="Texto del pie"
                    value={cms.theme.footerText}
                    onChange={(footerText) => patchCms((p) => ({ ...p, theme: { ...p.theme, footerText } }))}
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm font-bold text-zinc-900">Tipografía del pie</p>
                  <p className="mb-3 text-xs text-zinc-500">Enlaces y textos del footer. El logo sigue la config del navbar.</p>
                  <FontPairPicker
                    value={cms.theme.footerFontPair}
                    compact
                    onChange={(footerFontPair) =>
                      patchCms((p) => ({
                        ...p,
                        theme: { ...p.theme, footerFontPair },
                      }))
                    }
                  />
                </div>

                <div className="border-t border-zinc-100 pt-4">
                  <p className="mb-1 text-sm font-bold text-zinc-900">Texto junto al logo</p>
                  <p className="mb-3 text-xs text-zinc-500">Frase corta debajo del logo en el pie.</p>
                  <FriendlyField label="Descripción corta">
                    <textarea
                      className={inputClass}
                      rows={2}
                      value={cms.theme.contact.blurb}
                      onChange={(e) =>
                        patchCms((p) => ({
                          ...p,
                          theme: {
                            ...p.theme,
                            contact: { ...p.theme.contact, blurb: e.target.value },
                          },
                        }))
                      }
                    />
                  </FriendlyField>
                </div>

                <div className="border-t border-zinc-100 pt-4">
                  <p className="mb-1 text-sm font-bold text-zinc-900">Hablemos</p>
                  <p className="mb-3 text-xs text-zinc-500">
                    WhatsApp, correo y textos de la columna de contacto. También alimenta el botón
                    flotante.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FriendlyField label="WhatsApp (número o enlace wa.me)">
                      <input
                        className={inputClass}
                        placeholder="51999999999 o https://wa.me/51999999999"
                        value={cms.theme.contact.whatsapp}
                        onChange={(e) =>
                          patchCms((p) => ({
                            ...p,
                            theme: {
                              ...p.theme,
                              contact: { ...p.theme.contact, whatsapp: e.target.value },
                            },
                          }))
                        }
                      />
                    </FriendlyField>
                    <FriendlyField label="Nota bajo WhatsApp">
                      <input
                        className={inputClass}
                        placeholder="WhatsApp · respuesta rápida"
                        value={cms.theme.contact.whatsappNote}
                        onChange={(e) =>
                          patchCms((p) => ({
                            ...p,
                            theme: {
                              ...p.theme,
                              contact: { ...p.theme.contact, whatsappNote: e.target.value },
                            },
                          }))
                        }
                      />
                    </FriendlyField>
                    <FriendlyField label="Correo">
                      <input
                        className={inputClass}
                        type="email"
                        placeholder="hola@tutienda.com"
                        value={cms.theme.contact.email}
                        onChange={(e) =>
                          patchCms((p) => ({
                            ...p,
                            theme: {
                              ...p.theme,
                              contact: { ...p.theme.contact, email: e.target.value },
                            },
                          }))
                        }
                      />
                    </FriendlyField>
                    <FriendlyField label="Envíos / ubicación">
                      <input
                        className={inputClass}
                        placeholder="Envíos a todo el país"
                        value={cms.theme.contact.locationLabel}
                        onChange={(e) =>
                          patchCms((p) => ({
                            ...p,
                            theme: {
                              ...p.theme,
                              contact: { ...p.theme.contact, locationLabel: e.target.value },
                            },
                          }))
                        }
                      />
                    </FriendlyField>
                  </div>
                  <div className="mt-4">
                    <FriendlyField label="Descripción de la tienda">
                      <textarea
                        className={inputClass}
                        rows={2}
                        placeholder="Tienda online de ropa urbana..."
                        value={cms.theme.contact.description}
                        onChange={(e) =>
                          patchCms((p) => ({
                            ...p,
                            theme: {
                              ...p.theme,
                              contact: { ...p.theme.contact, description: e.target.value },
                            },
                          }))
                        }
                      />
                    </FriendlyField>
                  </div>
                </div>

                <div className="border-t border-zinc-100 pt-4">
                  <p className="mb-1 text-sm font-bold text-zinc-900">Redes sociales</p>
                  <p className="mb-3 text-xs text-zinc-500">
                    Deja vacío el que no uses: no se muestra el ícono.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FriendlyField label="Instagram">
                      <input
                        className={inputClass}
                        placeholder="https://instagram.com/tuusuario"
                        value={cms.theme.contact.instagram}
                        onChange={(e) =>
                          patchCms((p) => ({
                            ...p,
                            theme: {
                              ...p.theme,
                              contact: { ...p.theme.contact, instagram: e.target.value },
                            },
                          }))
                        }
                      />
                    </FriendlyField>
                    <FriendlyField label="TikTok">
                      <input
                        className={inputClass}
                        placeholder="https://tiktok.com/@tuusuario"
                        value={cms.theme.contact.tiktok}
                        onChange={(e) =>
                          patchCms((p) => ({
                            ...p,
                            theme: {
                              ...p.theme,
                              contact: { ...p.theme.contact, tiktok: e.target.value },
                            },
                          }))
                        }
                      />
                    </FriendlyField>
                    <FriendlyField label="Facebook">
                      <input
                        className={inputClass}
                        placeholder="https://facebook.com/tuusuario"
                        value={cms.theme.contact.facebook}
                        onChange={(e) =>
                          patchCms((p) => ({
                            ...p,
                            theme: {
                              ...p.theme,
                              contact: { ...p.theme.contact, facebook: e.target.value },
                            },
                          }))
                        }
                      />
                    </FriendlyField>
                  </div>
                </div>
              </section>

              <p className="text-sm text-zinc-500">Guarda y abre la tienda para ver navbar y footer actualizados.</p>
            </div>
          ) : null}

          {tab === "hero" ? (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <FriendlyField label="Nombre de marca">
                  <input
                    className={inputClass}
                    value={cms.home.hero.title}
                    onChange={(e) =>
                      patchCms((p) => ({ ...p, home: { ...p.home, hero: { ...p.home.hero, title: e.target.value } } }))
                    }
                  />
                </FriendlyField>
                <FriendlyField label="Etiqueta superior">
                  <input
                    className={inputClass}
                    value={cms.home.hero.eyebrow}
                    onChange={(e) =>
                      patchCms((p) => ({
                        ...p,
                        home: { ...p.home, hero: { ...p.home.hero, eyebrow: e.target.value } },
                      }))
                    }
                  />
                </FriendlyField>
              </div>

              <FriendlyField label="Frase de apoyo" hint="Opcional.">
                <input
                  className={inputClass}
                  value={cms.home.hero.subtitle}
                  onChange={(e) =>
                    patchCms((p) => ({
                      ...p,
                      home: { ...p.home, hero: { ...p.home.hero, subtitle: e.target.value } },
                    }))
                  }
                />
              </FriendlyField>

              <div>
                <p className="mb-2 text-sm font-bold text-zinc-900">Alineación</p>
                <div className="grid grid-cols-3 gap-2">
                  {STORE_HERO_ALIGN_OPTIONS.map((option) => {
                    const selected = normalizeHeroAlign(cms.home.hero.align) === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          patchCms((p) => ({
                            ...p,
                            home: { ...p.home, hero: { ...p.home.hero, align: option.value } },
                          }))
                        }
                        className={[
                          "rounded-2xl border-2 px-3 py-3 text-left transition",
                          selected ? "border-zinc-950 bg-white" : "border-transparent bg-zinc-50 ring-1 ring-zinc-200",
                        ].join(" ")}
                      >
                        <p
                          className={[
                            "text-sm font-bold text-zinc-900",
                            option.value === "center" ? "text-center" : option.value === "right" ? "text-right" : "text-left",
                          ].join(" ")}
                        >
                          ≡
                        </p>
                        <p className="mt-1 text-xs font-bold text-zinc-900">{option.label}</p>
                        <p className="text-[11px] text-zinc-500">{option.hint}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-bold text-zinc-900">Tipografía de la portada</p>
                <p className="mb-3 text-sm text-zinc-500">Solo afecta esta sección de inicio.</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {STORE_FONT_PAIRS.map((pair) => {
                    const selected = getStoreFontPair(cms.home.hero.fontPair).id === pair.id;
                    return (
                      <button
                        key={pair.id}
                        type="button"
                        onClick={() =>
                          patchCms((p) => ({
                            ...p,
                            home: { ...p.home, hero: { ...p.home.hero, fontPair: pair.id } },
                          }))
                        }
                        className={[
                          "rounded-2xl border-2 px-4 py-3 text-left transition",
                          selected ? "border-zinc-950 bg-white" : "border-transparent bg-zinc-50 ring-1 ring-zinc-200",
                        ].join(" ")}
                        style={
                          {
                            "--store-hero-display": `var(${pair.displayVar})`,
                            "--store-hero-sans": `var(${pair.sansVar})`,
                          } as CSSProperties
                        }
                      >
                        <p
                          className="text-xl font-semibold leading-none text-zinc-950"
                          style={{ fontFamily: "var(--store-hero-display)" }}
                        >
                          Aa
                        </p>
                        <p className="mt-2 text-sm font-bold text-zinc-900">{pair.label}</p>
                        <p className="mt-0.5 text-xs text-zinc-500">{pair.hint}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <ButtonLinkEditor
                title="Botón principal"
                value={cms.home.hero.primaryCta}
                onChange={(primaryCta) =>
                  patchCms((p) => ({ ...p, home: { ...p.home, hero: { ...p.home.hero, primaryCta } } }))
                }
              />
              <ButtonLinkEditor
                title="Botón secundario"
                value={cms.home.hero.secondaryCta}
                onChange={(secondaryCta) =>
                  patchCms((p) => ({ ...p, home: { ...p.home, hero: { ...p.home.hero, secondaryCta } } }))
                }
              />

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-zinc-900">Banners de la portada</p>
                    <p className="text-xs text-zinc-500">Toca un banner para editarlo en su propia página.</p>
                  </div>
                  <Link
                    href="/admin/store/banners/new"
                    className="inline-flex items-center gap-2 rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-sm font-bold text-zinc-800"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Nuevo banner
                  </Link>
                </div>

                <ul className="overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white">
                  {cms.home.hero.slides.map((slide, index) => (
                    <li key={slide.id} className="border-b border-zinc-100 last:border-b-0">
                      <Link
                        href={`/admin/store/banners/${slide.id}`}
                        className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-zinc-50"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 text-xs font-black text-zinc-500">
                          {slide.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={slide.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            index + 1
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-zinc-950">Banner {index + 1}</span>
                          <span className="block truncate text-xs text-zinc-500">
                            {slide.title || "Sin título"} {slide.kicker ? `· ${slide.kicker}` : ""}
                          </span>
                        </span>
                        <FontAwesomeIcon icon={faChevronRight} className="h-3.5 w-3.5 text-zinc-400" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {tab === "featured" ? (
            <div className="space-y-5">
              <FriendlyField label="Título">
                <input
                  className={inputClass}
                  value={cms.home.featured.title}
                  onChange={(e) =>
                    patchCms((p) => ({
                      ...p,
                      home: { ...p.home, featured: { ...p.home.featured, title: e.target.value } },
                    }))
                  }
                />
              </FriendlyField>
              <FriendlyField label="Subtítulo">
                <input
                  className={inputClass}
                  value={cms.home.featured.subtitle}
                  onChange={(e) =>
                    patchCms((p) => ({
                      ...p,
                      home: { ...p.home, featured: { ...p.home.featured, subtitle: e.target.value } },
                    }))
                  }
                />
              </FriendlyField>
              <ButtonLinkEditor
                title="Botón"
                value={cms.home.featured.cta}
                onChange={(cta) =>
                  patchCms((p) => ({
                    ...p,
                    home: { ...p.home, featured: { ...p.home.featured, cta } },
                  }))
                }
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <ColorPickerField
                  label="Color de fondo"
                  value={cms.home.featured.backgroundColor || "#ffffff"}
                  onChange={(backgroundColor) =>
                    patchCms((p) => ({
                      ...p,
                      home: { ...p.home, featured: { ...p.home.featured, backgroundColor } },
                    }))
                  }
                />
                <ColorPickerField
                  label="Color de letra"
                  value={cms.home.featured.textColor || "#09090b"}
                  onChange={(textColor) =>
                    patchCms((p) => ({
                      ...p,
                      home: { ...p.home, featured: { ...p.home.featured, textColor } },
                    }))
                  }
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-bold text-zinc-900">Tipografía</p>
                <FontPairPicker
                  value={cms.home.featured.fontPair || "classic"}
                  compact
                  onChange={(fontPair) =>
                    patchCms((p) => ({
                      ...p,
                      home: { ...p.home, featured: { ...p.home.featured, fontPair } },
                    }))
                  }
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-bold text-zinc-900">Cantidad de productos</p>
                <div className="flex flex-wrap gap-2">
                  {STORE_FEATURED_LIMITS.map((limit) => {
                    const selected = (cms.home.featured.limit || 3) === limit;
                    return (
                      <button
                        key={limit}
                        type="button"
                        onClick={() =>
                          patchCms((p) => ({
                            ...p,
                            home: {
                              ...p.home,
                              featured: {
                                ...p.home.featured,
                                limit,
                                productIds: (p.home.featured.productIds || []).slice(0, limit),
                              },
                            },
                          }))
                        }
                        className={[
                          "rounded-2xl border-2 px-4 py-2 text-sm font-bold transition",
                          selected
                            ? "border-zinc-950 bg-zinc-950 text-white"
                            : "border-transparent bg-white text-zinc-800 ring-1 ring-zinc-200",
                        ].join(" ")}
                      >
                        {limit}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-bold text-zinc-900">Qué productos mostrar</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {STORE_FEATURED_SOURCES.map((source) => {
                    const selected = (cms.home.featured.source || "newest") === source.value;
                    return (
                      <button
                        key={source.value}
                        type="button"
                        onClick={() =>
                          patchCms((p) => ({
                            ...p,
                            home: {
                              ...p.home,
                              featured: {
                                ...p.home.featured,
                                source: source.value as StoreFeaturedSource,
                              },
                            },
                          }))
                        }
                        className={[
                          "rounded-2xl border-2 px-3 py-3 text-left transition",
                          selected ? "border-zinc-950 bg-white" : "border-transparent bg-white ring-1 ring-zinc-200",
                        ].join(" ")}
                      >
                        <p className="text-sm font-bold text-zinc-900">{source.label}</p>
                        <p className="mt-1 text-[11px] text-zinc-500">{source.hint}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {cms.home.featured.source === "manual" ? (
                <FeaturedProductPicker
                  selectedIds={cms.home.featured.productIds || []}
                  limit={cms.home.featured.limit || 3}
                  onChange={(productIds) =>
                    patchCms((p) => ({
                      ...p,
                      home: { ...p.home, featured: { ...p.home.featured, productIds } },
                    }))
                  }
                />
              ) : null}
            </div>
          ) : null}

          {tab === "value" ? (
            <div className="space-y-5">
              <FriendlyField label="Título de la sección">
                <textarea
                  rows={2}
                  className={inputClass}
                  value={cms.home.value.title}
                  onChange={(e) =>
                    patchCms((p) => ({
                      ...p,
                      home: { ...p.home, value: { ...p.home.value, title: e.target.value } },
                    }))
                  }
                />
              </FriendlyField>

              <div className="grid gap-4 sm:grid-cols-2">
                <ColorPickerField
                  label="Color de fondo"
                  value={cms.home.value.backgroundColor || "#09090b"}
                  onChange={(backgroundColor) =>
                    patchCms((p) => ({
                      ...p,
                      home: { ...p.home, value: { ...p.home.value, backgroundColor } },
                    }))
                  }
                />
                <ColorPickerField
                  label="Color de letra"
                  value={cms.home.value.textColor || "#ffffff"}
                  onChange={(textColor) =>
                    patchCms((p) => ({
                      ...p,
                      home: { ...p.home, value: { ...p.home.value, textColor } },
                    }))
                  }
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-bold text-zinc-900">Tipografía</p>
                <p className="mb-3 text-xs text-zinc-500">Afecta el título y las razones de esta sección.</p>
                <FontPairPicker
                  value={cms.home.value.fontPair || "classic"}
                  compact
                  onChange={(fontPair) =>
                    patchCms((p) => ({
                      ...p,
                      home: { ...p.home, value: { ...p.home.value, fontPair } },
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-zinc-900">Razones</p>
                  <p className="text-xs text-zinc-500">Hasta 8. Puedes añadir o quitar las que necesites.</p>
                </div>
                <button
                  type="button"
                  disabled={cms.home.value.points.length >= 8}
                  onClick={() =>
                    patchCms((p) => ({
                      ...p,
                      home: {
                        ...p.home,
                        value: {
                          ...p.home.value,
                          points: [...p.home.value.points, { title: "", text: "" }],
                        },
                      },
                    }))
                  }
                  className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-bold text-zinc-800 transition hover:border-zinc-400 disabled:opacity-40"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Añadir
                </button>
              </div>

              {cms.home.value.points.length === 0 ? (
                <p className="rounded-[1.25rem] border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
                  No hay razones. Añade al menos una para mostrar la sección con contenido.
                </p>
              ) : null}

              {cms.home.value.points.map((point, index) => (
                <div key={index} className="space-y-3 rounded-[1.5rem] border border-zinc-200 bg-zinc-50/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-zinc-900">Razón {index + 1}</p>
                    <button
                      type="button"
                      onClick={() =>
                        patchCms((p) => ({
                          ...p,
                          home: {
                            ...p.home,
                            value: {
                              ...p.home.value,
                              points: p.home.value.points.filter((_, itemIndex) => itemIndex !== index),
                            },
                          },
                        }))
                      }
                      className="inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                      Eliminar
                    </button>
                  </div>
                  <FriendlyField label="Título corto">
                    <input
                      className={inputClass}
                      value={point.title}
                      onChange={(e) =>
                        patchCms((p) => {
                          const points = p.home.value.points.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, title: e.target.value } : item,
                          );
                          return { ...p, home: { ...p.home, value: { ...p.home.value, points } } };
                        })
                      }
                    />
                  </FriendlyField>
                  <FriendlyField label="Explicación">
                    <textarea
                      rows={2}
                      className={inputClass}
                      value={point.text}
                      onChange={(e) =>
                        patchCms((p) => {
                          const points = p.home.value.points.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, text: e.target.value } : item,
                          );
                          return { ...p, home: { ...p.home, value: { ...p.home.value, points } } };
                        })
                      }
                    />
                  </FriendlyField>
                </div>
              ))}
            </div>
          ) : null}

          {tab === "collections" ? (
            <div className="space-y-5">
              <FriendlyField label="Título">
                <input
                  className={inputClass}
                  value={cms.home.collections.title}
                  onChange={(e) =>
                    patchCms((p) => ({
                      ...p,
                      home: { ...p.home, collections: { ...p.home.collections, title: e.target.value } },
                    }))
                  }
                />
              </FriendlyField>
              <FriendlyField label="Subtítulo">
                <input
                  className={inputClass}
                  value={cms.home.collections.subtitle}
                  onChange={(e) =>
                    patchCms((p) => ({
                      ...p,
                      home: { ...p.home, collections: { ...p.home.collections, subtitle: e.target.value } },
                    }))
                  }
                />
              </FriendlyField>
              <FriendlyField label="Mensaje si no hay colecciones">
                <input
                  className={inputClass}
                  value={cms.home.collections.empty}
                  onChange={(e) =>
                    patchCms((p) => ({
                      ...p,
                      home: { ...p.home, collections: { ...p.home.collections, empty: e.target.value } },
                    }))
                  }
                />
              </FriendlyField>
              <FriendlyField label="Texto del enlace en cada tarjeta" hint='Ej: Ver colección →'>
                <input
                  className={inputClass}
                  value={cms.home.collections.linkLabel || ""}
                  onChange={(e) =>
                    patchCms((p) => ({
                      ...p,
                      home: { ...p.home, collections: { ...p.home.collections, linkLabel: e.target.value } },
                    }))
                  }
                />
              </FriendlyField>

              <div className="grid gap-4 sm:grid-cols-2">
                <ColorPickerField
                  label="Color de fondo"
                  value={cms.home.collections.backgroundColor || "#ffffff"}
                  onChange={(backgroundColor) =>
                    patchCms((p) => ({
                      ...p,
                      home: { ...p.home, collections: { ...p.home.collections, backgroundColor } },
                    }))
                  }
                />
                <ColorPickerField
                  label="Color de letra"
                  value={cms.home.collections.textColor || "#09090b"}
                  onChange={(textColor) =>
                    patchCms((p) => ({
                      ...p,
                      home: { ...p.home, collections: { ...p.home.collections, textColor } },
                    }))
                  }
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-bold text-zinc-900">Tipografía</p>
                <FontPairPicker
                  value={cms.home.collections.fontPair || "classic"}
                  compact
                  onChange={(fontPair) =>
                    patchCms((p) => ({
                      ...p,
                      home: { ...p.home, collections: { ...p.home.collections, fontPair } },
                    }))
                  }
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-bold text-zinc-900">Cantidad de colecciones</p>
                <div className="flex flex-wrap gap-2">
                  {STORE_COLLECTION_LIMITS.map((limit) => {
                    const selected = (cms.home.collections.limit || 6) === limit;
                    return (
                      <button
                        key={limit}
                        type="button"
                        onClick={() =>
                          patchCms((p) => ({
                            ...p,
                            home: {
                              ...p.home,
                              collections: {
                                ...p.home.collections,
                                limit,
                                selectedNames: (p.home.collections.selectedNames || []).slice(0, limit),
                              },
                            },
                          }))
                        }
                        className={[
                          "rounded-2xl border-2 px-4 py-2 text-sm font-bold transition",
                          selected
                            ? "border-zinc-950 bg-zinc-950 text-white"
                            : "border-transparent bg-white text-zinc-800 ring-1 ring-zinc-200",
                        ].join(" ")}
                      >
                        {limit}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-bold text-zinc-900">Qué colecciones mostrar</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {STORE_COLLECTION_SOURCES.map((source) => {
                    const selected = (cms.home.collections.source || "all") === source.value;
                    return (
                      <button
                        key={source.value}
                        type="button"
                        onClick={() =>
                          patchCms((p) => ({
                            ...p,
                            home: {
                              ...p.home,
                              collections: {
                                ...p.home.collections,
                                source: source.value as StoreCollectionSource,
                              },
                            },
                          }))
                        }
                        className={[
                          "rounded-2xl border-2 px-3 py-3 text-left transition",
                          selected ? "border-zinc-950 bg-white" : "border-transparent bg-white ring-1 ring-zinc-200",
                        ].join(" ")}
                      >
                        <p className="text-sm font-bold text-zinc-900">{source.label}</p>
                        <p className="mt-1 text-[11px] text-zinc-500">{source.hint}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {cms.home.collections.source === "manual" ? (
                <CollectionNamePicker
                  selectedNames={cms.home.collections.selectedNames || []}
                  limit={cms.home.collections.limit || 6}
                  onChange={(selectedNames) =>
                    patchCms((p) => ({
                      ...p,
                      home: { ...p.home, collections: { ...p.home.collections, selectedNames } },
                    }))
                  }
                />
              ) : null}
            </div>
          ) : null}

          {tab === "finalCta" ? (
            <div className="space-y-5">
              <FriendlyField label="Título final">
                <input
                  className={inputClass}
                  value={cms.home.finalCta.title}
                  onChange={(e) =>
                    patchCms((p) => ({
                      ...p,
                      home: { ...p.home, finalCta: { ...p.home.finalCta, title: e.target.value } },
                    }))
                  }
                />
              </FriendlyField>
              <FriendlyField label="Subtítulo">
                <input
                  className={inputClass}
                  value={cms.home.finalCta.subtitle}
                  onChange={(e) =>
                    patchCms((p) => ({
                      ...p,
                      home: { ...p.home, finalCta: { ...p.home.finalCta, subtitle: e.target.value } },
                    }))
                  }
                />
              </FriendlyField>
              <FriendlyField
                label="Urgencia o beneficio"
                hint="Opcional. Ej: Envío gratis esta semana · Nuevos ingresos"
              >
                <input
                  className={inputClass}
                  value={cms.home.finalCta.urgency || ""}
                  placeholder="Envío gratis esta semana"
                  onChange={(e) =>
                    patchCms((p) => ({
                      ...p,
                      home: { ...p.home, finalCta: { ...p.home.finalCta, urgency: e.target.value } },
                    }))
                  }
                />
              </FriendlyField>

              <div className="grid gap-4 sm:grid-cols-2">
                <ColorPickerField
                  label="Color de fondo"
                  value={cms.home.finalCta.backgroundColor || "#ffffff"}
                  onChange={(backgroundColor) =>
                    patchCms((p) => ({
                      ...p,
                      home: { ...p.home, finalCta: { ...p.home.finalCta, backgroundColor } },
                    }))
                  }
                />
                <ColorPickerField
                  label="Color de letra"
                  value={cms.home.finalCta.textColor || "#09090b"}
                  onChange={(textColor) =>
                    patchCms((p) => ({
                      ...p,
                      home: { ...p.home, finalCta: { ...p.home.finalCta, textColor } },
                    }))
                  }
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-bold text-zinc-900">Tipografía</p>
                <FontPairPicker
                  value={cms.home.finalCta.fontPair || "classic"}
                  compact
                  onChange={(fontPair) =>
                    patchCms((p) => ({
                      ...p,
                      home: { ...p.home, finalCta: { ...p.home.finalCta, fontPair } },
                    }))
                  }
                />
              </div>

              <ButtonLinkEditor
                title="Botón principal"
                value={cms.home.finalCta.cta}
                onChange={(cta) =>
                  patchCms((p) => ({
                    ...p,
                    home: { ...p.home, finalCta: { ...p.home.finalCta, cta } },
                  }))
                }
              />
              <ButtonLinkEditor
                title="Botón secundario (opcional)"
                value={cms.home.finalCta.secondaryCta || { label: "", href: "__whatsapp__" }}
                onChange={(secondaryCta) =>
                  patchCms((p) => ({
                    ...p,
                    home: { ...p.home, finalCta: { ...p.home.finalCta, secondaryCta } },
                  }))
                }
              />
              <p className="text-xs text-zinc-500">
                Si eliges WhatsApp, usa el número configurado en Barra y pie. Deja vacío el texto del
                botón secundario para ocultarlo.
              </p>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-5">
            <button
              type="button"
              disabled={!prev}
              onClick={() => prev && goToStep(prev.id)}
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm font-bold text-zinc-700 disabled:opacity-30"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              Anterior
            </button>
            {next ? (
              <button
                type="button"
                onClick={() => goToStep(next.id)}
                className="inline-flex items-center gap-2 rounded-2xl bg-zinc-950 px-5 py-2.5 text-sm font-bold text-white"
              >
                Siguiente
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving || !dirty}
                className="inline-flex items-center gap-2 rounded-2xl bg-zinc-950 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40"
              >
                <FontAwesomeIcon icon={faFloppyDisk} />
                {saving ? "Guardando..." : "Guardar"}
              </button>
            )}
          </div>
        </section>

        {/* Desktop: preview pinned beside the editor */}
        <div className="hidden lg:block">
          <div className="sticky top-[5.25rem] space-y-3">
            {previewCard}
            <p className="px-1 text-xs leading-5 text-zinc-500">
              Mientras editas, esta vista se mantiene visible. No hace falta subir a comprobar.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
