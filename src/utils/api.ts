import { auth } from '../firebase';

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const user = auth.currentUser;
  let token = user ? await user.getIdToken() : null;

  if (!token && typeof window !== 'undefined') {
    try {
      const savedAuth = localStorage.getItem('craft_mastery_auth');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        const cleanPhone = String(parsed?.phone || '').replace(/\D/g, '').slice(-10);
        if (cleanPhone) {
          const role = parsed?.role === 'ARTISAN' ? 'ARTISAN' : 'CUSTOMER';
          token = `dev:${cleanPhone}:${role}`;
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  const headers = new Headers(init.headers);
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
