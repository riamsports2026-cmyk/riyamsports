# Enable Google OAuth in Supabase

## Steps to Enable Google OAuth

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/txjoamolqaltmvczetcp
   - (Or your new project URL)

2. **Open Authentication Settings**
   - Click on **Authentication** in the left sidebar
   - Click on **Providers**

3. **Enable Google Provider**
   - Find **Google** in the list of providers
   - Toggle it to **Enabled**

4. **Configure Google OAuth Credentials**
   
   You need to create OAuth credentials in Google Cloud Console:
   
   a. Go to [Google Cloud Console](https://console.cloud.google.com/)
   
   b. Create a new project or select an existing one
   
   c. Enable Google+ API:
      - Go to **APIs & Services** → **Library**
      - Search for "Google+ API" and enable it
   
   d. Create OAuth 2.0 Credentials:
      - Go to **APIs & Services** → **Credentials**
      - Click **Create Credentials** → **OAuth client ID**
      - Application type: **Web application**
      - Authorized redirect URIs: Add:
        ```
        https://txjoamolqaltmvczetcp.supabase.co/auth/v1/callback
        ```
        (Replace `txjoamolqaltmvczetcp` with your actual project ID)
      - Copy the **Client ID** and **Client Secret**
   
   e. Add credentials to Supabase:
      - In Supabase Dashboard → Authentication → Providers → Google
      - Paste your **Client ID** and **Client Secret**
      - Click **Save**

5. **Add Redirect URL**
   - In Supabase Dashboard → Authentication → URL Configuration
   - Add to **Redirect URLs**:
     ```
     http://localhost:3000/api/auth/callback
     https://booking.riamsports.com/api/auth/callback
     ```

6. **Test the Integration**
   - Go to your login page
   - Click "Continue with Google"
   - You should be redirected to Google for authentication

## Troubleshooting

- **"Provider is not enabled"**: Make sure Google provider is toggled ON in Supabase
- **"Invalid redirect URI"**: Check that the redirect URL matches exactly in both Google Console and Supabase
- **"Invalid client"**: Verify your Google OAuth credentials are correct
- **"Gmail account for OAuth project is blocked"**: If the Google account that created the OAuth project is blocked:
  1. **Check Account Status**:
     - Go to [Google Account](https://myaccount.google.com/)
     - Check for any security alerts or account restrictions
     - Verify your account if prompted
  2. **Create OAuth Project with Different Account** (Recommended):
     - Use a different Google account (work email, personal email, etc.)
     - Create a new Google Cloud project with the new account
     - Create new OAuth 2.0 credentials
     - Update the credentials in Supabase Dashboard
  3. **Transfer Project** (If possible):
     - Go to [Google Cloud Console → IAM & Admin → Settings](https://console.cloud.google.com/iam-admin/settings)
     - Transfer project ownership to a different Google account
  4. **Recover Blocked Account**:
     - Visit [Google Account Recovery](https://accounts.google.com/signin/recovery)
     - Follow the recovery process to unblock your account
- **"Supabase account also uses the same blocked email"**: If both your Google OAuth project AND Supabase account use the same blocked email:
  1. **Recover the Blocked Account** (Best option if possible):
     - Go to [Google Account Recovery](https://accounts.google.com/signin/recovery)
     - Follow the recovery process to unblock your account
     - This will restore access to both Google Cloud Console and Supabase
  2. **Create New Supabase Account** (If account recovery fails):
     - Sign up for a new Supabase account with a different email at [supabase.com](https://supabase.com)
     - Create a new project or transfer your existing project
     - **Transfer Existing Project** (if you have access):
       - Go to your current Supabase project settings
       - Transfer project ownership to the new account
       - Or export your database schema and recreate it in the new project
  3. **Create New OAuth Project**:
     - Use the same new email (or a different one) for Google Cloud Console
     - Create new OAuth 2.0 credentials
     - Update credentials in the new Supabase project
  4. **Alternative: Use Organization Account**:
     - If you have access to a work/organization email, use that for both Supabase and Google Cloud Console
     - This provides better account management and recovery options
- **"Email is blocked" / "Access blocked"**: This usually happens when:
  1. **OAuth App is in Testing Mode**: 
     - Go to [Google Cloud Console → OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
     - If "Publishing status" shows "Testing", you have two options:
       - **Option A**: Add test users (quick fix for development):
         - Scroll down to "Test users" section
         - Click "+ ADD USERS"
         - Add the email addresses that need to access the app
         - Save
       - **Option B**: Publish the app (for production):
         - Click "PUBLISH APP" button
         - Fill out the OAuth consent screen form (app name, support email, etc.)
         - Submit for verification (may take a few days for Google to review)
  2. **App Verification Required**: If you see "Unverified app" warning:
     - For development: Add your email to test users (Option A above)
     - For production: Complete OAuth consent screen and submit for verification
  3. **Account Security**: Check if your Google account has any security restrictions


