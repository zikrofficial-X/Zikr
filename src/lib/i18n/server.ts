import "server-only";

import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  getLocaleDirection,
  isLocale,
  localeMeta,
  type Locale,
} from "@/lib/i18n";

export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value ?? null;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getRequestLocaleContext() {
  const locale = await getRequestLocale();
  return {
    locale,
    dir: getLocaleDirection(locale),
    lang: localeMeta[locale].lang,
    htmlLocale: localeMeta[locale].htmlLocale,
  };
}
