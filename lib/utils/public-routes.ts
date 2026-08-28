/**
 * Route classification for customer-facing access control.
 * Guests may browse booking pages; auth is required only for account/booking management.
 */

const PUBLIC_EXACT = new Set([
  '/',
  '/terms',
  '/privacy',
  '/refund-policy',
  '/login',
  '/admin/login',
  '/staff/login',
]);

/** Routes anyone can visit without signing in */
export function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  if (pathname.startsWith('/api/auth')) return true;
  if (pathname === '/book' || pathname.startsWith('/book/')) return true;
  return false;
}

/** Customer routes that require a signed-in user */
export function isCustomerAuthRequiredRoute(pathname: string): boolean {
  if (pathname === '/complete-profile') return true;
  if (pathname === '/profile' || pathname.startsWith('/profile/')) return true;
  if (pathname === '/bookings' || pathname.startsWith('/bookings/')) return true;
  return false;
}

export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

export function isStaffRoute(pathname: string): boolean {
  return pathname.startsWith('/staff');
}

export function safeRedirectPath(path: string | null | undefined): string | null {
  if (!path || typeof path !== 'string') return null;
  const trimmed = path.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  if (trimmed.startsWith('/admin') || trimmed.startsWith('/staff')) return null;
  return trimmed;
}
