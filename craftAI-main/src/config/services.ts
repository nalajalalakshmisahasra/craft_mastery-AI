/**
 * Application & Services Configuration
 * Safely resolves environment variables for both Client (Vite) and Server (Node/Express).
 * Implements lazy checks and graceful fallbacks to avoid module-load crashes when keys are empty.
 */

// Safe accessor for process.env (server) or import.meta.env (browser/vite)
function getEnv(key: string, fallback = ''): string {
  try {
    // 1. Check Node process.env
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
    // 2. Check Vite client import.meta.env
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const viteKey = key.startsWith('VITE_') || key.startsWith('EXPO_PUBLIC_') ? key : `VITE_${key}`;
      if ((import.meta as any).env[key]) return (import.meta as any).env[key];
      if ((import.meta as any).env[viteKey]) return (import.meta as any).env[viteKey];
    }
  } catch {
    // Return fallback safely
  }
  return fallback;
}

export const ENV_CONFIG = {
  // Cloudinary
  cloudinary: {
    cloudName: () => getEnv('CLOUDINARY_CLOUD_NAME'),
    apiKey: () => getEnv('CLOUDINARY_API_KEY'),
    apiSecret: () => getEnv('CLOUDINARY_API_SECRET'),
    isConfigured: () => Boolean(getEnv('CLOUDINARY_CLOUD_NAME') && getEnv('CLOUDINARY_API_KEY')),
  },

  // Remove Background API
  removeBackground: {
    apiKey: () =>
      getEnv('remove background_API') ||
      getEnv('REMOVE_BACKGROUND_API') ||
      getEnv('REMOVE_BG_API_KEY'),
    name: () => getEnv('remove background_name') || getEnv('REMOVE_BACKGROUND_NAME'),
    isConfigured: () =>
      Boolean(
        getEnv('remove background_API') ||
        getEnv('REMOVE_BACKGROUND_API') ||
        getEnv('REMOVE_BG_API_KEY')
      ),
  },

  // Gemini AI
  gemini: {
    apiKey: () => getEnv('GEMINI_API_KEY'),
    isConfigured: () => Boolean(getEnv('GEMINI_API_KEY')),
  },

  // Firebase
  firebase: {
    projectId: () => getEnv('FIREBASE_PROJECT_ID') || getEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
    apiKey: () => getEnv('FIREBASE_API_KEY') || getEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
    authDomain: () => getEnv('FIREBASE_AUTH_DOMAIN') || getEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    storageBucket: () => getEnv('FIREBASE_STORAGE_BUCKET') || getEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: () => getEnv('FIREBASE_MESSAGING_SENDER_ID') || getEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: () => getEnv('FIREBASE_APP_ID') || getEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
    isConfigured: () =>
      Boolean(
        getEnv('FIREBASE_PROJECT_ID') || getEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID')
      ),
  },

  // Supabase & SQL
  supabase: {
    url: () => getEnv('SUPABASE_URL'),
    publishableKey: () => getEnv('SUPABASE_PUBLISHABLE_KEY'),
    secretKey: () => getEnv('SUPABASE_SECRET_KEY'),
    databaseUrl: () => getEnv('DATABASE_URL'),
    isConfigured: () => Boolean(getEnv('SUPABASE_URL') && getEnv('SUPABASE_PUBLISHABLE_KEY')),
  },

  // Expo & API Endpoints
  endpoints: {
    apiBaseUrl: () => getEnv('EXPO_PUBLIC_API_BASE_URL', '/api'),
    aiServiceUrl: () => getEnv('EXPO_PUBLIC_AI_SERVICE_URL', 'http://localhost:8001'),
  },
};
