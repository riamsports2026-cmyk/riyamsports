import { createServerClient } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import type { Database } from '@/lib/types/database';

export type RouteHandlerCookie = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

/**
 * Supabase client for Route Handlers (OAuth login/callback).
 * Collects cookies from setAll so they can be applied to redirect responses.
 * Required for PKCE — without this, "code verifier not found" errors occur in production.
 */
export function createRouteHandlerClient(
  request: NextRequest,
  cookiesToSet: RouteHandlerCookie[]
) {
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach((c) => cookiesToSet.push(c));
        },
      },
    }
  );
}

export function applyCookiesToResponse(
  response: NextResponse,
  cookiesToSet: RouteHandlerCookie[]
): void {
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
}
