import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import Collections from "@/components/home/Collections";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import ValueProposition from "@/components/home/ValueProposition";
import FinalCta from "@/components/home/FinalCta";
import { brand } from "@/config/brand";
import { getStoreCms } from "@/backend/store-cms.server";
import { absoluteUrl } from "@/lib/site-url";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getStoreCms();
  const ogImage = cms.seo.ogImage
    ? cms.seo.ogImage.startsWith("http")
      ? cms.seo.ogImage
      : absoluteUrl(cms.seo.ogImage)
    : undefined;

  return {
    title: {
      absolute: cms.seo.title,
    },
    description: cms.seo.description,
    keywords: cms.seo.keywords
      ? cms.seo.keywords.split(",").map((item) => item.trim()).filter(Boolean)
      : undefined,
    alternates: {
      canonical: absoluteUrl("/"),
    },
    openGraph: {
      title: cms.seo.ogTitle,
      description: cms.seo.ogDescription,
      url: absoluteUrl("/"),
      siteName: cms.settings.storeName || brand.name,
      type: "website",
      locale: cms.settings.locale === "es" ? "es_LA" : cms.settings.locale || brand.locale,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  };
}

export default async function HomePage() {
  const cms = await getStoreCms();

  return (
    <div className="min-h-screen bg-stone-50">
      <Hero content={cms.home.hero} />
      <FeaturedProducts content={cms.home.featured} />
      <ValueProposition content={cms.home.value} />
      <Collections content={cms.home.collections} />
      <FinalCta content={cms.home.finalCta} />
    </div>
  );
}
