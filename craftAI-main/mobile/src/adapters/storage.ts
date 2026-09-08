import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Mobile Storage Adapter
 * Replaces browser DOM localStorage with React Native AsyncStorage.
 * Fully asynchronous, safe, and typed.
 */

const STORAGE_KEYS = {
  LANGUAGE: 'craft_mastery_lang',
  AUTH: 'craft_mastery_auth',
  SPEECH_ENABLED: 'craft_mastery_speech_enabled',
  ONBOARDED_PREFIX: 'craft_mastery_onboarded_',
  HAS_SEEN_HERO: 'craft_mastery_has_seen_hero',
} as const;

export interface StoredAuthSession {
  role: 'ARTISAN' | 'CUSTOMER' | 'ADMIN';
  phone: string;
  name: string;
  completedOnboarding: boolean;
  token?: string;
}

export const StorageAdapter = {
  // Generic key-value operations
  async getItem<T = string>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as unknown as T;
      }
    } catch (err) {
      console.warn(`[StorageAdapter] Failed to get item for key "${key}":`, err);
      return null;
    }
  },

  async setItem<T = any>(key: string, value: T): Promise<void> {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, serialized);
    } catch (err) {
      console.warn(`[StorageAdapter] Failed to set item for key "${key}":`, err);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (err) {
      console.warn(`[StorageAdapter] Failed to remove item for key "${key}":`, err);
    }
  },

  // App-specific helpers
  async getSelectedLanguage(): Promise<string | null> {
    return this.getItem<string>(STORAGE_KEYS.LANGUAGE);
  },

  async setSelectedLanguage(langCode: string): Promise<void> {
    return this.setItem(STORAGE_KEYS.LANGUAGE, langCode);
  },

  async getAuthSession(): Promise<StoredAuthSession | null> {
    return this.getItem<StoredAuthSession>(STORAGE_KEYS.AUTH);
  },

  async setAuthSession(session: StoredAuthSession): Promise<void> {
    return this.setItem(STORAGE_KEYS.AUTH, session);
  },

  async clearAuthSession(): Promise<void> {
    return this.removeItem(STORAGE_KEYS.AUTH);
  },

  async isOnboarded(phone: string): Promise<boolean> {
    const res = await this.getItem<string>(`${STORAGE_KEYS.ONBOARDED_PREFIX}${phone}`);
    return res === 'true';
  },

  async setOnboarded(phone: string): Promise<void> {
    return this.setItem(`${STORAGE_KEYS.ONBOARDED_PREFIX}${phone}`, 'true');
  },

  async isSpeechEnabled(): Promise<boolean> {
    const val = await this.getItem<string>(STORAGE_KEYS.SPEECH_ENABLED);
    return val === null ? true : val === 'true';
  },

  async setSpeechEnabled(enabled: boolean): Promise<void> {
    return this.setItem(STORAGE_KEYS.SPEECH_ENABLED, enabled ? 'true' : 'false');
  },

  async hasSeenHero(): Promise<boolean> {
    const val = await this.getItem<string>(STORAGE_KEYS.HAS_SEEN_HERO);
    return val === 'true';
  },

  async setHasSeenHero(seen: boolean = true): Promise<void> {
    return this.setItem(STORAGE_KEYS.HAS_SEEN_HERO, seen ? 'true' : 'false');
  },
};
