import * as Speech from 'expo-speech';

/**
 * Mobile Native Speech Adapter
 * Replaces browser window.speechSynthesis with expo-speech.
 * Fully supports 13 Indian regional languages with BCP-47 codes and phonetic fallbacks.
 */

export type MobileSupportedLanguage = 
  | 'te' | 'hi' | 'en' | 'ta' | 'kn' | 'mr' | 'bn' | 'ml' | 'gu' | 'pa' | 'or' | 'as' | 'ur';

export const LANGUAGE_LOCALE_MAP: Record<MobileSupportedLanguage, { primary: string; fallback: string }> = {
  en: { primary: 'en-IN', fallback: 'en-US' },
  te: { primary: 'te-IN', fallback: 'hi-IN' },
  hi: { primary: 'hi-IN', fallback: 'en-IN' },
  ta: { primary: 'ta-IN', fallback: 'hi-IN' },
  kn: { primary: 'kn-IN', fallback: 'te-IN' },
  mr: { primary: 'mr-IN', fallback: 'hi-IN' },
  bn: { primary: 'bn-IN', fallback: 'hi-IN' },
  ml: { primary: 'ml-IN', fallback: 'ta-IN' },
  gu: { primary: 'gu-IN', fallback: 'hi-IN' },
  pa: { primary: 'pa-IN', fallback: 'hi-IN' },
  or: { primary: 'or-IN', fallback: 'hi-IN' },
  as: { primary: 'as-IN', fallback: 'bn-IN' },
  ur: { primary: 'ur-IN', fallback: 'hi-IN' },
};

export const SpeechAdapter = {
  /**
   * Speak text using native Text-To-Speech engine
   */
  async speak(
    text: string,
    lang: MobileSupportedLanguage,
    onDone?: () => void
  ): Promise<void> {
    try {
      if (!text || !text.trim()) {
        onDone?.();
        return;
      }

      // Stop any current speech
      await Speech.stop();

      const localeConfig = LANGUAGE_LOCALE_MAP[lang] || LANGUAGE_LOCALE_MAP.en;

      Speech.speak(text, {
        language: localeConfig.primary,
        pitch: 1.0,
        rate: 0.95,
        onDone: () => onDone?.(),
        onError: (err) => {
          console.warn(`[SpeechAdapter] Primary voice (${localeConfig.primary}) failed, falling back:`, err);
          // Fallback to secondary locale
          Speech.speak(text, {
            language: localeConfig.fallback,
            pitch: 1.0,
            rate: 0.9,
            onDone: () => onDone?.(),
          });
        },
      });
    } catch (err) {
      console.warn('[SpeechAdapter] Failed to speak:', err);
      onDone?.();
    }
  },

  /**
   * Stop active speech synthesis
   */
  async stop(): Promise<void> {
    try {
      await Speech.stop();
    } catch (err) {
      console.warn('[SpeechAdapter] Failed to stop speech:', err);
    }
  },

  /**
   * Check if speech is currently speaking
   */
  async isSpeaking(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAsync();
    } catch {
      return false;
    }
  },
};
