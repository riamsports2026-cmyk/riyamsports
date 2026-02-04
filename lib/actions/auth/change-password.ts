'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function changePassword(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to change your password.' };
  }

  const currentPassword = formData.get('current_password') as string;
  const newPassword = formData.get('new_password') as string;
  const confirmPassword = formData.get('confirm_password') as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'All fields are required.' };
  }

  if (newPassword.length < 8) {
    return { error: 'New password must be at least 8 characters long.' };
  }

  if (newPassword !== confirmPassword) {
    return { error: 'New password and confirm password do not match.' };
  }

  if (currentPassword === newPassword) {
    return { error: 'New password must be different from your current password.' };
  }

  // Verify current password by attempting to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });

  if (signInError) {
    return { error: 'Current password is incorrect.' };
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    console.error('Error updating password:', updateError);
    let errorMessage = updateError.message;
    
    // Provide helpful error messages
    if (updateError.message.toLowerCase().includes('weak') || 
        updateError.message.toLowerCase().includes('password') ||
        updateError.message.toLowerCase().includes('requirement')) {
      errorMessage += ' Password must include: uppercase letters, lowercase letters, numbers, and symbols.';
    }
    
    return { error: errorMessage };
  }

  // Sign out the user after password change for security
  // This ensures they must log in again with the new password
  await supabase.auth.signOut();

  revalidatePath('/admin/change-password');
  
  // Redirect to login page with success message
  redirect('/admin/login?message=Password changed successfully. Please log in with your new password.');
}

