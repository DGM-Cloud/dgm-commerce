"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useStoreChrome } from "@/components/StoreChromeProvider";
import { buildWhatsAppUrl, getStoreFontPair, type StoreCta, type StoreHomeContent } from "@/lib/store-cms";

function resolveCtaHref(cta: StoreCta, whatsappRaw: string, brandLabel: string) {
  if (!cta.href?.trim() || cta.href === "__whatsapp__") {
    return buildWhatsAppUrl(whatsappRaw, `Hola, quiero más información sobre ${brandLabel}.`);
  }
  return cta.href;
}

export default function FinalCta({ content }: { content: StoreHomeContent["finalCta"] }) {
  const chrome = useStoreChrome();
  const font = getStoreFontPair(content.fontPair);
  const backgroundColor = content.backgroundColor || "#ffffff";
  const textColor = content.textColor || "#09090b";
  const brandLabel = chrome.logoText?.trim() || "la tienda";
  const whatsappRaw = chrome.contact?.whatsapp || "";

  const primaryHref = resolveCtaHref(content.cta, whatsappRaw, brandLabel);
  const secondaryLabel = content.secondaryCta?.label?.trim() || "";
  const secondaryHref = secondaryLabel
    ? resolveCtaHref(content.secondaryCta, whatsappRaw, brandLabel)
    : "";

  const primaryIsExternal = Boolean(primaryHref && /^https?:\/\//i.test(primaryHref));
  const secondaryIsExternal = Boolean(secondaryHref && /^https?:\/\//i.test(secondaryHref));

  const buttonBase =
    "inline-flex items-center justify-center px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] transition";

  return (
    <section
      className="border-t"
      style={
        {
          backgroundColor,
          color: textColor,
          borderColor: "color-mix(in srgb, currentColor 12%, transparent)",
          fontFamily: `var(${font.sansVar})`,
          "--store-final-display": `var(${font.displayVar})`,
          "--store-final-muted": `color-mix(in srgb, ${textColor} 58%, transparent)`,
        } as CSSProperties
      }
    >
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:py-32">
        <h2
          className="text-3xl font-semibold tracking-tight sm:text-5xl"
          style={{ fontFamily: "var(--store-final-display)" }}
        >
          {content.title}
        </h2>
        {content.subtitle ? (
          <p className="mt-5 text-lg" style={{ color: "var(--store-final-muted)" }}>
            {content.subtitle}
          </p>
        ) : null}
        {content.urgency ? (
          <p className="mt-3 text-sm font-semibold tracking-wide">{content.urgency}</p>
        ) : null}

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {content.cta.label && primaryHref ? (
            primaryIsExternal ? (
              <a
                href={primaryHref}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonBase}
                style={{ backgroundColor: textColor, color: backgroundColor }}
              >
                {content.cta.label} →
              </a>
            ) : (
              <Link
                href={primaryHref}
                className={buttonBase}
                style={{ backgroundColor: textColor, color: backgroundColor }}
              >
                {content.cta.label} →
              </Link>
            )
          ) : null}

          {secondaryLabel && secondaryHref ? (
            secondaryIsExternal ? (
              <a
                href={secondaryHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonBase} border`}
                style={{
                  borderColor: "color-mix(in srgb, currentColor 35%, transparent)",
                  color: textColor,
                }}
              >
                {secondaryLabel}
              </a>
            ) : (
              <Link
                href={secondaryHref}
                className={`${buttonBase} border`}
                style={{
                  borderColor: "color-mix(in srgb, currentColor 35%, transparent)",
                  color: textColor,
                }}
              >
                {secondaryLabel}
              </Link>
            )
          ) : null}
        </div>
      </div>
    </section>
  );
}
