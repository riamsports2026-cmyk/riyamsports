/** Routes guests may visit without signing in. */
export function isGuestPublicRoute(pathname: string): boolean {
  if (pathname === '/') return true;
  if (pathname === '/terms' || pathname === '/privacy' || pathname === '/refund-policy') {
    return true;
  }
  if (pathname === '/book' || pathname.startsWith('/book/')) return true;
  return false;
}

/** Customer account routes that require authentication. */
export function isCustomerAccountRoute(pathname: string): boolean {
  if (pathname === '/profile' || pathname.startsWith('/profile/')) return true;
  if (pathname === '/bookings' || pathname.startsWith('/bookings/')) return true;
  if (pathname === '/complete-profile') return true;
  return false;
}
