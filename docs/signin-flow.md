# Sign-In Flow - What Happens After Success

## 🔄 Complete Authentication Flow

### Step 1: User Clicks "Continue with Google"
- Redirected to Google OAuth
- User authenticates with Google
- Google redirects back with authorization code

### Step 2: Callback Handler (`/api/auth/callback`)
✅ **Code exchanged for session**
- Creates authenticated session
- Sets secure cookies

### Step 3: Profile Check
The system checks if your profile exists and is complete:

**Scenario A: New User (No Profile)**
→ Redirected to `/complete-profile`
- Form to enter:
  - Full Name (required)
  - Mobile Number (required, 10 digits starting with 6-9)
  - Profile Image URL (optional)
- After submitting → Redirected to `/book`

**Scenario B: Existing User (Profile Incomplete)**
→ Redirected to `/complete-profile`
- Same form, pre-filled with existing data
- Complete missing fields (usually mobile_number)
- After submitting → Redirected to `/book`

**Scenario C: Existing User (Profile Complete)**
→ Directly redirected to `/book`
- Can start booking immediately

### Step 4: Booking Page (`/book`)
Once profile is complete, you'll see:
- **Location Selection**: List of available turf locations
- **Sports Display**: Available sports/services
- **Navigation**: Click a location to see services

### Step 5: Booking Flow
1. Select Location → `/book/[location]`
2. Select Sport → `/book/[location]/[service]`
3. Choose Turf, Date, and Time Slots
4. Review Pricing (Advance 30% or Full with 10% discount)
5. Create Booking → Redirected to booking confirmation

## 🛡️ Route Protection

The middleware protects all routes:
- **Not logged in** → Redirected to `/login`
- **Logged in but profile incomplete** → Redirected to `/complete-profile`
- **Logged in and profile complete** → Access granted

## 📱 What You'll See

### After First Sign-In:
```
Login → Google OAuth → Complete Profile → Book Turf
```

### After Subsequent Sign-Ins:
```
Login → Google OAuth → Book Turf (if profile complete)
```

## 🔍 Testing the Flow

1. **Sign in with Google**
   - Should redirect to `/complete-profile` (first time)

2. **Fill profile form**
   - Enter name and mobile number
   - Click "Save Profile"

3. **Automatic redirect**
   - Should go to `/book` page
   - See locations and sports

4. **Sign out and sign in again**
   - Should go directly to `/book` (profile already complete)

## ⚠️ Common Issues

### Stuck on `/complete-profile`
- Check browser console for errors
- Verify mobile number format (10 digits, starts with 6-9)
- Check network tab for API errors

### Redirected back to login
- Session might have expired
- Check Supabase auth settings
- Verify cookies are being set

### Can't see locations
- No locations added to database yet
- Add locations via Supabase Table Editor
- Or create admin panel to manage locations


