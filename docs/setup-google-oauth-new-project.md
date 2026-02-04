# Setting Up Google OAuth for Your New Supabase Project

## Quick Setup Guide

### Your New Project Details
- **Project ID**: `txjoamolqaltmvczetcp`
- **Project URL**: `https://txjoamolqaltmvczetcp.supabase.co`
- **Dashboard**: https://supabase.com/dashboard/project/txjoamolqaltmvczetcp

## Step 1: Create Google OAuth Credentials

### Option A: Use Existing Google Cloud Project (If Available)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure OAuth consent screen first:
   - User Type: **External** (for development) or **Internal** (for organization)
   - App name, support email, developer contact
   - Click **Save and Continue**
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (if in testing mode)
   - Click **Save and Continue**
6. Create OAuth Client:
   - Application type: **Web application**
   - Name: "RIAM Sports Booking" (or your app name)
   - **Authorized redirect URIs**: Add:
     ```
     https://txjoamolqaltmvczetcp.supabase.co/auth/v1/callback
     ```
   - Click **Create**
7. **Copy the Client ID and Client Secret** (you'll need these next)

### Option B: Create New Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Create Project**
3. Enter project name (e.g., "RIAM Sports OAuth")
4. Click **Create**
5. Follow steps 3-7 from Option A above

## Step 2: Configure Google OAuth in Supabase

1. Go to your Supabase Dashboard:
   - https://supabase.com/dashboard/project/txjoamolqaltmvczetcp/auth/providers

2. Find **Google** in the providers list

3. Toggle it to **Enabled**

4. Enter your OAuth credentials:
   - **Client ID (for OAuth)**: Paste the Client ID from Google Cloud Console
   - **Client Secret (for OAuth)**: Paste the Client Secret from Google Cloud Console

5. Click **Save**

## Step 3: Add Redirect URLs in Supabase ⚠️ CRITICAL

**This step is REQUIRED!** Without it, you'll get "requested path is invalid" error.

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**

2. Under **Redirect URLs**, add:
   ```
   http://localhost:3000/api/auth/callback
   ```
   **Important:** 
   - The URL must match EXACTLY what's in your code
   - No trailing slashes
   - Include the full path: `/api/auth/callback`
   - For production, also add: `https://yourdomain.com/api/auth/callback`

3. **Site URL** should be set to:
   ```
   http://localhost:3000
   ```
   (or your production URL)

4. Click **Save**

**If you get "requested path is invalid" error:**
- Double-check the redirect URL is added exactly as shown above
- Make sure there are no extra spaces or characters
- Verify your `NEXT_PUBLIC_APP_URL` environment variable matches

## Step 4: Test Google OAuth

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Go to: http://localhost:3000/login

3. Click **"Continue with Google"**

4. You should be redirected to Google for authentication

5. After signing in, you should be redirected back to your app

## Troubleshooting

### "Access blocked: Authorization Error"
- Your OAuth app is in **Testing** mode
- **Quick fix**: Add your email to test users in Google Cloud Console
  - Go to [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
  - Scroll to "Test users"
  - Click "+ ADD USERS"
  - Add your email address
  - Save

### "Invalid redirect URI"
- Make sure the redirect URI in Google Cloud Console **exactly** matches:
  ```
  https://txjoamolqaltmvczetcp.supabase.co/auth/v1/callback
  ```
- No trailing slashes, no extra characters
- Check both Google Console and Supabase settings

### "Provider is not enabled"
- Make sure Google provider is toggled **ON** in Supabase
- Go to: Authentication → Providers → Google → Toggle Enabled

### "Invalid client"
- Verify your Client ID and Client Secret are correct
- Make sure you copied the full keys (they're long)
- Check that you're using the keys from the correct Google Cloud project

## Important Notes

- **Service Role Key vs Anon Key**: For OAuth, Supabase uses the anon key automatically. You don't need to configure it.
- **Environment Variables**: Make sure your `.env.local` has the correct Supabase URL and keys:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://txjoamolqaltmvczetcp.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
  ```
- **Production**: When deploying, make sure to:
  1. Add your production domain to Supabase redirect URLs
  2. Add your production domain to Google OAuth authorized redirect URIs
  3. Update `NEXT_PUBLIC_APP_URL` in your production environment

## Next Steps

After Google OAuth is working:
1. Test the complete login flow
2. Verify user profiles are created correctly
3. Test role assignments (if you have admin access)
4. Set up your production domain redirect URLs

