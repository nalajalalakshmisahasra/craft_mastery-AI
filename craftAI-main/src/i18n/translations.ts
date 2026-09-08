import { SupportedLanguage } from '../types';
import { TranslationSchema } from './schema';
import { enTranslations } from './locales/en';
import { teTranslations } from './locales/te';
import { hiTranslations } from './locales/hi';
import { taTranslations } from './locales/ta';
import { knTranslations } from './locales/kn';
import { mrTranslations } from './locales/mr';
import { bnTranslations } from './locales/bn';
import { mlTranslations } from './locales/ml';
import { guTranslations } from './locales/gu';
import { paTranslations } from './locales/pa';
import { orTranslations } from './locales/or';
import { asTranslations } from './locales/as';
import { urTranslations } from './locales/ur';

export type { TranslationSchema } from './schema';
export {
  enTranslations,
  teTranslations,
  hiTranslations,
  taTranslations,
  knTranslations,
  mrTranslations,
  bnTranslations,
  mlTranslations,
  guTranslations,
  paTranslations,
  orTranslations,
  asTranslations,
  urTranslations,
};

export const TRANSLATIONS: Record<SupportedLanguage, TranslationSchema> = {
  en: enTranslations,
  te: teTranslations,
  hi: hiTranslations,
  ta: taTranslations,
  kn: knTranslations,
  mr: mrTranslations,
  bn: bnTranslations,
  ml: mlTranslations,
  gu: guTranslations,
  pa: paTranslations,
  or: orTranslations,
  as: asTranslations,
  ur: urTranslations,
};

export function useTranslation(lang: SupportedLanguage): TranslationSchema {
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}
