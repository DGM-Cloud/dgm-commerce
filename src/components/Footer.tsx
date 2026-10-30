"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faInstagram, faTiktok } from "@fortawesome/free-brands-svg-icons";
import { siteContent } from "@/config/site-content";
import BrandLogo from "@/components/BrandLogo";
import { useStoreChrome } from "@/components/StoreChromeProvider";
import { buildWhatsAppUrl } from "@/lib/store-cms";

const shopLinks = [
  { href: "/products", label: "Catálogo" },
  { href: "/cart", label: "Carrito" },
  { href: "/account", label: "Mi cuenta" },
  { href: "/contact", label: "Contacto" },
];

const helpLinks = [
  { href: "/about", label: "Nosotros" },
  { href: "/faq", label: "Preguntas frecuentes" },
  { href: "/contact", label: "Contacto" },
  { href: "/terms", label: "Términos" },
];

const Footer: React.FC = () => {
  const chrome = useStoreChrome();
  const contact = chrome.contact;
  const { footer } = siteContent;
  const brandLabel = chrome.logoText?.trim() || "Tu tienda";

  const whatsappUrl = useMemo(
    () => buildWhatsAppUrl(contact.whatsapp, `Hola, quiero información sobre ${brandLabel}.`),
    [contact.whatsapp, brandLabel],
  );

  const socialLinks = useMemo(
    () =>
      [
        { href: contact.instagram, label: "Instagram", icon: faInstagram },
        { href: contact.tiktok, label: "TikTok", icon: faTiktok },
        { href: contact.facebook, label: "Facebook", icon: faFacebook },
      ].filter((item) => Boolean(item.href?.trim())),
    [contact.instagram, contact.tiktok, contact.facebook],
  );

  return (
    <footer
      className="border-t"
      style={{
        backgroundColor: "var(--store-footer-bg)",
        color: "var(--store-footer-fg)",
        borderColor: "color-mix(in srgb, var(--store-footer-fg) 12%, transparent)",
        fontFamily: "var(--store-footer-sans)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr_0.9fr_1fr] lg:gap-10">
          <div>
            <BrandLogo variant="footer" />
            {contact.blurb ? (
              <p className="mt-4 max-w-xs text-sm leading-6 text-current/60">{contact.blurb}</p>
            ) : null}
            {socialLinks.length ? (
              <div className="mt-6 flex gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border text-current/55 transition hover:text-current"
                    style={{ borderColor: "color-mix(in srgb, var(--store-footer-fg) 25%, transparent)" }}
                  >
                    <FontAwesomeIcon icon={social.icon} className="text-sm" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-current/45">{footer.shopTitle}</p>
            <ul className="mt-4 space-y-3">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-current/60 transition hover:text-current">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-current/45">{footer.helpTitle}</p>
            <ul className="mt-4 space-y-3">
              {helpLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-current/60 transition hover:text-current">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-current/45">{footer.talkTitle}</p>
            <ul className="mt-4 space-y-4 text-sm">
              {whatsappUrl ? (
                <li>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-medium text-current transition hover:text-current/80"
                  >
                    WhatsApp
                  </a>
                  {contact.whatsappNote ? (
                    <p className="mt-1 text-current/45">{contact.whatsappNote}</p>
                  ) : null}
                </li>
              ) : null}
              {contact.email ? (
                <li>
                  <a
                    href={`mailto:${contact.email}`}
                    className="block text-current/60 transition hover:text-current"
                  >
                    {contact.email}
                  </a>
                </li>
              ) : null}
              {contact.locationLabel || contact.description ? (
                <li>
                  {contact.locationLabel ? <p className="text-current/60">{contact.locationLabel}</p> : null}
                  {contact.description ? (
                    <p className="mt-1 text-current/45">{contact.description}</p>
                  ) : null}
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div
          className="mt-12 border-t pt-8 text-center"
          style={{ borderColor: "color-mix(in srgb, var(--store-footer-fg) 12%, transparent)" }}
        >
          <a
            href="https://www.dgmcloud.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex flex-col items-center gap-1 transition"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-current/40 transition group-hover:text-current/70">
              Powered by
            </span>
            <span className="text-sm font-semibold tracking-tight text-current/70 transition group-hover:text-current">
              DGM Cloud
            </span>
            <span className="mt-1 max-w-xs text-xs leading-5 text-current/40 transition group-hover:text-current/60">
              Producto de DGM Cloud · Crea tu tienda online
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
