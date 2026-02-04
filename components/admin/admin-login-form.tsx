'use client';

import { signInWithEmail } from '@/lib/actions/auth/admin';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

interface AdminLoginFormProps {
  error?: string;
  message?: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex justify-center py-3.5 px-5 rounded-xl text-sm font-semibold text-white bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35] focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-[#FF6B35]/20 hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:hover:shadow-none"
    >
      {pending ? 'Signing in...' : 'Sign In as Admin'}
    </button>
  );
}

export function AdminLoginForm({ error: urlError, message }: AdminLoginFormProps) {
  const [emailState, emailFormAction] = useActionState(signInWithEmail, null);
  const [showPassword, setShowPassword] = useState(false);

  const error = urlError || emailState?.error;

  const inputClass =
    'block w-full px-4 py-3 rounded-xl border-2 border-[#1E3A5F]/15 bg-white/80 placeholder-[#1E3A5F]/40 text-[#1E3A5F] focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/15 focus:border-[#FF6B35] transition-all duration-200';

  return (
    <div>
      {message && (
        <div className="mb-5 rounded-xl bg-emerald-50/90 border border-emerald-200/80 p-4 shadow-sm">
          <p className="text-sm font-medium text-emerald-800">{message}</p>
        </div>
      )}
      {error && (
        <div className="mb-5 rounded-xl bg-red-50/90 border border-red-200/80 p-4 shadow-sm">
          <p className="text-sm font-semibold text-red-800">{error}</p>
        </div>
      )}

      <form action={emailFormAction} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-[#1E3A5F] mb-2">
            Admin Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={inputClass}
            placeholder="admin@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-[#1E3A5F] mb-2">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              className={`${inputClass} pr-12`}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#1E3A5F]/50 hover:text-[#FF6B35] cursor-pointer transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <SubmitButton />
      </form>
    </div>
  );
}

