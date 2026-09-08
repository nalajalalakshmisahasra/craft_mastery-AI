import { enStrings } from './en';
import type { MobileStrings } from '../schema';

/**
 * Creates a complete MobileStrings dictionary for a language by merging its
 * authentic translated strings on top of enStrings. This ensures:
 * 1. 100% type-safe adherence to MobileStrings.
 * 2. Translated visible text appears for all supported screens.
 * 3. Any un-translated keys cleanly fall back to English without crashing.
 */
export function createLocale(translations: Partial<MobileStrings>): MobileStrings {
  return {
    ...enStrings,
    ...translations,
  };
}
