import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function GET() {
  // Return Razorpay key ID for client-side initialization
  // This is safe to expose as it's a public key
  return NextResponse.json({
    key: env.RAZORPAY_KEY_ID || '',
  });
}





