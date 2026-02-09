import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminOrSubAdmin } from '@/lib/utils/roles';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const userIsAdminOrSubAdmin = await isAdminOrSubAdmin(user.id);
    if (userIsAdminOrSubAdmin) {
      redirect('/admin');
    }
    redirect('/book');
  }

  redirect('/login');
}
