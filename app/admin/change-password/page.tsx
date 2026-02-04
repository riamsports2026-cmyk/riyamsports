import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/utils/roles';
import { redirect } from 'next/navigation';
import { ChangePasswordForm } from '@/components/admin/change-password-form';

export const metadata = {
  title: 'Change Password | Admin',
  description: 'Change your admin password',
};

export default async function ChangePasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin(user.id))) {
    redirect('/admin/login');
  }

  return (
    <div className="px-4 py-4 sm:py-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent">
            🔒 Change Password
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#1E3A5F] font-medium">
            Update your admin account password
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border-2 border-[#1E3A5F]/10 p-6 sm:p-8">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}



