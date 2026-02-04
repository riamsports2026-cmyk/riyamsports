'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isAdminOrSubAdmin } from '@/lib/utils/roles';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const paymentGatewaySettingsSchema = z.object({
  razorpay_enabled: z.boolean(),
  payglobal_enabled: z.boolean(),
  active_gateway: z.enum(['razorpay', 'payglobal']),
  razorpay_test_mode: z.boolean().optional(),
  payglobal_test_mode: z.boolean().optional(),
});

export async function getPaymentGatewaySettings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return null;
  }

  const serviceClient = await createServiceClient();
  const { data, error } = await serviceClient
    .from('payment_gateway_settings')
    .select('*')
    .single();

  if (error || !data) {
    // Return default settings if no record exists
    return {
      razorpay_enabled: true,
      payglobal_enabled: true,
      active_gateway: 'razorpay' as const,
      razorpay_test_mode: false,
      payglobal_test_mode: false,
    };
  }

  type GatewayRow = { razorpay_enabled?: boolean; payglobal_enabled?: boolean; active_gateway?: string; razorpay_test_mode?: boolean; payglobal_test_mode?: boolean };
  const row = data as GatewayRow;
  return {
    razorpay_enabled: row.razorpay_enabled ?? true,
    payglobal_enabled: row.payglobal_enabled ?? true,
    active_gateway: (row.active_gateway || 'razorpay') as 'razorpay' | 'payglobal',
    razorpay_test_mode: row.razorpay_test_mode ?? false,
    payglobal_test_mode: row.payglobal_test_mode ?? false,
  };
}

export async function getPaymentGatewayApiKeyStatus() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return null;
  }

  // Check environment variables (server-side only)
  return {
    razorpay_key_id: !!process.env.RAZORPAY_KEY_ID,
    razorpay_key_secret: !!process.env.RAZORPAY_KEY_SECRET,
    payglobal_merchant_id: !!process.env.PAYGLOBAL_MERCHANT_ID,
    payglobal_api_key: !!process.env.PAYGLOBAL_API_KEY,
    payglobal_webhook_secret: !!process.env.PAYGLOBAL_WEBHOOK_SECRET,
  };
}

export async function updatePaymentGatewaySettings(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminOrSubAdmin(user.id))) {
    return { error: 'Unauthorized' };
  }

  const data = {
    razorpay_enabled: formData.get('razorpay_enabled') === 'true',
    payglobal_enabled: formData.get('payglobal_enabled') === 'true',
    active_gateway: formData.get('active_gateway') as 'razorpay' | 'payglobal',
    razorpay_test_mode: formData.get('razorpay_test_mode') === 'true',
    payglobal_test_mode: formData.get('payglobal_test_mode') === 'true',
  };

  try {
    const validated = paymentGatewaySettingsSchema.parse(data);
    const serviceClient = await createServiceClient();

    // Ensure only one gateway is enabled and active at a time
    // When a gateway is set as active, automatically disable the other one
    if (validated.active_gateway === 'razorpay') {
      // If Razorpay is active, ensure it's enabled and disable PayGlobal
      validated.razorpay_enabled = true;
      validated.payglobal_enabled = false;
    } else if (validated.active_gateway === 'payglobal') {
      // If PayGlobal is active, ensure it's enabled and disable Razorpay
      validated.payglobal_enabled = true;
      validated.razorpay_enabled = false;
    }

    // Final validation: ensure at least one gateway is enabled (should always be true after above logic)
    if (!validated.razorpay_enabled && !validated.payglobal_enabled) {
      return { error: 'At least one payment gateway must be enabled' };
    }

    // Check if settings exist
    const { data: existingRow } = await serviceClient
      .from('payment_gateway_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    const existing = existingRow as { id: string } | null;
    let upsertError;
    if (existing) {
      // Update existing row
      const { error } = await (serviceClient.from('payment_gateway_settings') as any)
        .update({
          razorpay_enabled: validated.razorpay_enabled,
          payglobal_enabled: validated.payglobal_enabled,
          active_gateway: validated.active_gateway,
          razorpay_test_mode: validated.razorpay_test_mode ?? false,
          payglobal_test_mode: validated.payglobal_test_mode ?? false,
        })
        .eq('id', existing.id);
      upsertError = error;
    } else {
      // Insert new row
      const { error } = await (serviceClient.from('payment_gateway_settings') as any).insert({
        razorpay_enabled: validated.razorpay_enabled,
        payglobal_enabled: validated.payglobal_enabled,
        active_gateway: validated.active_gateway,
        razorpay_test_mode: validated.razorpay_test_mode ?? false,
        payglobal_test_mode: validated.payglobal_test_mode ?? false,
      });
      upsertError = error;
    }

    if (upsertError) {
      return { error: upsertError.message };
    }

    revalidatePath('/admin/payment-gateways');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || 'Validation failed' };
    }
    return { error: 'Failed to update payment gateway settings' };
  }
}

