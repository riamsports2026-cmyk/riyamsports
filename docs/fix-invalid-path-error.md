# Fix "requested path is invalid" Error

## Quick Fix

This error means the redirect URL in your code doesn't match what's configured in Supabase.

### Step 1: Check Your Environment Variable

Make sure `.env.local` has:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 2: Add Redirect URL in Supabase

1. Go to: https://supabase.com/dashboard/project/txjoamolqaltmvczetcp/auth/url-configuration

2. Under **Redirect URLs**, add:
   ```
   http://localhost:3000/api/auth/callback
   ```

3. **Site URL** should be:
   ```
   http://localhost:3000
   ```

4. Click **Save**

### Step 3: Verify the URL Matches

The redirect URL in your code (`lib/actions/auth.ts`) is:
```typescript
redirectTo: `${env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
```

This becomes: `http://localhost:3000/api/auth/callback`

**This EXACT URL must be in Supabase's Redirect URLs list!**

### Common Mistakes

❌ **Wrong:**
- `http://localhost:3000/api/auth/callback/` (trailing slash)
- `http://localhost:3000/auth/callback` (missing `/api`)
- `localhost:3000/api/auth/callback` (missing `http://`)

✅ **Correct:**
- `http://localhost:3000/api/auth/callback`

### For Production

When deploying, add your production URL:
```
https://yourdomain.com/api/auth/callback
```

And update `NEXT_PUBLIC_APP_URL` in your production environment.

