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
  if (process.env.NODE_ENV === 'production' || process.env.DEV_AUTH_ENABLED !== 'true') return null;
  const match = /^dev:([0-9]{10})$/.exec(token);
  if (!match) return null;
  const account = DEV_ACCOUNTS[match[1]];
  if (!account) return null;
  return { uid: `dev-uid-${match[1]}`, phone: match[1], role: account.role };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  const developmentIdentity = getDevelopmentIdentity(token);
  if (developmentIdentity) {
    req.auth = developmentIdentity;
    return next();
  }

  try {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(token);
    const role = isRole(decoded.role) ? decoded.role : 'CUSTOMER';
    const phone = normalizePhone(decoded.phone_number);
    if (!phone) return res.status(403).json({ error: 'A verified phone number is required' });
    req.auth = { uid: decoded.uid, phone, role };
    return next();
  } catch (error) {
    console.warn('[Auth] Token verification failed:', error instanceof Error ? error.message : error);
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
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
