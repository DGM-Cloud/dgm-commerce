import type { CSSProperties } from "react";
import type { Metadata } from "next";
import {
  Archivo,
  Cormorant_Garamond,
  DM_Sans,
  Fraunces,
  Karla,
  Libre_Baskerville,
  Manrope,
  Nunito_Sans,
  Outfit,
  Playfair_Display,
  Source_Sans_3,
  Space_Grotesk,
} from "next/font/google";
import ClientWrapper from "@/components/ClientWrapper";
import WhatsAppButton from "@/components/WhatsAppButton";
import { brand } from "@/config/brand";
import { getStoreCms } from "@/backend/store-cms.server";
import { storeThemeCssVars } from "@/lib/store-cms";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const nunito = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-libre-baskerville",
  display: "swap",
});

const karla = Karla({
  subsets: ["latin"],
  variable: "--font-karla",
  display: "swap",
});

const fontVariables = [
  fraunces.variable,
  manrope.variable,
  playfair.variable,
  sourceSans.variable,
  spaceGrotesk.variable,
  outfit.variable,
  cormorant.variable,
  nunito.variable,
  archivo.variable,
  dmSans.variable,
  libreBaskerville.variable,
  karla.variable,
].join(" ");

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getStoreCms();
  const storeName = cms.settings.storeName || brand.name;

  return {
    title: {
      default: cms.seo.title || storeName,
      template: cms.seo.titleTemplate || `%s | ${storeName}`,
    },
    description: cms.seo.description || cms.settings.description || brand.description,
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000",
    ),
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cms = await getStoreCms();
  const themeVars = storeThemeCssVars(cms.theme);

  return (
    <html lang={cms.settings.locale || "es"} className={fontVariables}>
      <body className="bg-stone-50 font-sans text-zinc-950 antialiased" style={themeVars as CSSProperties}>
        <ClientWrapper theme={cms.theme} settings={cms.settings}>
          {children}
          <WhatsAppButton />
        </ClientWrapper>
      </body>
    </html>
  );
}
