/**
 * Normalize a phone number for identity matching: strips everything but
 * digits and keeps the last 10 (Indian mobile numbers, with or without a
 * +91 country prefix or spacing, all normalize to the same 10 digits).
 */
export function normalizePhone(phone?: string | null): string {
  return (phone || '').replace(/\D/g, '').slice(-10);
}