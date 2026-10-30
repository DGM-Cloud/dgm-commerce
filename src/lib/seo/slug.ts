/** URL-safe slug helpers for catalog SEO. */

const MAX_SLUG_LENGTH = 96;

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function truncateSlug(slug: string, max = MAX_SLUG_LENGTH): string {
  if (slug.length <= max) return slug;
  const trimmed = slug.slice(0, max);
  const lastDash = trimmed.lastIndexOf("-");
  return (lastDash > 24 ? trimmed.slice(0, lastDash) : trimmed).replace(/-+$/g, "");
}

/** Extract trailing numeric product id from `/products/{slug}-{id}`. */
export function parseProductIdFromSlug(slug: string): number | null {
  const match = slug.trim().match(/-(\d+)$/);
  if (!match) {
    if (/^\d+$/.test(slug.trim())) return Number(slug.trim());
    return null;
  }
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}
