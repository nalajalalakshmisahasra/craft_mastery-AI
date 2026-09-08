import { NativeModules, Platform } from 'react-native';
import { AuthAdapter } from './auth';

// NOTE: auth.ts imports ApiAdapter and api.ts imports AuthAdapter — a
// deliberate cycle. Both are dereferenced only inside functions after all
// modules finish initializing, which Metro/Babel handle safely.
// The API layer never touches @react-native-firebase/* directly: the active
// auth provider (DevAuthProvider or NativeFirebaseProvider) supplies the
// bearer token, so no native Firebase module is evaluated in Expo Go.

/**
 * Mobile Native API Adapter
 * Connects to the Craft Mastery Express API backend.
 * Uses /api/v1/* which server.ts transparently handles.
 */

const DEFAULT_TIMEOUT_MS = 8000;
const AI_TIMEOUT_MS = 15000;
const GET_CACHE_TTL_MS = 30_000;

/** GET endpoints that are safe to cache briefly (collection data). */
const CACHEABLE_GETS = new Set(['/products', '/inquiries']);

interface RequestOptions extends RequestInit {
  /** Per-request timeout in ms (defaults to DEFAULT_TIMEOUT_MS). */
  timeoutMs?: number;
  /** Bypass the short GET cache (used by pull-to-refresh / post-mutation refreshes). */
  forceRefresh?: boolean;
}

interface CacheEntry {
  expiresAt: number;
  value: unknown;
}

const getCache = new Map<string, CacheEntry>();

/**
 * Derive the development machine's LAN host from the Metro bundle URL.
 *
 * In Expo Go (development) the JS bundle is served from the dev computer,
 * e.g. http://192.168.29.92:8083/index.bundle?... — so the URL host is the
 * computer's LAN IP. This lets a physical phone reach the backend on the
 * same Wi-Fi with zero environment configuration, and it stays correct when
 * the LAN IP changes.
 *
 * Returns null outside development (bundled production builds load from
 * file:// or assets://), where EXPO_PUBLIC_API_BASE_URL must be used.
 */
function getDevHostFromScriptUrl(): string | null {
  try {
    const scriptURL = (NativeModules as any).SourceCode?.scriptURL;
    if (typeof scriptURL !== 'string') return null;
    const match = /^https?:\/\/([^/:]+)/.exec(scriptURL);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Base URL priority:
 *   1. EXPO_PUBLIC_API_BASE_URL env override (explicit, highest priority)
 *   2. Development LAN host derived from the Metro/script URL (physical devices)
 *   3. Emulator / simulator loopback defaults (last resort only)
 */
function getDefaultApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  const devHost = getDevHostFromScriptUrl();
  if (devHost) {
    return `http://${devHost}:3000/api/v1`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000/api/v1' : 'http://localhost:3000/api/v1';
}

export const API_BASE_URL = getDefaultApiBaseUrl();

export interface PricingRecommendationResponse {
  suggestedPriceMin: number;
  suggestedPriceMax: number;
  recommendedPrice: number;
  pricingReason: string;
}

/** A mutation invalidates its related cached GET collection so refreshes are never stale. */
function invalidateGetCache(endpoint: string): void {
  if (endpoint.startsWith('/products')) getCache.delete('GET:/products');
  if (endpoint.startsWith('/inquiries')) getCache.delete('GET:/inquiries');
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, forceRefresh = false, ...init } = options;
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const method = init.method || 'GET';

  // Short-lived GET dedup/cache for collection data (products, inquiries).
  const cacheKey = `${method}:${endpoint}`;
  if (method === 'GET' && !forceRefresh && CACHEABLE_GETS.has(endpoint)) {
    const cached = getCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };
  // Provider-aware bearer token: DevAuthProvider → gated dev token;
  // NativeFirebaseProvider → fresh Firebase ID token. Never touches native
  // Firebase modules from here, so Expo Go cannot hit RNFBNativeEventEmitter.
  const token = await AuthAdapter.getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error [${response.status}] ${response.statusText}: ${errorText}`);
    }

    const json = (await response.json()) as T;

    if (method === 'GET' && CACHEABLE_GETS.has(endpoint)) {
      getCache.set(cacheKey, { expiresAt: Date.now() + GET_CACHE_TTL_MS, value: json });
    }
    return json;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(
        `Request timed out after ${timeoutMs}ms — could not reach the API at ${API_BASE_URL}. ` +
          `Is the Craft Mastery backend running and reachable on this network?`
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const ApiAdapter = {
  // System Health
  async checkHealth(): Promise<{ status: string; service: string; hasGeminiKey: boolean }> {
    return request('/health');
  },

  async getServicesStatus(): Promise<any> {
    return request('/services/status');
  },

  // Products
  async getProducts(forceRefresh = false): Promise<any[]> {
    const data = await request<any>('/products', { forceRefresh });
    return Array.isArray(data) ? data : data?.products || [];
  },

  async createProduct(product: any): Promise<any> {
    return request('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  // Inquiries & Messages
  async getInquiries(forceRefresh = false): Promise<any[]> {
    const data = await request<any>('/inquiries', { forceRefresh });
    return Array.isArray(data) ? data : data?.inquiries || [];
  },

  async createInquiry(inquiry: any): Promise<any> {
    return request('/inquiries', {
      method: 'POST',
      body: JSON.stringify(inquiry),
    });
  },

  async replyToInquiry(inquiryId: string, replyData: {
    senderRole: string;
    senderName: string;
    originalText: string;
    originalLang: string;
  }): Promise<any> {
    return request(`/inquiries/${inquiryId}/reply`, {
      method: 'POST',
      body: JSON.stringify(replyData),
    });
  },

  // Users & Profiles
  async getUser(phone: string): Promise<any> {
    return request(`/users/${phone}`);
  },

  async saveUser(userData: any): Promise<any> {
    return request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // AI Services (longer timeout — LLM calls can legitimately take >8s)
  async extractCraftInfo(transcript: string, language: string, conversationHistory: any[] = []): Promise<any> {
    return request('/ai/extract-info', {
      method: 'POST',
      timeoutMs: AI_TIMEOUT_MS,
      body: JSON.stringify({ transcript, language, conversationHistory }),
    });
  },

  async generateDescription(productData: any, artisanLanguage: string, targetLanguage: string): Promise<any> {
    return request('/ai/generate-description', {
      method: 'POST',
      timeoutMs: AI_TIMEOUT_MS,
      body: JSON.stringify({ productData, artisanLanguage, targetLanguage }),
    });
  },

  async getPricingRecommendation(productData: any, language: string): Promise<PricingRecommendationResponse> {
    return request('/ai/pricing-recommendation', {
      method: 'POST',
      timeoutMs: AI_TIMEOUT_MS,
      body: JSON.stringify({ productData, language }),
    });
  },

  async translateText(text: string, fromLang: string, toLang: string): Promise<{ translatedText: string; fromLang: string; toLang: string }> {
    return request('/ai/translate', {
      method: 'POST',
      timeoutMs: AI_TIMEOUT_MS,
      body: JSON.stringify({ text, fromLang, toLang }),
    });
  },

  async customerSearch(query: string, language: string): Promise<any> {
    return request('/ai/customer-search', {
      method: 'POST',
      timeoutMs: AI_TIMEOUT_MS,
      body: JSON.stringify({ query, language }),
    });
  },

  async getOrderGuidance(question: string, product: any, language: string): Promise<any> {
    return request('/ai/order-guidance', {
      method: 'POST',
      timeoutMs: AI_TIMEOUT_MS,
      body: JSON.stringify({ question, product, language }),
    });
  },
};