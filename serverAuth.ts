import { cert, getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { NextFunction, Request, Response } from 'express';

export type UserRole = 'ARTISAN' | 'CUSTOMER' | 'ADMIN';

export interface AuthIdentity {
  uid: string;
  phone: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthIdentity;
    }
  }
}

const DEV_ACCOUNTS: Record<string, { role: Exclude<UserRole, 'ADMIN'> }> = {
  '9848012345': { role: 'ARTISAN' },
  '9820044556': { role: 'CUSTOMER' },
};

function isRole(value: unknown): value is UserRole {
  return value === 'ARTISAN' || value === 'CUSTOMER' || value === 'ADMIN';
}

function normalizePhone(value: unknown): string {
  return String(value || '').replace(/\D/g, '').slice(-10);
}

function getFirebaseAdminAuth() {
  if (getApps().length === 0) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      initializeApp({ credential: cert(serviceAccount) });
    } else {
      initializeApp({ credential: applicationDefault() });
    }
  }
  return getAuth();
}

function getBearerToken(req: Request): string | null {
  const header = req.header('authorization');
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim() || null;
}

function getDevelopmentIdentity(token: string): AuthIdentity | null {
  const isDevAllowed =
    process.env.NODE_ENV !== 'production' ||
    process.env.DEV_AUTH_ENABLED === 'true' ||
    process.env.EXPO_PUBLIC_DEV_AUTH_ENABLED === 'true' ||
    !process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!isDevAllowed) return null;

  const match = /^dev:([0-9]{10})(?::(ARTISAN|CUSTOMER|ADMIN))?$/.exec(token);
  if (!match) return null;
  const phone = match[1];
  const roleInToken = match[2] as UserRole | undefined;
  const account = DEV_ACCOUNTS[phone];
  const role: UserRole = roleInToken || account?.role || 'CUSTOMER';
  return { uid: `dev-uid-${phone}`, phone, role };
}

export async function resolveIdentity(req: Request): Promise<AuthIdentity | null> {
  const token = getBearerToken(req);
  if (!token) return null;

  const developmentIdentity = getDevelopmentIdentity(token);
  if (developmentIdentity) return developmentIdentity;

  try {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(token);
    const role = isRole(decoded.role) ? decoded.role : 'CUSTOMER';
    const phone = normalizePhone(decoded.phone_number);
    if (!phone) return null;
    return { uid: decoded.uid, phone, role };
  } catch (error) {
    console.warn('[Auth] Token verification failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const identity = await resolveIdentity(req);
  if (identity) {
    req.auth = identity;
  }
  return next();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  const identity = await resolveIdentity(req);
  if (!identity) {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }

  req.auth = identity;
  return next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    return next();
  };
}

export function samePhone(left: unknown, right: unknown): boolean {
  return normalizePhone(left) !== '' && normalizePhone(left) === normalizePhone(right);
}

export async function provisionRole(uid: string, role: Exclude<UserRole, 'ADMIN'>): Promise<void> {
  await getFirebaseAdminAuth().setCustomUserClaims(uid, { role });
}
