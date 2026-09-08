import { StorageAdapter, StoredAuthSession } from './storage';
import { ApiAdapter } from './api';
import type { ConfirmationResult } from '@react-native-firebase/auth';

/**
 * NATIVE FIREBASE ISOLATION — Expo Go startup crash fix
 * -----------------------------------------------------
 * `@react-native-firebase/*` requires native TurboModules that exist only in an
 * Expo development build / bare React Native app — NOT in Expo Go. Evaluating
 * its JS at module scope throws during startup (the RNFBNativeEventEmitter →
 * getReactNativeModule → NativeRNFBTurboApp-null crash), because the module's
 * internal event emitter runs `new RNFBNativeEventEmitter()` at import time.
 *
 * Therefore the native module is NEVER imported at module scope here. It is
 * loaded lazily inside NativeFirebaseProvider methods: Metro still *bundles*
 * it into the JS graph, but the module is only *evaluated* when a native auth
 * call is actually made. In Expo Go (EXPO_PUBLIC_DEV_AUTH_ENABLED=true) the
 * DevAuthProvider is selected and no code path ever evaluates the native
 * module, so the crash cannot occur. In a native build the NativeFirebaseProvider
 * is selected and real Firebase Phone Auth works exactly as before.
 */

/** Type-only view of the native module — erased at build time, never required eagerly. */
type FirebaseAuthModule = typeof import('@react-native-firebase/auth');

let firebaseAuthModule: FirebaseAuthModule | null = null;

/** Lazily require the native auth module (bundled by Metro, evaluated on first use only). */
function loadFirebaseAuth(): FirebaseAuthModule {
  if (!firebaseAuthModule) {
    firebaseAuthModule = require('@react-native-firebase/auth') as FirebaseAuthModule;
  }
  return firebaseAuthModule;
}

/**
 * Mobile Authentication Adapter Architecture
 * 
 * ARCHITECTURE CONTRACT:
 * - Decouples UI screens from the underlying authentication provider.
 * - Development/demo accounts are isolated behind DEV_MODE flags.
 * - Designed so a production Native Firebase Phone Auth provider (e.g. @react-native-firebase/auth)
 *   can be plugged in without modifying UI screens or navigation.
 */

export interface AuthUser {
  uid: string;
  phone: string;
  name: string;
  role: 'ARTISAN' | 'CUSTOMER' | 'ADMIN';
  completedOnboarding: boolean;
  token?: string;
}

export interface VerificationSession {
  verificationId: string;
  phoneNumber: string;
  isDevelopmentMock: boolean;
}

/**
 * Dedicated Development Mock Accounts
 * STRICTLY for local development, navigation testing, and offline verification.
 */
export const DEV_TEST_ACCOUNTS: Record<string, { name: string; role: 'ARTISAN' | 'CUSTOMER' }> = {
  '9848012345': {
    name: 'రామయ్య ఆచారి (Ramayya Achari)',
    role: 'ARTISAN',
  },
  '9820044556': {
    name: 'విక్రమ్ శర్మ (Vikram Sharma)',
    role: 'CUSTOMER',
  },
};

export interface IAuthProvider {
  sendOtp(phone: string): Promise<VerificationSession>;
  verifyOtp(verificationId: string, otp: string, phone: string, name?: string, role?: 'ARTISAN' | 'CUSTOMER'): Promise<AuthUser>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  /**
   * Bearer token the backend API should send as `Authorization: Bearer …`.
   * DevAuthProvider → gated development token; NativeFirebaseProvider → fresh
   * Firebase ID token. The API adapter never touches native Firebase itself.
   */
  getAccessToken(): Promise<string | null>;
}

/**
 * Development Authentication Provider
 * Isolated mock provider for Expo development before native Firebase modules are linked.
 */
class DevAuthProvider implements IAuthProvider {
  async sendOtp(phone: string): Promise<VerificationSession> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    // Return an isolated verification session
    return {
      verificationId: `dev-session-${Date.now()}`,
      phoneNumber: cleanPhone,
      isDevelopmentMock: true,
    };
  }

  async verifyOtp(
    verificationId: string,
    otp: string,
    phone: string,
    name?: string,
    role: 'ARTISAN' | 'CUSTOMER' = 'ARTISAN'
  ): Promise<AuthUser> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const existing = DEV_TEST_ACCOUNTS[cleanPhone];

    const resolvedName = name || existing?.name || (role === 'ARTISAN' ? 'Artisan Maker' : 'Customer Buyer');
    const resolvedRole = existing?.role || role;

    const isOnboarded = await StorageAdapter.isOnboarded(cleanPhone);

    const user: AuthUser = {
      uid: `dev-uid-${cleanPhone}`,
      phone: cleanPhone,
      name: resolvedName,
      role: resolvedRole,
      completedOnboarding: isOnboarded,
    };

    // Persist session to AsyncStorage
    await StorageAdapter.setAuthSession({
      phone: user.phone,
      name: user.name,
      role: user.role,
      completedOnboarding: user.completedOnboarding,
      token: `dev:${user.phone}:${user.role}`,
    });

    // Sync with backend /api/users. Best-effort ONLY: never await it, so a
    // slow or unreachable API cannot delay sign-in / navigation. The local
    // session above is the source of truth for the mobile session.
    ApiAdapter.saveUser({
      phone: user.phone,
      name: user.name,
      role: user.role,
      onboardingComplete: user.completedOnboarding,
    }).catch((err) => {
      console.warn('[AuthAdapter] Backend sync note (continuing with local session):', err);
    });

    return user;
  }

  async signOut(): Promise<void> {
    await StorageAdapter.clearAuthSession();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const session = await StorageAdapter.getAuthSession();
    if (!session) return null;

    return {
      uid: `uid-${session.phone}`,
      phone: session.phone,
      name: session.name,
      role: session.role,
      completedOnboarding: session.completedOnboarding,
    };
  }

  async getAccessToken(): Promise<string | null> {
    const session = await StorageAdapter.getAuthSession();
    return session?.token ?? null;
  }
}

