# RIAM Sports - Turf Booking System

Production-grade turf booking web application built with Next.js, Supabase, and TypeScript.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React Server Components, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, RLS)
- **Payment**: Razorpay & PayGlocal
- **Deployment**: Vercel-ready

## Features

- ✅ Google OAuth authentication
- ✅ User profile management
- ✅ Role-based access control (Admin, Employee, Customer)
- ✅ Multi-location support
- ✅ Dynamic sports/services
- ✅ Hour-wise turf booking
- ✅ Real-time availability
- ✅ Payment integration (Advance & Full payment)
- ✅ Row Level Security (RLS)
- ✅ Server Actions for mutations
- ✅ Production-ready error handling

## Setup

### 1. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

PAYGLOBAL_MERCHANT_ID=your_payglobal_merchant_id
PAYGLOBAL_API_KEY=your_payglobal_api_key

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Database Setup

**IMPORTANT**: You must run the database migration before using the application.

#### Automated Setup (Recommended)

```bash
npm run db:migrate
```

This will:
- Read your migration file
- Provide direct link to Supabase SQL Editor
- Show the SQL to copy/paste

#### Manual Setup

1. Go to: https://supabase.com/dashboard/project/esndugjwgubxetjxqwgs/sql/new
2. Open `supabase/migrations/001_initial_schema.sql`
3. Copy the entire SQL content
4. Paste into the Supabase SQL Editor
5. Click **Run** to execute

This will create all required tables, indexes, RLS policies, and triggers.

See `docs/database-setup.md` for detailed instructions.

### 3. Supabase Configuration

1. Enable Google OAuth in Supabase Dashboard
2. Add redirect URL: `http://localhost:3000/api/auth/callback` (development)
3. Add redirect URL: `https://booking.riamsports.com/api/auth/callback` (production)

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── book/              # Booking pages
│   ├── bookings/          # Booking details
│   ├── login/             # Authentication
│   └── complete-profile/  # Profile completion
├── components/            # React components
├── lib/
│   ├── actions/           # Server Actions
│   ├── services/          # Business logic
│   ├── supabase/          # Supabase clients
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── supabase/
│   └── migrations/        # Database migrations
└── middleware.ts          # Route protection
```

## Key Features Implementation

### Authentication
- Cookie-based sessions via `@supabase/ssr`
- Middleware-based route protection
- Profile completion flow

### Role-Based Access Control
- Admin: Full access
- Employee: Assigned locations only
- Customer: Own data only
- RLS policies enforce access at database level

### Booking System
- Transaction-safe booking creation
- Concurrency-safe slot locking
- Unique human-readable booking IDs
- Status flow: pending_payment → confirmed → completed/cancelled

### Payment Foundation
- Advance payment (30%, non-refundable)
- Full payment (100% with 10% discount)
- Razorpay & PayGlocal support
- Webhook verification
- Admin-controlled active gateway

## Deployment

### Vercel

1. Connect your repository to Vercel
2. Add environment variables
3. Deploy

### Subdomain Setup

Configure `booking.riamsports.com` in your DNS and Vercel project settings.

## License

Private - RIAM Sports
