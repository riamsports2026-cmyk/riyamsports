import { getProfile } from '@/lib/actions/profile';
import { Metadata } from 'next';
import { ProfileEditForm } from '@/components/profile-edit-form';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdmin, isStaff } from '@/lib/utils/roles';
import { hasPermission } from '@/lib/utils/permissions';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Edit Profile | RIAM Sports',
  description: 'Edit your profile information',
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getProfile();
  const userIsAdmin = await isAdmin(user.id);
  const userIsStaff = await isStaff(user.id);
  const canBook = await hasPermission(user.id, 'book_turf');
  const canViewBookings = await hasPermission(user.id, 'view_bookings');

  // Determine where to go back based on user role
  const getBackLink = () => {
    if (userIsAdmin) return '/admin';
    if (userIsStaff) return '/staff';
    if (canBook) return '/book';
    if (canViewBookings) return '/bookings';
    return '/book';
  };

  return (
    <div className="h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] bg-linear-to-br from-[#F5F7FA] via-white to-[#FF6B35]/5 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-xl shadow-xl border-2 border-[#1E3A5F]/10">
          <div className="px-6 py-5 border-b-2 border-[#FF6B35]/20 bg-linear-to-r from-[#1E3A5F]/5 to-[#FF6B35]/5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent">
                  👤 Edit Profile
                </h1>
                <p className="mt-2 text-sm sm:text-base text-[#1E3A5F] font-medium">Update your personal information</p>
              </div>
              {/* Back button - visible on all screens */}
              <Link 
                href={getBackLink()}
                className="flex items-center space-x-2 text-[#1E3A5F] hover:text-[#FF6B35] transition-colors px-3 sm:px-4 py-2 rounded-lg hover:bg-[#FF6B35]/10 ml-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-semibold hidden sm:inline">Back</span>
              </Link>
            </div>
          </div>
          <div className="px-6 py-5">
            <ProfileEditForm profile={profile} userEmail={user.email || ''} />
          </div>
        </div>
      </div>
    </div>
  );
}


