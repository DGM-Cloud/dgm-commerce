"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  defaultStoreSettings,
  defaultStoreTheme,
  normalizeStoreSettings,
  normalizeStoreTheme,
  type StoreSettings,
  type StoreTheme,
} from "@/lib/store-cms";

type StoreChromeValue = {
  theme: StoreTheme;
  settings: StoreSettings;
};

const StoreChromeContext = createContext<StoreChromeValue>({
  theme: defaultStoreTheme(),
  settings: defaultStoreSettings(),
});

export function StoreChromeProvider({
  theme,
  settings,
  children,
}: {
  theme: StoreTheme;
  settings?: StoreSettings;
  children: ReactNode;
}) {
  const resolved = useMemo(() => {
    const normalizedTheme = normalizeStoreTheme(theme);
    const normalizedSettings = normalizeStoreSettings(
      settings ?? {
        storeName: normalizedTheme.logoText,
        email: normalizedTheme.contact.email,
        whatsapp: normalizedTheme.contact.whatsapp,
        whatsappNote: normalizedTheme.contact.whatsappNote,
        instagram: normalizedTheme.contact.instagram,
        tiktok: normalizedTheme.contact.tiktok,
        facebook: normalizedTheme.contact.facebook,
        locationLabel: normalizedTheme.contact.locationLabel,
        description: normalizedTheme.contact.description,
        tagline: normalizedTheme.contact.blurb,
      },
    );

    return {
      theme: {
        ...normalizedTheme,
        contact: {
          ...normalizedTheme.contact,
          blurb: normalizedSettings.tagline,
          whatsapp: normalizedSettings.whatsapp,
          whatsappNote: normalizedSettings.whatsappNote,
          email: normalizedSettings.email,
          instagram: normalizedSettings.instagram,
          tiktok: normalizedSettings.tiktok,
          facebook: normalizedSettings.facebook,
          locationLabel: normalizedSettings.locationLabel,
          description: normalizedSettings.description,
        },
      },
      settings: normalizedSettings,
    };
  }, [theme, settings]);

  return <StoreChromeContext.Provider value={resolved}>{children}</StoreChromeContext.Provider>;
}

/** Theme / visual chrome (navbar, footer, logo, contact mirrors settings). */
export function useStoreChrome() {
  return useContext(StoreChromeContext).theme;
}

/** Business settings (name, currency, contact, locale). */
export function useStoreSettings() {
  return useContext(StoreChromeContext).settings;
}
