'use server';

import { createServiceClient } from '@/lib/supabase/server';

type PaymentGatewaySettingsRow = {
  razorpay_enabled?: boolean | null;
  payglobal_enabled?: boolean | null;
  active_gateway?: string | null;
};

export async function getPaymentGatewaySettingsPublic() {
  const serviceClient = await createServiceClient();
  const { data, error } = await serviceClient
    .from('payment_gateway_settings')
    .select('*')
    .single();

  if (error || !data) {
    return {
      razorpay_enabled: true,
      payglobal_enabled: true,
      active_gateway: 'razorpay' as const,
    };
  }

  const row = data as PaymentGatewaySettingsRow;
  const active_gateway: 'razorpay' | 'payglobal' = row.active_gateway === 'payglobal' ? 'payglobal' : 'razorpay';
  return {
    razorpay_enabled: row.razorpay_enabled ?? true,
    payglobal_enabled: row.payglobal_enabled ?? true,
    active_gateway,
  };
}