/**
 * Production Native Firebase Provider
 * Real Firebase Phone Authentication via @react-native-firebase/auth.
 * Only usable where the native Firebase modules actually exist (Expo
 * development build / bare React Native). The module is loaded lazily so Expo
 * Go never evaluates it; instantiating this provider alone is harmless.
 */
class NativeFirebaseProvider implements IAuthProvider {
  private readonly confirmations = new Map<string, ConfirmationResult>();

  async sendOtp(phone: string): Promise<VerificationSession> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const { getAuth, signInWithPhoneNumber } = loadFirebaseAuth();
    const confirmation = await signInWithPhoneNumber(getAuth(), `+91${cleanPhone}`);
    const verificationId = confirmation.verificationId;
    this.confirmations.set(verificationId, confirmation);
    return { verificationId, phoneNumber: cleanPhone, isDevelopmentMock: false };
  }

  async verifyOtp(
    verificationId: string,
    otp: string,
    _phone: string,
    name?: string,
  ): Promise<AuthUser> {
    const confirmation = this.confirmations.get(verificationId);
    if (!confirmation) throw new Error('OTP session not found. Please request a new code.');
    const result = await confirmation.confirm(otp);
    this.confirmations.delete(verificationId);
    const { getIdToken, getIdTokenResult } = loadFirebaseAuth();
    const firebaseUser = result.user;
    const tokenResult = await getIdTokenResult(firebaseUser, true);
    const role = tokenResult.claims.role === 'ARTISAN' || tokenResult.claims.role === 'ADMIN'
      ? tokenResult.claims.role
      : 'CUSTOMER';
    const phone = (firebaseUser.phoneNumber || '').replace(/\D/g, '').slice(-10);
    const token = await getIdToken(firebaseUser);
    const existing = await StorageAdapter.getAuthSession();
    const user: AuthUser = {
      uid: firebaseUser.uid,
      phone,
      name: firebaseUser.displayName || name || existing?.name || 'Customer Buyer',
      role,
      completedOnboarding: existing?.completedOnboarding || false,
      token,
    };
    await StorageAdapter.setAuthSession(user);
    await ApiAdapter.saveUser({ name: user.name, onboardingComplete: user.completedOnboarding });
    return user;
  }

  async signOut(): Promise<void> {
    const { getAuth, signOut: firebaseSignOut } = loadFirebaseAuth();
    await firebaseSignOut(getAuth());
    await StorageAdapter.clearAuthSession();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const { getAuth, getIdToken, getIdTokenResult } = loadFirebaseAuth();
    const firebaseUser = getAuth().currentUser;
    if (!firebaseUser) {
      await StorageAdapter.clearAuthSession();
      return null;
    }
    const tokenResult = await getIdTokenResult(firebaseUser);
    const role = tokenResult.claims.role === 'ARTISAN' || tokenResult.claims.role === 'ADMIN'
      ? tokenResult.claims.role
      : 'CUSTOMER';
    const token = await getIdToken(firebaseUser);
    const session = await StorageAdapter.getAuthSession();
    return {
      uid: firebaseUser.uid,
      phone: (firebaseUser.phoneNumber || '').replace(/\D/g, '').slice(-10),
      name: firebaseUser.displayName || session?.name || 'Customer Buyer',
      role,
      completedOnboarding: session?.completedOnboarding || false,
      token,
    };
  }

  /**
   * Bearer token for backend API calls: a fresh Firebase ID token when the
   * user is signed in, otherwise the last persisted session token.
   */
  async getAccessToken(): Promise<string | null> {
    const { getAuth, getIdToken } = loadFirebaseAuth();
    const firebaseUser = getAuth().currentUser;
    if (firebaseUser) return getIdToken(firebaseUser);
    const session = await StorageAdapter.getAuthSession();
    return session?.token ?? null;
  }
}

export const DEV_AUTH_ENABLED =
  typeof __DEV__ !== 'undefined' && __DEV__ && process.env.EXPO_PUBLIC_DEV_AUTH_ENABLED === 'true';

// Provider selection is the runtime/platform boundary:
//  - Expo Go development (EXPO_PUBLIC_DEV_AUTH_ENABLED=true, __DEV__) → DevAuthProvider.
//    No native Firebase module is ever evaluated in this mode, so the Expo Go
//    RNFBNativeEventEmitter crash cannot occur.
//  - Everything else (Expo development build / bare React Native) →
//    NativeFirebaseProvider, which lazily loads real Firebase Phone Auth on
//    first use. In production __DEV__ is false, so dev auth is never available.
export const AuthAdapter: IAuthProvider = DEV_AUTH_ENABLED
  ? new DevAuthProvider()
  : new NativeFirebaseProvider();
