import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales, type Locale } from "./config";

export const LOCALE_COOKIE = "gloford_locale";

function detectFromAcceptLanguage(acceptLang: string | null): Locale {
  if (!acceptLang) return defaultLocale;
  for (const part of acceptLang.split(",")) {
    const tag = part.split(";")[0]?.trim().toLowerCase() ?? "";
    if (tag.startsWith("ar")) return "ar";
    if (tag.startsWith("fr")) return "fr";
    if (tag.startsWith("sw") || tag.startsWith("sw-")) return "sw";
    if (tag.startsWith("en")) return "en";
  }
  return defaultLocale;
}

export default getRequestConfig(async () => {
  const store = await cookies();
  const fromCookie = store.get(LOCALE_COOKIE)?.value as Locale | undefined;

  let locale: Locale;
  if (fromCookie && locales.includes(fromCookie)) {
    locale = fromCookie;
  } else {
    const h = await headers();
    locale = detectFromAcceptLanguage(h.get("accept-language"));
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
