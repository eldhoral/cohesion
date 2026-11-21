import { en } from './en.ts';
import { id } from './id.ts';

export const locales = ['en', 'id'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export type Dict = typeof en;
const dicts: Record<Locale, Dict> = { en, id: id as Dict };

export function t(lang: Locale): Dict {
  return dicts[lang];
}

/** path starts and ends with "/". English is unprefixed, Indonesian lives under /id. */
export function localePath(lang: Locale, path: string): string {
  return lang === defaultLocale ? path : `/${lang}${path}`;
}

export function pathLocale(pathname: string): Locale {
  return pathname === '/id' || pathname.startsWith('/id/') ? 'id' : 'en';
}

export function stripLocale(pathname: string): string {
  return pathLocale(pathname) === 'id' ? pathname.slice(3) || '/' : pathname;
}

export function altLocalePath(pathname: string): { lang: Locale; href: string } {
  const lang: Locale = pathLocale(pathname) === 'en' ? 'id' : 'en';
  return { lang, href: localePath(lang, stripLocale(pathname)) };
}
