'use client';

import { updateProfile } from '@/lib/actions/profile';
import { Profile } from '@/lib/types';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
// useState removed - was only used for profile image upload
// TEMPORARILY DISABLED - Profile image upload to save Cloudinary usage
// import { ImageUpload } from '@/components/ui/image-upload';

interface ProfileEditFormProps {
  profile: Profile | null;
  userEmail: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B35]/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      {pending ? 'Saving...' : 'Save Changes'}
    </button>
  );
}

export function ProfileEditForm({ profile, userEmail }: ProfileEditFormProps) {
  const router = useRouter();
  // TEMPORARILY DISABLED - Profile image upload to save Cloudinary usage
  // const [profileImageUrl, setProfileImageUrl] = useState<string>(profile?.profile_image || '');
  const [state, formAction] = useActionState(updateProfile, null);

  useEffect(() => {
    if (state?.success) {
      // Refresh the page to show updated data in headers
      // The revalidatePath calls in updateProfile will ensure all layouts update
      router.refresh();
    }
  }, [state?.success, router]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email <span className="text-gray-400 text-xs">(Read-only)</span>
          </label>
          <input
            id="email"
            type="email"
            value={userEmail}
            disabled
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
        </div>

        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            defaultValue={profile?.full_name || ''}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF6B35]/30 focus:border-[#FF6B35]"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label htmlFor="mobile_number" className="block text-sm font-medium text-gray-700">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <input
            id="mobile_number"
            name="mobile_number"
            type="tel"
            required
            pattern="[6-9]\d{9}"
            defaultValue={profile?.mobile_number || ''}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF6B35]/30 focus:border-[#FF6B35]"
            placeholder="9876543210"
          />
          <p className="mt-1 text-sm text-gray-500">10-digit mobile number starting with 6-9</p>
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
      </div>

      {state?.error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{state.error}</p>
        </div>
      )}

      {state?.success && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">Profile updated successfully!</p>
        </div>
      )}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}



