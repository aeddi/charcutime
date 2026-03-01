import { addMessages, init, getLocaleFromNavigator } from 'svelte-i18n'
import en from './en.json'
import fr from './fr.json'
import it from './it.json'
import es from './es.json'
import de from './de.json'

export const SUPPORTED_LOCALES = ['en', 'fr', 'it', 'es', 'de'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'English',
  fr: 'Français',
  it: 'Italiano',
  es: 'Español',
  de: 'Deutsch',
}

addMessages('en', en)
addMessages('fr', fr)
addMessages('it', it)
addMessages('es', es)
addMessages('de', de)

/** Resolve the best supported locale from navigator or a stored preference. */
export function resolveLocale(stored: string | null): SupportedLocale {
  const candidates = stored
    ? [stored]
    : (navigator.languages ?? [navigator.language])

  for (const lang of candidates) {
    const code = lang.split('-')[0].toLowerCase() as SupportedLocale
    if (SUPPORTED_LOCALES.includes(code)) return code
  }
  return 'en'
}

export function setupI18n(locale: SupportedLocale) {
  init({
    fallbackLocale: 'en',
    initialLocale: locale,
  })
}
