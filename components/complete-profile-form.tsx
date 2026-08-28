'use client';

import { updateProfile } from '@/lib/actions/profile';
import { Profile } from '@/lib/types';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// TEMPORARILY DISABLED - Profile image upload to save Cloudinary usage
// import { ImageUpload } from '@/components/ui/image-upload';

interface CompleteProfileFormProps {
  profile: Profile | null;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex justify-center py-3.5 px-5 rounded-xl text-sm font-semibold text-white bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35] focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-[#FF6B35]/20 hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:hover:shadow-none"
    >
      {pending ? 'Saving...' : 'Save Profile'}
    </button>
  );
}

export function CompleteProfileForm({ profile }: CompleteProfileFormProps) {
  const router = useRouter();
  // TEMPORARILY DISABLED - Profile image upload to save Cloudinary usage
  // const [profileImageUrl, setProfileImageUrl] = useState<string>(profile?.profile_image || '');
  const [state, formAction] = useActionState(updateProfile, null);
  const [isAdminOrSubAdmin, setIsAdminOrSubAdmin] = useState<boolean | null>(null);

  // Check if user is admin or sub-admin
  useEffect(() => {
    async function checkAdmin() {
      try {
        const response = await fetch('/api/check-admin');
        if (response.ok) {
          const data = await response.json();
          setIsAdminOrSubAdmin(data.isAdminOrSubAdmin || false);
        }
      } catch (error) {
        setIsAdminOrSubAdmin(false);
      }
    }
    checkAdmin();
  }, []);

  useEffect(() => {
    if (state?.success) {
      // Redirect to admin if admin/sub-admin, otherwise to booking page
      if (isAdminOrSubAdmin) {
        router.push('/admin');
      } else {
        router.push('/book');
      }
    }
  }, [state, router, isAdminOrSubAdmin]);

  const inputClass =
    'block w-full px-4 py-3 rounded-xl border-2 border-[#1E3A5F]/15 bg-white/80 placeholder-[#1E3A5F]/40 text-[#1E3A5F] focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/15 focus:border-[#FF6B35] transition-all duration-200';

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="full_name" className="block text-sm font-semibold text-[#1E3A5F] mb-2">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          defaultValue={profile?.full_name || ''}
          className={inputClass}
          placeholder="Your full name"
        />
      </div>

      <div>
        <label htmlFor="mobile_number" className="block text-sm font-semibold text-[#1E3A5F] mb-2">
          Mobile Number <span className="text-red-500">*</span>
        </label>
        <input
          id="mobile_number"
          name="mobile_number"
          type="tel"
          required
          pattern="[6-9]\d{9}"
          defaultValue={profile?.mobile_number || ''}
          className={inputClass}
          placeholder="9876543210"
        />
        <p className="mt-1.5 text-xs text-[#1E3A5F]/60">10-digit number starting with 6–9</p>
      </div>

      {/* TEMPORARILY DISABLED - Profile image upload to save Cloudinary usage
      <div>
        <ImageUpload
          currentImage={profile?.profile_image}
          onImageUploaded={(url) => setProfileImageUrl(url)}
          type="profile"
          label="Profile Image"
        />
        <input type="hidden" name="profile_image" value={profileImageUrl} />
      </div>
      */}

      {state?.error && (
        <div className="rounded-xl bg-red-50/90 border border-red-200/80 p-4 shadow-sm">
          <p className="text-sm font-semibold text-red-800">{state.error}</p>
        </div>
      )}

      <SubmitButton />
    </form>
  );
}

