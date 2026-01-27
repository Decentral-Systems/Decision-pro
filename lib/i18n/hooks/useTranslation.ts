/**
 * Translation Hook
 * Simple i18n hook without external dependencies
 */

import { useState, useEffect } from "react";
import { getLocale, setLocale, type Locale } from "../config";

type Translations = Record<string, any>;

let translations: Record<Locale, Translations> = {
  en: {},
  am: {},
};

// Load translations
if (typeof window !== "undefined") {
  import("../locales/en.json").then((mod) => {
    translations.en = mod.default;
  });
  import("../locales/am.json").then((mod) => {
    translations.am = mod.default;
  });
}

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(getLocale());

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split(".");
    let value: any = translations[locale];

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        // Only log in development, and only once per missing key to reduce noise
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
          const logKey = `i18n_missing_${key}`;
          if (!sessionStorage.getItem(logKey)) {
            console.warn(`[i18n] Translation missing: ${key} (locale: ${locale})`);
            sessionStorage.setItem(logKey, 'true');
          }
        }
        return key;
      }
    }

    if (typeof value !== "string") {
      return key;
    }

    // Simple parameter replacement
    if (params) {
      return Object.entries(params).reduce(
        (str, [param, val]) => str.replace(`{{${param}}}`, String(val)),
        value
      );
    }

    return value;
  };

  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    setLocaleState(newLocale);
  };

  return { t, locale, changeLocale };
}

