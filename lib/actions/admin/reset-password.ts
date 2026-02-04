'use server';

import { createServiceClient } from '@/lib/supabase/server';

/**
 * Reset admin password using Supabase Admin API
 * This requires the service_role key to be set in environment variables
 * 
 * WARNING: This should only be used in secure environments
 * Never expose the service_role key to the client
 */
export async function resetAdminPassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string; details?: any }> {
  try {
    // Basic validation
    if (newPassword.length < 8) {
      return { 
        success: false, 
        error: 'Password must be at least 8 characters long' 
      };
    }

    // Use service client to bypass RLS and access auth.users
    const supabase = await createServiceClient();
    
    // Update password using Supabase Admin API
    // Note: This requires the service_role key
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      console.error('Error resetting password:', error);
      
      // Provide more detailed error information
      let errorMessage = error.message;
      
      // Check for common password requirement issues
      if (error.message.toLowerCase().includes('weak') || 
          error.message.toLowerCase().includes('password') ||
          error.message.toLowerCase().includes('requirement')) {
        errorMessage += ' Password may need: uppercase letters, lowercase letters, numbers, and symbols. Try: "Riyam@2026" (with uppercase R) or "Riyam@2026!"';
      }
      
      return { 
        success: false, 
        error: errorMessage,
        details: error
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in resetAdminPassword:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to reset password',
      details: error
    };
  }
}

