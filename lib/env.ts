import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  PAYGLOBAL_MERCHANT_ID: z.string().optional(),
  PAYGLOBAL_API_KEY: z.string().optional(),
  PAYGLOBAL_BASE_URL: z.string().url().optional(),
  PAYGLOBAL_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  // WhatsApp (AskEva only)
  ASKEVA_API_TOKEN: z.string().optional(),
  ASKEVA_DEFAULT_MESSAGE_TEMPLATE: z.string().optional(),
  CRON_SECRET: z.string().optional(),
});

const envResult = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  PAYGLOBAL_MERCHANT_ID: process.env.PAYGLOBAL_MERCHANT_ID,
  PAYGLOBAL_API_KEY: process.env.PAYGLOBAL_API_KEY,
  PAYGLOBAL_BASE_URL: process.env.PAYGLOBAL_BASE_URL,
  PAYGLOBAL_WEBHOOK_SECRET: process.env.PAYGLOBAL_WEBHOOK_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ASKEVA_API_TOKEN: process.env.ASKEVA_API_TOKEN,
  ASKEVA_DEFAULT_MESSAGE_TEMPLATE: process.env.ASKEVA_DEFAULT_MESSAGE_TEMPLATE,
  CRON_SECRET: process.env.CRON_SECRET,
});

// Don't throw at module load (e.g. during `next build` when env may be missing).
// Invalid env will surface at runtime when Supabase/auth is used.
const fallback: z.infer<typeof envSchema> = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  NEXT_PUBLIC_APP_URL: (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') as string,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  PAYGLOBAL_MERCHANT_ID: process.env.PAYGLOBAL_MERCHANT_ID,
  PAYGLOBAL_API_KEY: process.env.PAYGLOBAL_API_KEY,
  PAYGLOBAL_BASE_URL: process.env.PAYGLOBAL_BASE_URL as string | undefined,
  PAYGLOBAL_WEBHOOK_SECRET: process.env.PAYGLOBAL_WEBHOOK_SECRET,
  ASKEVA_API_TOKEN: process.env.ASKEVA_API_TOKEN,
  ASKEVA_DEFAULT_MESSAGE_TEMPLATE: process.env.ASKEVA_DEFAULT_MESSAGE_TEMPLATE,
  CRON_SECRET: process.env.CRON_SECRET,
};

export const env = envResult.success ? envResult.data : fallback;

