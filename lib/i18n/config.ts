/**
 * Internationalization Configuration
 * Simplified i18n setup without external dependencies
 */

export type Locale = "en" | "am";

export const DEFAULT_LOCALE: Locale = "en";
export const SUPPORTED_LOCALES: Locale[] = ["en", "am"];

export function getLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  
  const saved = localStorage.getItem("app_locale");
  if (saved && SUPPORTED_LOCALES.includes(saved as Locale)) {
    return saved as Locale;
  }
  
  // Try to detect from browser
  const browserLang = navigator.language.split("-")[0];
  if (browserLang === "am") return "am";
  
  return DEFAULT_LOCALE;
}

export function setLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("app_locale", locale);
  window.location.reload(); // Simple reload for locale change
}

