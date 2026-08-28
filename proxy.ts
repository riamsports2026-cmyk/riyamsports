/**
 * Next.js 16 Proxy - route protection and authentication
 * (Migrated from middleware.ts per Next.js 16 convention)
 *
 * Handles:
 * - Authentication checks
 * - Route protection (admin, staff, customer account routes)
 * - Public browsing for /book (login required only at booking submit)
 * - Profile completion redirects for account routes
 * - Role-based access control
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';
import {
  isPublicRoute,
  isCustomerAuthRequiredRoute,
  isAdminRoute,
  isStaffRoute,
  safeRedirectPath,
} from '@/lib/utils/public-routes';
import {
  isDeepBookPath,
  parseAuthRedirectCookie,
  resolvePostLoginRedirect,
} from '@/lib/utils/auth-redirect';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  try {
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return response;
    }

    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request: { headers: requestHeaders },
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // OAuth code sometimes lands on /book or /login instead of /api/auth/callback
    // (e.g. Supabase Site URL mismatch). Forward to the callback handler.
    const oauthCode = request.nextUrl.searchParams.get('code');
    if (oauthCode && !pathname.startsWith('/api/auth/callback')) {
      const callbackUrl = new URL('/api/auth/callback', request.url);
      callbackUrl.searchParams.set('code', oauthCode);
      const resolvedNext = resolvePostLoginRedirect(
        request.nextUrl.searchParams.get('next'),
        parseAuthRedirectCookie(request.headers.get('cookie') ?? null),
        isDeepBookPath(pathname) ? pathname : null
      );
      if (resolvedNext) {
        callbackUrl.searchParams.set('next', resolvedNext);
      }
      return NextResponse.redirect(callbackUrl);
    }

    // API routes handle their own auth (except /api/auth)
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
      return response;
    }

    // Login pages – handle already-authenticated redirects
    if (
      pathname === '/login' ||
      pathname === '/admin/login' ||
      pathname === '/staff/login' ||
      pathname.startsWith('/api/auth')
    ) {
      if (user) {
        if (pathname === '/admin/login') {
          const { isAdminOrSubAdmin } = await import('@/lib/utils/roles');
          if (await isAdminOrSubAdmin(user.id)) {
            return NextResponse.redirect(new URL('/admin', request.url));
          }
          return response;
        }
        if (pathname === '/staff/login') {
          const { isStaff } = await import('@/lib/utils/roles');
          if (await isStaff(user.id)) {
            return NextResponse.redirect(new URL('/staff', request.url));
          }
          return response;
        }
        if (pathname === '/login') {
          const redirectParam = safeRedirectPath(
            request.nextUrl.searchParams.get('redirect')
          );

          const { isAdminOrSubAdmin } = await import('@/lib/utils/roles');
          if (await isAdminOrSubAdmin(user.id)) {
            return NextResponse.redirect(new URL('/admin', request.url));
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('mobile_number')
            .eq('id', user.id)
            .maybeSingle();

          if (!profile?.mobile_number) {
            const completeUrl = new URL('/complete-profile', request.url);
            if (redirectParam) {
              completeUrl.searchParams.set('redirect', redirectParam);
            }
            return NextResponse.redirect(completeUrl);
          }

          return NextResponse.redirect(
            new URL(redirectParam || '/book', request.url)
          );
        }
      }
      return response;
    }

    // Public browsing routes – no auth required
    if (isPublicRoute(pathname)) {
      return response;
    }

    // Admin routes
    if (isAdminRoute(pathname)) {
      if (!user) {
        const redirectUrl = new URL('/admin/login', request.url);
        if (pathname !== '/admin') {
          redirectUrl.searchParams.set('redirect', pathname);
        }
        return NextResponse.redirect(redirectUrl);
      }

      const { isAdminOrSubAdmin } = await import('@/lib/utils/roles');
      if (!(await isAdminOrSubAdmin(user.id))) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      return response;
    }

    // Staff routes (except login, handled above)
    if (isStaffRoute(pathname) && pathname !== '/staff/login') {
      if (!user) {
        const redirectUrl = new URL('/staff/login', request.url);
        redirectUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(redirectUrl);
      }

      const { createServiceClient } = await import('@/lib/supabase/server');
      const serviceClient = await createServiceClient();

      const { data: adminRoles } = await serviceClient
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id);

      const isAdmin = adminRoles?.some((ur: { roles?: { name?: string } }) => ur.roles?.name === 'admin');

      if (!isAdmin) {
        const { data: allRoles } = await serviceClient
          .from('user_roles')
          .select('role_id')
          .eq('user_id', user.id);

        const { data: locationRoles } = await serviceClient
          .from('user_role_locations')
          .select('role_id')
          .eq('user_id', user.id);

        const roleIds = [
          ...(allRoles?.map((r: { role_id: string }) => r.role_id) || []),
          ...(locationRoles?.map((r: { role_id: string }) => r.role_id) || []),
        ];

        let hasStaffPermission = false;
        if (roleIds.length > 0) {
          const { data: permission, error: permissionError } = await serviceClient
            .from('permissions')
            .select('id')
            .eq('name', 'manage_bookings')
            .maybeSingle();

          if (permission && !permissionError) {
            const permissionId = (permission as { id: string }).id;
            const { data: rolePermissions } = await serviceClient
              .from('role_permissions')
              .select('role_id')
              .in('role_id', roleIds)
              .eq('permission_id', permissionId)
              .limit(1);

            hasStaffPermission = (rolePermissions?.length || 0) > 0;
          }
        }

        if (!hasStaffPermission) {
          return NextResponse.redirect(
            new URL('/staff/login?error=no_permission', request.url)
          );
        }
      }

      return response;
    }

    // Customer account routes – require sign-in
    if (isCustomerAuthRequiredRoute(pathname)) {
      if (!user) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // Profile completion required before account/booking management routes
      if (pathname !== '/complete-profile') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('mobile_number')
          .eq('id', user.id)
          .maybeSingle();

        if (!profile?.mobile_number) {
          const completeUrl = new URL('/complete-profile', request.url);
          completeUrl.searchParams.set('redirect', pathname);
          return NextResponse.redirect(completeUrl);
        }
      }

      return response;
    }

    // Unknown routes – allow through (404 handled by Next.js)
    return response;
  } catch (err) {
    console.error('[proxy]', err);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|ico|txt)$).*)',
  ],
};
