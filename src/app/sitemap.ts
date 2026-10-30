import type { MetadataRoute } from "next";
import { listStorefrontProductPaths } from "@/backend/storefront.server";
import { absoluteUrl } from "@/lib/site-url";

export const revalidate = 60;

const STATIC_PATHS = ["/", "/products", "/about", "/faq", "/contact", "/terms", "/cart", "/login", "/register"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === "/" || path === "/products" ? "daily" : "weekly",
    priority: path === "/" ? 1 : path === "/products" ? 0.9 : 0.5,
  }));

  try {
    const products = await listStorefrontProductPaths();
    const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
      url: absoluteUrl(product.path),
      lastModified: product.updatedAt ? new Date(product.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
    return [...staticEntries, ...productEntries];
  } catch {
    return staticEntries;
  }
}
