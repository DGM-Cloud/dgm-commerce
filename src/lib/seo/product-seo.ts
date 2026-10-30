import { brand } from "@/config/brand";
import { parseProductIdFromSlug, slugify, truncateSlug } from "@/lib/seo/slug";

export type ProductSeoInput = {
  id: number;
  name: string;
  summary?: string;
  description?: string;
  category?: string;
  collection?: string;
  /** Optional persisted overrides (admin / DB). */
  slug?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export type ProductSeo = {
  slug: string;
  path: string;
  seoTitle: string;
  seoDescription: string;
  canonicalPath: string;
};

const META_DESCRIPTION_LENGTH = 158;

function compactText(value: string | undefined | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function firstWords(value: string, count: number): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, count)
    .join(" ");
}

/**
 * Builds a stable SEO slug: `{keywords-from-name-and-seo-description}-{id}`
 * The trailing id keeps URLs unique and allows lookup/redirects.
 */
export function buildProductSlug(input: ProductSeoInput): string {
  if (input.slug?.trim()) {
    const custom = slugify(input.slug.trim());
    const withId = custom.endsWith(`-${input.id}`) ? custom : `${custom}-${input.id}`;
    return truncateSlug(withId);
  }

  const namePart = slugify(input.name);
  const seoSource = compactText(input.seoDescription) || compactText(input.summary);
  const seoPart = seoSource ? slugify(firstWords(seoSource, 8)) : "";
  const categoryPart = input.category ? slugify(input.category) : "";

  const core = [namePart, seoPart || categoryPart].filter(Boolean).join("-");
  return truncateSlug(`${core || "producto"}-${input.id}`);
}

export function buildSeoDescription(input: ProductSeoInput): string {
  const explicit = compactText(input.seoDescription);
  if (explicit) return explicit.slice(0, META_DESCRIPTION_LENGTH);

  const summary = compactText(input.summary);
  if (summary) return summary.slice(0, META_DESCRIPTION_LENGTH);

  const description = compactText(input.description);
  if (description) return description.slice(0, META_DESCRIPTION_LENGTH);

  const bits = [input.name, input.category, input.collection, brand.name].filter(Boolean);
  return bits.join(" · ").slice(0, META_DESCRIPTION_LENGTH);
}

export function buildSeoTitle(input: ProductSeoInput): string {
  const explicit = compactText(input.seoTitle);
  if (explicit) return explicit;
  const category = compactText(input.category);
  // Layout already appends `| ${brand.name}` via metadata template.
  return category ? `${input.name} | ${category}` : input.name;
}

export function buildProductSeo(input: ProductSeoInput): ProductSeo {
  const slug = buildProductSlug(input);
  const path = `/products/${slug}`;
  return {
    slug,
    path,
    seoTitle: buildSeoTitle(input),
    seoDescription: buildSeoDescription(input),
    canonicalPath: path,
  };
}

export function productPathFromSeo(input: ProductSeoInput): string {
  return buildProductSeo(input).path;
}

export function resolveProductIdParam(param: string): number | null {
  return parseProductIdFromSlug(param);
}
