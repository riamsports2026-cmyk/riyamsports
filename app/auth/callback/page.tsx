import { Metadata } from 'next';
import { AuthCallbackHandler } from '@/components/auth-callback-handler';

export const metadata: Metadata = {
  title: 'Signing in | RIAM Sports',
};

/** Skip server rendering so Navigation/layout never touches Supabase cookies here */
export const dynamic = 'force-dynamic';

export default function AuthCallbackPage() {
  return <AuthCallbackHandler />;
}
