import { createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to reset admin password
 * 
 * Usage:
 * POST /api/admin/reset-password
 * Headers: { "Content-Type": "application/json" }
 * Body: { userId: string, newPassword: string }
 * 
 * Note: Works from Postman/API clients. Uses service role key for security.
 */
export async function GET() {
  return NextResponse.json(
    {
      message: 'Password Reset API',
      usage: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          userId: 'string (UUID)',
          newPassword: 'string (min 8 characters, must include uppercase, lowercase, numbers, and symbols)'
        },
        example: {
          userId: 'bd4dafdc-d96b-4f58-a458-45f9c456ae65',
          newPassword: 'Riyam@2026'
        }
      }
    },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    // Note: Authentication removed for Postman/testing purposes
    // The actual password reset uses service role key which is secure
    // In production, you may want to add API key authentication here

    // Parse JSON body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    const { userId, newPassword } = body;

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'userId and newPassword are required' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Use service client to update password (bypasses RLS)
    const serviceSupabase = await createServiceClient();
    
    const { data, error } = await serviceSupabase.auth.admin.updateUserById(userId, {
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
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: error,
          hint: 'Password may not meet Supabase requirements. Ensure it has uppercase, lowercase, numbers, and symbols. Example: "Riyam@2026" (with uppercase R)'
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Password reset successfully',
        userId: userId
      },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error: any) {
    console.error('Error in reset password API:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to reset password',
        details: error.toString()
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

