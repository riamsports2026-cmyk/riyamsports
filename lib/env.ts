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
  // WhatsApp Configuration
  WHATSAPP_PROVIDER: z.enum(['twilio', 'meta']).optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_WHATSAPP_FROM: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
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
  WHATSAPP_PROVIDER: process.env.WHATSAPP_PROVIDER || 'twilio',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_WHATSAPP_FROM: process.env.TWILIO_WHATSAPP_FROM,
  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
  CRON_SECRET: process.env.CRON_SECRET,
});

if (!envResult.success) {
  const missingVars = envResult.error.issues
    .filter((err) => err.code === 'invalid_type')
    .map((err) => err.path.join('.'))
    .join(', ');

  throw new Error(
    `Missing required environment variables: ${missingVars}\n` +
      'Please create a .env.local file with the required variables.\n' +
      'See .env.local.example for reference.'
  );
}

export const env = envResult.data;

