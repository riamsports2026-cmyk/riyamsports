import { getProfile } from '@/lib/actions/profile';
import { Metadata } from 'next';
import { CompleteProfileForm } from '@/components/complete-profile-form';
import { ParticleBackground } from '@/components/ui/particle-background';

export const metadata: Metadata = {
  title: 'Complete Profile | RIAM Sports',
  description: 'Complete your profile to continue',
};

export default async function CompleteProfilePage() {
  const profile = await getProfile();

  return (
    <div className="min-h-screen flex items-center justify-center relative py-8 sm:py-12 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-[#1E3A5F]/4 via-[#F5F7FA] to-[#FF6B35]/6" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF6B35]/10 rounded-full blur-3xl -translate-y-1/2" aria-hidden />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#1E3A5F]/10 rounded-full blur-3xl translate-y-1/2" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(245,247,250,0.85)_60%)]" aria-hidden />
      <ParticleBackground />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-[0_8px_32px_rgba(30,58,95,0.08),0_0_0_1px_rgba(30,58,95,0.04)] border border-[#1E3A5F]/6 p-6 sm:p-8 lg:p-10">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-linear-to-br from-[#1E3A5F]/5 to-[#FF6B35]/5 ring-1 ring-[#1E3A5F]/10 mb-4">
              <svg className="h-8 w-8 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-[#1E3A5F] via-[#2D4F7C] to-[#FF6B35] bg-clip-text text-transparent tracking-tight">
              Complete Your Profile
            </h1>
            <p className="mt-1.5 text-[#1E3A5F]/70 text-sm sm:text-base">We need a few details to get started</p>
          </div>
          <CompleteProfileForm profile={profile} />
        </div>
      </div>
    </div>
  );
}


