import { Metadata } from 'next';
import { StaffLoginForm } from '@/components/staff/staff-login-form';
import { Loader } from '@/components/ui/loader';
import { ParticleBackground } from '@/components/ui/particle-background';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Staff Login | RIAM Sports',
  description: 'Staff login page',
};

export default function StaffLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string }>;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center relative py-8 sm:py-12 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-[#1E3A5F]/4 via-[#F5F7FA] to-[#FF6B35]/6" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#1E3A5F]/10 rounded-full blur-3xl -translate-y-1/2" aria-hidden />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-[#FF6B35]/10 rounded-full blur-3xl translate-y-1/2" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,transparent_0%,rgba(245,247,250,0.85)_70%)]" aria-hidden />
      <ParticleBackground />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-[0_8px_32px_rgba(30,58,95,0.08),0_0_0_1px_rgba(30,58,95,0.04)] border border-[#1E3A5F]/6 p-6 sm:p-8 lg:p-10">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-2 rounded-2xl bg-linear-to-br from-[#1E3A5F]/5 to-[#FF6B35]/5 ring-1 ring-[#1E3A5F]/10">
                <img src="/Riamlogo.png" alt="RIAM Sports Arena" className="h-14 w-14 sm:h-20 sm:w-20 object-contain" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-[#1E3A5F] via-[#2D4F7C] to-[#FF6B35] bg-clip-text text-transparent tracking-tight">
              RIAM Sports
            </h1>
            <p className="mt-1.5 text-[#1E3A5F]/80 font-semibold">Staff Portal</p>
          </div>
          <Suspense fallback={<Loader size="md" label="Loading..." className="py-8" />}>
            <StaffLoginFormWrapper searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function StaffLoginFormWrapper({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  let errorMessage = params.error;
  
  // Translate error codes to user-friendly messages
  if (errorMessage === 'no_permission') {
    errorMessage = 'Your role does not have staff permissions. Please contact an administrator to assign the "manage_bookings" permission to your role.';
  }
  
  return <StaffLoginForm error={errorMessage} />;
}

