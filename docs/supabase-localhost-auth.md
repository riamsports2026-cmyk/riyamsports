# Supabase Auth — Localhost + Production

If you sign in on **localhost** but land on **https://booking.riamsportsarena.com**, Supabase rejected the localhost callback and used the **Site URL** (production) instead.

## Fix (one-time in Supabase Dashboard)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **URL Configuration**

2. **Redirect URLs** — add **all** of these:

   ```
   http://localhost:3000/api/auth/callback
   https://booking.riamsportsarena.com/api/auth/callback
   ```

   Optional wildcard for local dev:

   ```
   http://localhost:3000/**
   ```

3. **Site URL** — keep production for live users:

   ```
   https://booking.riamsportsarena.com
   ```

   (Do not set Site URL to localhost unless you only develop locally.)

4. Save, then restart `npm run dev` and try sign-in again in an incognito window.

## How our app works

- OAuth starts at `/api/auth/login` using the **current browser origin** (`http://localhost:3000` or production).
- Callback is always `{origin}/api/auth/callback` (no query string).
- After login, return path (e.g. `/book/location/service`) is read from the `auth_redirect` cookie.

## Verify

After clicking "Continue with Google" on localhost, the terminal should log:

```
[auth/login] OAuth redirectTo (add to Supabase Auth → Redirect URLs if missing): http://localhost:3000/api/auth/callback
```

After Google, you should stay on **localhost**, not production.
