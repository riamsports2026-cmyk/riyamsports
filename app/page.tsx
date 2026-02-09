import { redirect } from 'next/navigation';
import Link from 'next/link';
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

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl sm:text-5xl font-bold bg-linear-to-r from-[#1E3A5F] via-[#2D4F7C] to-[#FF6B35] bg-clip-text text-transparent mb-4">
          RIAM Sports
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Book your favorite turf at RIAM Sports Arena
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-8 py-3 rounded-xl font-semibold text-white bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35] transition-all shadow-lg hover:shadow-xl"
          >
            Sign In to Book
          </Link>
          <Link
            href="/book"
            className="inline-flex items-center justify-center px-8 py-3 rounded-xl font-semibold text-[#1E3A5F] border-2 border-[#1E3A5F] hover:bg-[#1E3A5F]/5 transition-all"
          >
            Book Turf
          </Link>
        </div>
      </div>
    </div>
  );
}
