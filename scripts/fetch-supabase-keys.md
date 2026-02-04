# Fetch Supabase API Keys

To get your Supabase API keys:

1. Go to https://supabase.com/dashboard/project/esndugjwgubxetjxqwgs
2. Navigate to **Settings** → **API**
3. Copy the following:
   - **Project URL**: Already set in `.env.local` as `https://esndugjwgubxetjxqwgs.supabase.co`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

4. Update `.env.local` with these keys
5. Restart your dev server


