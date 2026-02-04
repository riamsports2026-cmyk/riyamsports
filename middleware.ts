/**
 * Next.js Middleware for route protection and authentication
 * 
 * Note: The deprecation warning about "middleware" vs "proxy" is a false positive.
 * middleware.ts is the correct and standard approach for Next.js 16+.
 * This file handles:
 * - Authentication checks
 * - Route protection (admin, staff, customer)
 * - Profile completion redirects
 * - Role-based access control
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
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

  // Skip middleware for API routes (except auth routes which are already handled)
  // API routes should handle their own authentication and return JSON errors
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    return response;
  }

  // Public login routes
  if (pathname === '/login' || pathname === '/admin/login' || pathname === '/staff/login' || pathname.startsWith('/api/auth')) {
    if (user) {
      // If already logged in, redirect based on route and role
      if (pathname === '/admin/login') {
        const { isAdminOrSubAdmin } = await import('@/lib/utils/roles');
        if (await isAdminOrSubAdmin(user.id)) {
          return NextResponse.redirect(new URL('/admin', request.url));
        }
        // If not admin/sub-admin, stay on login page
        return response;
      }
      if (pathname === '/staff/login') {
        const { isStaff } = await import('@/lib/utils/roles');
        if (await isStaff(user.id)) {
          return NextResponse.redirect(new URL('/staff', request.url));
        }
        // If not staff, stay on login page
        return response;
      }
      if (pathname === '/login') {
        // Check if user is admin or sub-admin
        const { isAdminOrSubAdmin } = await import('@/lib/utils/roles');
        const isAdminOrSubAdminUser = await isAdminOrSubAdmin(user.id);
        
        if (isAdminOrSubAdminUser) {
          return NextResponse.redirect(new URL('/admin', request.url));
        }
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('mobile_number')
          .eq('id', user.id)
          .maybeSingle();

        if (!profile?.mobile_number) {
          return NextResponse.redirect(new URL('/complete-profile', request.url));
        }
        return NextResponse.redirect(new URL('/book', request.url));
      }
    }
    return response;
  }

  // Protected routes
  if (!user) {
    // Redirect to appropriate login page based on route
    let loginPath = '/login';
    if (pathname.startsWith('/admin')) {
      loginPath = '/admin/login';
    } else if (pathname.startsWith('/staff')) {
      loginPath = '/staff/login';
    }
    const redirectUrl = new URL(loginPath, request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Check profile completion
  if (pathname !== '/complete-profile') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('mobile_number')
      .eq('id', user.id)
      .single();

    if (!profile?.mobile_number) {
      return NextResponse.redirect(new URL('/complete-profile', request.url));
    }
  }

  // Admin routes protection (allow admin and sub-admins)
  if (pathname.startsWith('/admin')) {
    const { isAdminOrSubAdmin } = await import('@/lib/utils/roles');
    
    if (!(await isAdminOrSubAdmin(user.id))) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Staff routes protection (except login page)
  if (pathname.startsWith('/staff') && pathname !== '/staff/login') {
    // Use service client to check permissions (bypass RLS)
    // This matches the check in lib/actions/auth/staff.ts
    const { createServiceClient } = await import('@/lib/supabase/server');
    const serviceClient = await createServiceClient();
    
    // Check if user is admin
    const { data: adminRoles } = await serviceClient
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id);
    
    const isAdmin = adminRoles?.some((ur: any) => ur.roles?.name === 'admin');
    
    if (!isAdmin) {
      // Check if user has manage_bookings permission
      const { data: allRoles } = await serviceClient
        .from('user_roles')
        .select('role_id')
        .eq('user_id', user.id);
      
      const { data: locationRoles } = await serviceClient
        .from('user_role_locations')
        .select('role_id')
        .eq('user_id', user.id);
      
      const roleIds = [
        ...(allRoles?.map((r: any) => r.role_id) || []),
        ...(locationRoles?.map((r: any) => r.role_id) || [])
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
          if (permissionId) {
            const { data: rolePermissions } = await serviceClient
              .from('role_permissions')
              .select('role_id')
              .in('role_id', roleIds)
              .eq('permission_id', permissionId)
              .limit(1);
            
            hasStaffPermission = (rolePermissions?.length || 0) > 0;
          }
        }
      }
      
      if (!hasStaffPermission) {
        return NextResponse.redirect(new URL('/staff/login?error=no_permission', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|ico|txt)$).*)',
  ],
};

