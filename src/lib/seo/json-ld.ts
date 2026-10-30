import { brand } from "@/config/brand";
import type { StorefrontProductDetail } from "@/lib/storefront-products";

export function buildProductJsonLd(
  product: StorefrontProductDetail,
  absoluteUrl: string,
  currency = "PEN",
) {
  const images = product.images.filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.seoDescription || product.summary,
    image: images,
    sku: product.parentSku,
    productID: String(product.id),
    brand: {
      "@type": "Brand",
      name: brand.name,
    },
    category: product.category || product.collection,
    offers: {
      "@type": "Offer",
      url: absoluteUrl,
      priceCurrency: currency,
      price: product.price.toFixed(2),
      availability: product.available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}

export function buildBreadcrumbJsonLd(
  items: { name: string; url: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
