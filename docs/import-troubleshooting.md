# Import Troubleshooting Guide

## "Invalid API key" Error

This error means the service role key doesn't match your project. Here's how to fix it:

### Step 1: Verify Your New Project Credentials

1. **Go to your NEW Supabase project dashboard**
   - Make sure you're logged into the NEW account (not the old blocked one)
   - URL should be: `https://supabase.com/dashboard/project/[NEW-PROJECT-ID]`

2. **Get the correct values:**
   - **Project URL**: Settings → API → Project URL
     - Should look like: `https://[NEW-PROJECT-ID].supabase.co`
   - **Service Role Key**: Settings → API → Service Role Key (⚠️ NOT the anon key!)
     - Should start with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
     - It's the long key, usually shown with a "Reveal" button

### Step 2: Update the Import Script

Edit `scripts/import-database.js` and update these lines:

```javascript
const NEW_PROJECT_URL = 'https://[YOUR-NEW-PROJECT-ID].supabase.co';
const NEW_SERVICE_ROLE_KEY = 'your_service_role_key_here';
```

**Important:** 
- Make sure the URL and key are from the SAME project
- Use the SERVICE ROLE KEY, not the anon key
- The project ID in the URL should match the project ID in the JWT token

### Step 3: Run Migrations First

Before importing data, you MUST run all migrations in your new project:

1. Go to your NEW Supabase project → SQL Editor
2. Run each migration file in order:
   - `001_initial_schema.sql`
   - `002_sample_data.sql` (optional - skip if you want to import your own data)
   - `003_fix_rls_recursion.sql`
   - `004_fix_policies_idempotent.sql`
   - `005_location_services.sql`
   - `006_location_based_roles.sql`
   - `007_custom_roles.sql`
   - `008_permissions.sql`

3. Or use the migration script:
   ```bash
   npm run db:migrate
   ```

### Step 4: Verify Tables Exist

After running migrations, verify tables exist:
- Go to Table Editor in Supabase
- You should see: `roles`, `permissions`, `locations`, `services`, etc.

### Step 5: Run Import Again

```bash
npm run db:import
```

## Common Mistakes

1. **Using old project credentials** - Make sure URL and key are from the NEW project
2. **Using anon key instead of service role key** - Service role key is required
3. **URL and key don't match** - They must be from the same project
4. **Migrations not run** - Tables must exist before importing data
5. **Copy-paste errors** - Make sure there are no extra spaces or quotes

## How to Verify Your Credentials

The service role key is a JWT token. You can decode it (just the header/payload, not the signature) to verify:

1. Go to [jwt.io](https://jwt.io)
2. Paste your service role key
3. Check the `ref` field - it should match your project ID in the URL

Example:
- URL: `https://txjoamolqaltmvczetcp.supabase.co`
- JWT `ref` field should be: `txjoamolqaltmvczetcp`

If they don't match, you're using credentials from different projects!

