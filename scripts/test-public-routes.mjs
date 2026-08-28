/**
 * Lightweight scenario checks for guest browsing route rules.
 * Run: node scripts/test-public-routes.mjs
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

function isPublicRoute(pathname) {
  if (PUBLIC_EXACT.has(pathname)) return true;
  if (pathname.startsWith('/api/auth')) return true;
  if (pathname === '/book' || pathname.startsWith('/book/')) return true;
  return false;
}

function isCustomerAuthRequiredRoute(pathname) {
  if (pathname === '/complete-profile') return true;
  if (pathname === '/profile' || pathname.startsWith('/profile/')) return true;
  if (pathname === '/bookings' || pathname.startsWith('/bookings/')) return true;
  return false;
}

function safeRedirectPath(path) {
  if (!path || typeof path !== 'string') return null;
  const trimmed = path.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  if (trimmed.startsWith('/admin') || trimmed.startsWith('/staff')) return null;
  return trimmed;
}

function isDeepBookPath(path) {
  return !!path && path.startsWith('/book/');
}

function resolvePostLoginRedirect(nextParam, cookieParam, pathnameFallback) {
  const next = safeRedirectPath(nextParam);
  const cookie = safeRedirectPath(cookieParam ? decodeURIComponent(cookieParam) : null);
  const fallback = safeRedirectPath(pathnameFallback);
  const candidates = [next, cookie, fallback].filter(Boolean);
  const specificBook = candidates.find((p) => isDeepBookPath(p));
  if (specificBook) return specificBook;
  const nonGeneric = candidates.find((p) => p !== '/book' && p !== '/');
  if (nonGeneric) return nonGeneric;
  return next || cookie || fallback || '/book';
}

const tests = [
  { fn: () => isPublicRoute('/book'), expect: true, name: 'guest can browse /book' },
  { fn: () => isPublicRoute('/book/loc-id/svc-id'), expect: true, name: 'guest can browse booking page' },
  { fn: () => isPublicRoute('/bookings'), expect: false, name: '/bookings requires auth' },
  { fn: () => isPublicRoute('/profile'), expect: false, name: '/profile requires auth' },
  { fn: () => isCustomerAuthRequiredRoute('/bookings/abc/payment'), expect: true, name: 'payment page requires auth' },
  { fn: () => isCustomerAuthRequiredRoute('/book/loc/svc'), expect: false, name: 'service page does not require auth' },
  { fn: () => safeRedirectPath('/book/loc/svc') === '/book/loc/svc', expect: true, name: 'safe booking redirect' },
  { fn: () => safeRedirectPath('//evil.com') === null, expect: true, name: 'blocks protocol-relative redirect' },
  { fn: () => safeRedirectPath('/admin') === null, expect: true, name: 'blocks admin redirect from customer login' },
  {
    fn: () =>
      resolvePostLoginRedirect('/book', '/book/uuid-loc/uuid-svc') ===
      '/book/uuid-loc/uuid-svc',
    expect: true,
    name: 'prefers specific booking page over generic /book',
  },
];

let failed = 0;
for (const t of tests) {
  const result = t.fn();
  if (result !== t.expect) {
    console.error(`FAIL: ${t.name} (got ${result}, expected ${t.expect})`);
    failed++;
  } else {
    console.log(`OK: ${t.name}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}

console.log(`\nAll ${tests.length} scenario checks passed.`);
