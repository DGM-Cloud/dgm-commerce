"use client";

import React, { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { useStoreChrome } from "@/components/StoreChromeProvider";
import { buildWhatsAppUrl } from "@/lib/store-cms";

const WhatsAppButton: React.FC = () => {
  const chrome = useStoreChrome();
  const brandLabel = chrome.logoText?.trim() || "la tienda";
  const href = useMemo(
    () =>
      buildWhatsAppUrl(
        chrome.contact.whatsapp,
        `¡Hola! Quiero más información sobre ${brandLabel}.`,
      ),
    [chrome.contact.whatsapp, brandLabel],
  );

  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-green-500 px-4 py-3 text-white shadow-lg transition-all hover:bg-green-600"
    >
      <FontAwesomeIcon icon={faWhatsapp} size="lg" />
      <span className="font-semibold">¡Escríbenos!</span>
    </a>
  );
};

export default WhatsAppButton;
