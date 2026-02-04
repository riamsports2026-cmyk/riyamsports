'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Profile } from '@/lib/types';

const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  mobile_number: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number'),
  profile_image: z
    .union([z.string().url('Invalid URL format'), z.literal(''), z.null()])
    .optional()
    .nullable(),
});

export async function updateProfile(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const profileImageValue = formData.get('profile_image') as string | null;
  const data = {
    full_name: formData.get('full_name') as string,
    mobile_number: formData.get('mobile_number') as string,
    profile_image: profileImageValue && profileImageValue.trim() !== '' ? profileImageValue : null,
  };

  try {
    const validated = profileSchema.parse(data);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('profiles') as any).upsert({
      id: user.id,
      full_name: validated.full_name,
      mobile_number: validated.mobile_number,
      profile_image: validated.profile_image || null,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/complete-profile');
    revalidatePath('/profile');
    revalidatePath('/admin');
    revalidatePath('/staff');
    revalidatePath('/book');
    revalidatePath('/bookings');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues?.[0];
      return { error: firstError?.message || 'Validation failed' };
    }
    return { error: 'Failed to update profile' };
  }
}

export async function getProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Profile;
}

