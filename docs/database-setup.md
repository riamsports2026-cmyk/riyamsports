# Database Setup Guide

## Running the Migration

The database schema needs to be created in your Supabase project. Follow these steps:

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/esndugjwgubxetjxqwgs

2. **Open SQL Editor**
   - Click on **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Copy and Paste the Migration**
   - Open the file: `supabase/migrations/001_initial_schema.sql`
   - Copy the entire contents
   - Paste into the SQL Editor

4. **Run the Migration**
   - Click **Run** (or press Ctrl+Enter)
   - Wait for the migration to complete

5. **Verify Tables Created**
   - Go to **Table Editor** in the left sidebar
   - You should see the following tables:
     - `profiles`
     - `roles`
     - `user_roles`
     - `employee_locations`
     - `locations`
     - `services`
     - `turfs`
     - `hourly_pricing`
     - `bookings`
     - `booking_slots`
     - `payments`
     - `payment_gateway_settings`

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref esndugjwgubxetjxqwgs

# Run migrations
supabase db push
```

### Option 3: Direct SQL Execution

You can also execute the SQL directly via the Supabase REST API or using a database client.

## Post-Migration Steps

After running the migration:

1. **Verify RLS is Enabled**
   - Go to **Authentication** → **Policies**
   - Ensure Row Level Security is enabled on all tables

2. **Set Up Initial Data (Optional)**
   - The migration automatically creates default roles (admin, employee, customer)
   - You may want to create an admin user and assign the admin role

3. **Test the Application**
   - Try logging in with Google OAuth
   - Complete your profile
   - Verify the booking flow works

## Troubleshooting

### "Table does not exist" Error
- Make sure you ran the migration in the correct database
- Check that you're connected to the right Supabase project
- Verify the migration completed without errors

### RLS Policy Errors
- Ensure all RLS policies were created (check the migration output)
- Verify you're authenticated when testing

### Permission Errors
- Make sure your service role key has proper permissions
- Check that RLS policies allow the operations you're trying to perform


