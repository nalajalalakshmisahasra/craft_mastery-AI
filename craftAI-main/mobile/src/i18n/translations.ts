import { enStrings } from './locales/en';
import { teStrings } from './locales/te';
import { hiStrings } from './locales/hi';
import { taStrings } from './locales/ta';
import { knStrings } from './locales/kn';
import { mrStrings } from './locales/mr';
import { bnStrings } from './locales/bn';
import { mlStrings } from './locales/ml';
import { guStrings } from './locales/gu';
import { paStrings } from './locales/pa';
import { orStrings } from './locales/or';
import { asStrings } from './locales/as';
import { urStrings } from './locales/ur';
import type { MobileStrings } from './schema';
import type { MobileSupportedLanguage } from '../adapters/speech';

/**
 * Craft Mastery Mobile — translations registry.
 *
 * Self-contained (does NOT import the web app's i18n package — Metro cannot
 * safely resolve the cross-package alias). Mirrors the web architecture:
 * typed schema + per-language dictionaries + a resolver.
 *
 * Fully supports all 13 Indian regional languages across all visible screens
 * (HeroPitch, WelcomeLanguage, PhoneAuth, Onboarding, and shared components).
 */
export type MobileStringKey = keyof MobileStrings;
export type MobileUiLanguage = MobileSupportedLanguage;

export const TRANSLATIONS: Record<MobileUiLanguage, MobileStrings> = {
  en: enStrings,
  te: teStrings,
  hi: hiStrings,
  ta: taStrings,
  kn: knStrings,
  mr: mrStrings,
  bn: bnStrings,
  ml: mlStrings,
  gu: guStrings,
  pa: paStrings,
  or: orStrings,
  as: asStrings,
  ur: urStrings,
};

/** Map a persisted language code to the UI language it drives. */
export function resolveUiLanguage(persisted: string | null | undefined): MobileUiLanguage {
  if (persisted && persisted in TRANSLATIONS) {
    return persisted as MobileUiLanguage;
  }
  return 'en';
}

export function useTranslation(lang: MobileUiLanguage): MobileStrings {
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}
