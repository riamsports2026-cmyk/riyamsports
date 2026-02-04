# Automated Database Setup

## Option 1: Using the Script (Recommended)

The script will automatically run the migration using your Supabase credentials:

```bash
# Install dotenv if needed
npm install dotenv

# Run the migration script
node scripts/run-migration.js
```

## Option 2: Manual Setup via Supabase Dashboard

If the script doesn't work, run the migration manually:

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/esndugjwgubxetjxqwgs/sql/new

2. **Copy Migration SQL**
   - Open: `supabase/migrations/001_initial_schema.sql`
   - Copy all contents (Ctrl+A, Ctrl+C)

3. **Paste and Execute**
   - Paste into SQL Editor
   - Click **Run** (or Ctrl+Enter)

4. **Verify**
   - Go to **Table Editor**
   - Check that all tables are created

## Option 3: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref esndugjwgubxetjxqwgs

# Push migrations
supabase db push
```

## What Gets Created

The migration creates:
- ✅ All database tables (profiles, roles, locations, services, turfs, bookings, etc.)
- ✅ Indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Triggers for automatic timestamp updates
- ✅ Default roles (admin, employee, customer)


