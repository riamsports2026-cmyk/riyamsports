# ✅ Next Steps - Your Database is Ready!

## 1. Enable Google OAuth (Required for Login)

1. Go to: https://supabase.com/dashboard/project/esndugjwgubxetjxqwgs/auth/providers
2. Find **Google** in the providers list
3. Toggle it to **Enabled**
4. Add your Google OAuth credentials:
   - Get credentials from: https://console.cloud.google.com/
   - Create OAuth 2.0 Client ID
   - Add redirect URI: `https://esndugjwgubxetjxqwgs.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase
5. Add redirect URL in Supabase:
   - Go to Authentication → URL Configuration
   - Add: `http://localhost:3000/api/auth/callback`

📖 Detailed guide: `docs/enable-google-oauth.md`

## 2. Start Development Server

```bash
npm run dev
```

## 3. Test the Application

1. Open: http://localhost:3000
2. You should be redirected to `/login`
3. Click "Continue with Google"
4. After authentication, complete your profile
5. Start booking turfs!

## 4. Add Sample Data (Optional)

To test the booking system, you'll need to add:
- **Locations**: Add some turf locations
- **Services**: Add sports (Football, Cricket, etc.)
- **Turfs**: Create turfs for each location/service
- **Pricing**: Set hourly pricing for each turf

You can add this via:
- Supabase Dashboard → Table Editor
- Or create an admin panel (future enhancement)

## 5. Set Up Payment Gateways (Optional)

If you want to test payments:

1. **Razorpay**:
   - Get credentials from: https://razorpay.com/
   - Add to `.env.local`:
     ```
     RAZORPAY_KEY_ID=your_key_id
     RAZORPAY_KEY_SECRET=your_key_secret
     ```

2. **PayGlocal**:
   - Get credentials from: https://payglocal.com/
   - Add to `.env.local`:
     ```
     PAYGLOBAL_MERCHANT_ID=your_merchant_id
     PAYGLOBAL_API_KEY=your_api_key
     PAYGLOBAL_WEBHOOK_SECRET=your_webhook_secret
     ```

## 6. Create Admin User (Optional)

To manage the system:

1. Sign up with Google OAuth
2. In Supabase SQL Editor, run:
   ```sql
   -- Get your user ID from auth.users table
   -- Then assign admin role
   INSERT INTO user_roles (user_id, role_id)
   SELECT 
     'YOUR_USER_ID_HERE',
     id
   FROM roles
   WHERE name = 'admin';
   ```

## 🎉 You're All Set!

Your turf booking system is ready. Start by enabling Google OAuth and then test the login flow!


