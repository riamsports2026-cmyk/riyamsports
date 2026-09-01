'use client';

import { signOut } from '@/lib/actions/auth';
import { terminateBookingContinuation } from '@/lib/utils/booking-draft';

interface SignOutFormProps {
  children: React.ReactNode;
  className?: string;
}

export function SignOutForm({ children, className }: SignOutFormProps) {
  return (
    <form
      action={signOut}
      className={className}
      onSubmit={() => terminateBookingContinuation('sign_out')}
    >
      {children}
    </form>
  );
}
