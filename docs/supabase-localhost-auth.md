# Supabase Auth — Localhost + Production

If you sign in on **localhost** but land on **https://booking.riamsportsarena.com**, Supabase rejected the localhost callback and used the **Site URL** (production) instead.

## Fix (one-time in Supabase Dashboard)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **URL Configuration**

2. **Redirect URLs** — add **all** of these:

   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/api/auth/callback
   https://booking.riamsportsarena.com/auth/callback
   https://booking.riamsportsarena.com/api/auth/callback
   ```

   For Netlify deploy previews, add each preview URL you test (or a wildcard if your plan supports it):

   ```
   https://YOUR-PREVIEW--riamsports.netlify.app/auth/callback
   https://YOUR-PREVIEW--riamsports.netlify.app/api/auth/callback
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

4. Save, clear site cookies (or use incognito), then try sign-in again.

## How our app works

- Google sign-in runs **in the browser** (`Continue with Google` button).
- PKCE verifier is stored in cookies on the **same origin** where you clicked sign-in.
- Callback is `{origin}/auth/callback` (legacy `/api/auth/callback` forwards there).
- After the code exchange, `/api/auth/finish-login` sends you to your booking page or profile setup.
- Return path (e.g. `/book/location/service`) is stored in the `auth_redirect` cookie and sessionStorage.

## Verify

After clicking "Continue with Google", the browser should go to Google, then return to the **same host** you started on (localhost, production, or Netlify preview) — not a different domain.
