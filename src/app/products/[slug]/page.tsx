import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import ProductDetails from "@/components/ProductDetails";
import { getStorefrontProductByParam, listStorefrontProductPaths } from "@/backend/storefront.server";
import { brand } from "@/config/brand";
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/seo/json-ld";
import { absoluteUrl } from "@/lib/site-url";

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  try {
    const paths = await listStorefrontProductPaths();
    return paths.map((item) => ({ slug: item.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { product, canonicalSlug } = await getStorefrontProductByParam(slug);

  if (!product) {
    return {
      title: `Producto no encontrado | ${brand.name}`,
      robots: { index: false, follow: false },
    };
  }

  const canonical = absoluteUrl(product.path);
  const image = product.images[0];

  return {
    title: product.seoTitle,
    description: product.seoDescription,
    alternates: {
      canonical: absoluteUrl(canonicalSlug ? `/products/${canonicalSlug}` : product.path),
    },
    openGraph: {
      title: product.seoTitle,
      description: product.seoDescription,
      url: canonical,
      siteName: brand.name,
      type: "website",
      locale: brand.locale === "es" ? "es_LA" : brand.locale,
      images: image
        ? [
            {
              url: image,
              alt: product.name,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.seoTitle,
      description: product.seoDescription,
      images: image ? [image] : undefined,
    },
    robots: {
      index: product.available,
      follow: true,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const { product, related, canonicalSlug } = await getStorefrontProductByParam(slug);

  if (!product || !canonicalSlug) notFound();

  if (slug !== canonicalSlug) {
    permanentRedirect(`/products/${canonicalSlug}`);
  }

  const productUrl = absoluteUrl(product.path);
  const jsonLd = [
    buildProductJsonLd(product, productUrl),
    buildBreadcrumbJsonLd([
      { name: "Inicio", url: absoluteUrl("/") },
      { name: "Productos", url: absoluteUrl("/products") },
      { name: product.name, url: productUrl },
    ]),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetails product={product} related={related} />
    </>
  );
}
