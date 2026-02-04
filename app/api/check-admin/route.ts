import { createClient } from '@/lib/supabase/server';
import { isAdminOrSubAdmin } from '@/lib/utils/roles';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ isAdmin: false, isAdminOrSubAdmin: false });
  }

  const userIsAdminOrSubAdmin = await isAdminOrSubAdmin(user.id);
  return NextResponse.json({ isAdmin: userIsAdminOrSubAdmin, isAdminOrSubAdmin: userIsAdminOrSubAdmin });
}

