# 🚀 Quick Start Guide

## ⚠️ IMPORTANT: Run Database Migration First!

Your app won't work until you run the database migration.

### Step 1: Run Migration (REQUIRED)

**Option A: Automated Script (Opens SQL Editor)**
```bash
npm run db:migrate
```
Then copy/paste the SQL and click "Run" in Supabase.

**Option B: Manual**
1. Go to: https://supabase.com/dashboard/project/esndugjwgubxetjxqwgs/sql/new
2. Open `supabase/migrations/001_initial_schema.sql`
3. Copy all SQL
4. Paste in SQL Editor
5. Click **Run**

### Step 2: Verify Migration

```bash
npm run db:verify
```

You should see ✅ for all tables. If you see ❌, the migration didn't run successfully.

### Step 3: Enable Google OAuth

1. Go to: https://supabase.com/dashboard/project/esndugjwgubxetjxqwgs/auth/providers
2. Enable **Google** provider
3. Add your Google OAuth credentials
4. Add redirect URL: `http://localhost:3000/api/auth/callback`

### Step 4: Start Development Server

```bash
npm run dev
```

## Troubleshooting

### "Could not find the table 'public.profiles'"
→ **You haven't run the migration yet!** Follow Step 1 above.

### "Provider is not enabled"
→ **Google OAuth is not enabled!** Follow Step 3 above.

### Migration verification shows ❌
→ Check the SQL Editor for errors. Common issues:
- Syntax errors in SQL
- Missing permissions
- Database connection issues

## Need Help?

- Database setup: See `docs/database-setup.md`
- Google OAuth: See `docs/enable-google-oauth.md`
- General setup: See `README.md`


