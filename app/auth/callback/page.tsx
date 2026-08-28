import { Metadata } from 'next';
import { AuthCallbackHandler } from '@/components/auth-callback-handler';

export const metadata: Metadata = {
  title: 'Signing in | RIAM Sports',
};

export default function AuthCallbackPage() {
  return <AuthCallbackHandler />;
}
