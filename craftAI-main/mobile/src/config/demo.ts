import { normalizePhone } from '../utils/phone';

/**
 * Demo / development content isolation.
 *
 * The dev database is seeded with example records (products + inquiries from
 * src/data/mockData.ts) so the app is explorable during development. Those
 * records are NOT deleted, but "normal user mode" must not present example
 * people as real users:
 *
 *  - EXPO_PUBLIC_DEMO_DATA unset or "true"  → demo seed content is shown (dev).
 *  - EXPO_PUBLIC_DEMO_DATA="false"          → demo seed content is hidden and
 *                                             screens fall back to polished
 *                                             empty states (normal user mode).
 *
 * Identity-correct filtering (inquiries/catalog scoped to the logged-in user)
 * is ALWAYS applied, independent of this flag.
 */
export const DEMO_MODE =
  typeof __DEV__ !== 'undefined' &&
  __DEV__ &&
  process.env.EXPO_PUBLIC_DEMO_DATA === 'true';

/** Stable ids of the dev-database seed records (mockData.ts). */
const DEMO_PRODUCT_IDS = new Set([
  'prod-kondapalli-01',
  'prod-pochampally-02',
  'prod-dokra-03',
  'prod-bluepottery-04',
  'prod-channapatna-05',
  'prod-bidriware-06',
  'prod-tanjore-07',
  'prod-walnut-08',
  'prod-kalamkari-09',
  'prod-tholubommalata-10',
  'prod-pashmina-11',
  'prod-madhubani-12',
]);

const DEMO_INQUIRY_IDS = new Set(['inq-bulk-001', 'inq-bulk-002']);

export function isDemoProduct(product: any): boolean {
  return Boolean(product && DEMO_PRODUCT_IDS.has(product.id));
}

export function isDemoInquiry(inquiry: any): boolean {
  return Boolean(inquiry && DEMO_INQUIRY_IDS.has(inquiry.id));
}

export interface SessionIdentity {
  phone?: string | null;
  name?: string | null;
}

/** Does this product belong to the logged-in user (by phone and/or name)? */
export function productBelongsToUser(product: any, user: SessionIdentity | null | undefined): boolean {
  if (!user || !product) return false;
  const phone = normalizePhone(user.phone);
  if (phone && product.artisanPhone && normalizePhone(product.artisanPhone) === phone) return true;
  const uname = (user.name || '').trim();
  return Boolean(uname && (product.artisanName || '').trim() === uname);
}

/**
 * Does this inquiry belong to the logged-in user?
 *  - Customers match by inquiry.customerPhone.
 *  - Artisans match when the inquiry references one of their products
 *    (ownedProductIds) or when inquiry.artisanName equals the session name.
 */
export function inquiryBelongsToUser(
  inquiry: any,
  user: SessionIdentity | null | undefined,
  ownedProductIds?: Set<string>
): boolean {
  if (!user || !inquiry) return false;
  const phone = normalizePhone(user.phone);
  if (phone && inquiry.customerPhone && normalizePhone(inquiry.customerPhone) === phone) return true;
  if (ownedProductIds && inquiry.productId && ownedProductIds.has(inquiry.productId)) return true;
  const uname = (user.name || '').trim();
  if (!uname) return false;
  if ((inquiry.customerName || '').trim() === uname) return true;
  if ((inquiry.artisanName || '').trim() === uname) return true;
  return false;
}