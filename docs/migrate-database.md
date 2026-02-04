# Database Migration Guide

This guide will help you migrate all your data from your old Supabase project to a new one.

## Prerequisites

1. **Access to Old Database** (even if account is blocked, you might have temporary access or can use service role key)
2. **New Supabase Account** - Create a new account at [supabase.com](https://supabase.com)
3. **Service Role Keys** - You'll need these from both old and new projects

## Step-by-Step Migration Process

### Step 1: Export Data from Old Database

1. **Get your old project's service role key:**
   - If you can access the old Supabase dashboard: Go to **Settings** → **API** → Copy **Service Role Key**
   - If account is blocked: Check if you have the key saved in your `.env.local` file

2. **Run the export script:**
   ```bash
   node scripts/export-database.js
   ```
   This will create a `database-export.json` file with all your data.

   **OR manually export using SQL:**

   Go to your old Supabase project → SQL Editor and run:
   ```sql
   -- See scripts/export-database.sql for the full export script
   ```

### Step 2: Create New Supabase Project

1. Sign up at [supabase.com](https://supabase.com) with a different email
2. Create a new project
3. Note down your new project's:
   - Project URL
   - Anon Key
   - Service Role Key

### Step 3: Set Up Schema in New Database

1. Run all migrations in order:
   ```bash
   # In Supabase SQL Editor, run each migration file:
   # 001_initial_schema.sql
   # 002_sample_data.sql (skip if you want to import your own data)
   # 003_fix_rls_recursion.sql
   # 004_fix_policies_idempotent.sql
   # 005_location_services.sql
   # 006_location_based_roles.sql
   # 007_custom_roles.sql
   # 008_permissions.sql
   ```

2. Or use the migration script:
   ```bash
   npm run db:migrate
   ```

### Step 4: Import Data to New Database

1. **Update the import script with your new project credentials:**
   - Edit `scripts/import-database.js`
   - Update the Supabase URL and service role key

2. **Run the import script:**
   ```bash
   node scripts/import-database.js
   ```

   **OR manually import using SQL:**
   - Use the SQL scripts in `scripts/import-database.sql`

### Step 5: Migrate Auth Users

⚠️ **Important:** Supabase auth users cannot be directly migrated. You have two options:

#### Option A: Users Re-authenticate (Recommended for customers)
- Users will need to sign up again with Google OAuth
- Their profiles will be linked automatically if email matches
- You may need to manually link profiles if emails don't match

#### Option B: Manual User Migration (For staff/admin accounts)
1. Create users manually in the new project
2. Update user IDs in the imported data to match new user IDs
3. This is complex and only recommended for a few critical accounts

### Step 6: Update Application Configuration

1. Update `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://[NEW-PROJECT-ID].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[NEW-ANON-KEY]
   SUPABASE_SERVICE_ROLE_KEY=[NEW-SERVICE-ROLE-KEY]
   ```

2. Update any hardcoded project IDs in your code

3. Set up Google OAuth in the new project (see `docs/enable-google-oauth.md`)

## Tables to Migrate

The following tables contain your data (in order of dependency):

1. **roles** - System roles (will be recreated by migrations)
2. **permissions** - System permissions (will be recreated by migrations)
3. **role_permissions** - Role-permission mappings
4. **locations** - Location data
5. **services** - Service/sport data
6. **profiles** - User profiles (linked to auth.users)
7. **user_roles** - User role assignments
8. **user_role_locations** - Location-based role assignments
9. **employee_locations** - Employee location assignments
10. **turfs** - Turf data
11. **hourly_pricing** - Pricing data
12. **bookings** - Booking records
13. **booking_slots** - Booking time slots
14. **payments** - Payment records
15. **payment_gateway_settings** - Gateway settings

## Important Notes

- **Auth Users:** Cannot be directly migrated. Users need to sign up again.
- **User IDs:** Will change in the new database. You may need to update foreign key references.
- **Timestamps:** Will be preserved from the original data.
- **UUIDs:** Will be preserved, but foreign key relationships may break if user IDs change.

## Troubleshooting

### "Foreign key constraint violation"
- This happens when importing data that references users that don't exist yet
- Solution: Import in the correct order, or temporarily disable foreign key checks

### "User not found" errors
- Auth users need to be created first
- For staff/admin accounts, create them manually before importing data

### "RLS policy violation"
- Use the service role key for imports (bypasses RLS)
- Make sure you're using the service client, not the regular client

## Verification Checklist

After migration, verify:

- [ ] All locations are present
- [ ] All services are present
- [ ] All turfs are present
- [ ] All bookings are present
- [ ] All payments are present
- [ ] User profiles are linked correctly
- [ ] Role assignments are correct
- [ ] RLS policies are working
- [ ] Application connects to new database
- [ ] Google OAuth is configured

