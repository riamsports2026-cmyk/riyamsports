import { createServerClient } from '@supabase/ssr';
import type { SerializeOptions } from 'cookie';
import type { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import type { Database } from '@/lib/types/database';

export type RouteHandlerCookie = {
  name: string;
  value: string;
  options?: SerializeOptions;
};

/** Supabase client for auth route handlers — collects cookies for redirect responses. */
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
    if (!options) {
      response.cookies.set(name, value);
      return;
    }
    response.cookies.set(name, value, {
      path: options.path ?? '/',
      maxAge: options.maxAge,
      expires: options.expires,
      httpOnly: options.httpOnly,
      secure: options.secure,
      sameSite: options.sameSite as 'lax' | 'strict' | 'none' | undefined,
    });
  });
}
