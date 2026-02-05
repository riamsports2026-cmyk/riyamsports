'use client';

import Link from 'next/link';

interface LoginFormProps {
  error?: string;
}

/** Plain <a> so the browser does a full page navigation to the route handler.
 * Using Next.js Link would trigger client-side fetch and CORS when the server redirects to Google. */
function GoogleButton() {
  return (
    <a
      href="/api/auth/login?provider=google"
      className="w-full flex justify-center items-center gap-2 sm:gap-3 py-3.5 sm:py-4 px-5 sm:px-6 rounded-xl text-sm sm:text-base font-semibold text-white bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35] focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/25 transition-all duration-200 hover:shadow-lg hover:shadow-[#FF6B35]/20 hover:-translate-y-0.5 cursor-pointer"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Continue with Google
    </a>
  );
}

export function LoginForm({ error: urlError }: LoginFormProps) {
  const error = urlError;
  const isOAuthError = 
    error?.includes('not enabled') || 
    error?.includes('Unsupported provider') ||
    error?.includes('disabled_client') ||
    error?.includes('OAuth client was disabled') ||
    error?.includes('blocked') ||
    error?.includes('Access blocked') ||
    error?.includes('account') && error?.includes('blocked');

  return (
    <div className="space-y-3 sm:space-y-4">
      {error && (
        <div className="mb-4 rounded-xl bg-red-50/90 border border-red-200/80 p-4 shadow-sm">
          <p className="text-sm font-semibold text-red-800">{error}</p>
              {isOAuthError && (
            <div className="mt-2 text-xs text-red-700 max-h-48 sm:max-h-64 lg:max-h-none overflow-y-auto">
              <p className="font-semibold">
                {error?.includes('disabled_client') || error?.includes('OAuth client was disabled')
                  ? 'Google OAuth Client is Disabled'
                  : error?.includes('blocked') || error?.includes('Access blocked')
                  ? 'Email Access Blocked by Google'
                  : 'To enable Google OAuth:'}
              </p>
              {(error?.includes('blocked') || error?.includes('Access blocked')) ? (
                <div className="mt-2 space-y-2">
                  {error?.includes('account') && error?.includes('blocked') ? (
                    <>
                      <p>The Google account used for the OAuth project is blocked. You need to either recover the account or create a new OAuth project with a different account.</p>
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                        <li>
                          <strong>Option A: Recover the blocked account</strong>
                          <ul className="list-disc list-inside ml-4 mt-1">
                            <li>
                              Go to{' '}
                              <a
                                href="https://accounts.google.com/signin/recovery"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Google Account Recovery
                              </a>
                            </li>
                            <li>Follow the recovery process to unblock your account</li>
                            <li>Check your account status at{' '}
                              <a
                                href="https://myaccount.google.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Google Account Settings
                              </a>
                            </li>
                          </ul>
                        </li>
                        <li>
                          <strong>Option B: Create new OAuth project with different account (Recommended)</strong>
                          <ul className="list-disc list-inside ml-4 mt-1">
                            <li>Use a different Google account (work email, personal email, etc.)</li>
                            <li>
                              Go to{' '}
                              <a
                                href="https://console.cloud.google.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Google Cloud Console
                              </a>
                              {' '}with the new account
                            </li>
                            <li>Create a new project or select an existing one</li>
                            <li>Create new OAuth 2.0 credentials (Client ID and Client Secret)</li>
                            <li>Add redirect URI: <code className="bg-gray-100 px-1 rounded">https://txjoamolqaltmvczetcp.supabase.co/auth/v1/callback</code></li>
                            <li>
                              Update credentials in{' '}
                              <a
                                href="https://supabase.com/dashboard/project/txjoamolqaltmvczetcp/auth/providers"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Supabase Dashboard
                              </a>
                            </li>
                          </ul>
                        </li>
                      </ol>
                      <div className="mt-3 space-y-2">
                        <p className="font-semibold text-red-800">⚠️ Important: If Supabase also uses the same blocked email:</p>
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs">
                          <p className="font-semibold mb-1">You have two options:</p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>
                              <strong>Recover the blocked account</strong> (restores access to both Supabase and Google Cloud)
                            </li>
                            <li>
                              <strong>Create new accounts</strong> with a different email for both Supabase and Google Cloud Console
                            </li>
                          </ol>
                        </div>
                        <div className="space-y-1">
                          <p>
                            <a
                              href="https://accounts.google.com/signin/recovery"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium"
                            >
                              Recover Google Account →
                            </a>
                          </p>
                          <p>
                            <a
                              href="https://supabase.com/auth/sign-up"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium"
                            >
                              Create New Supabase Account →
                            </a>
                          </p>
                          <p>
                            <a
                              href="https://console.cloud.google.com/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium"
                            >
                              Create New OAuth Project →
                            </a>
                          </p>
                          <p>
                            <a
                              href="https://supabase.com/dashboard/project/txjoamolqaltmvczetcp/auth/providers"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium"
                            >
                              Update Supabase Credentials →
                            </a>
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <p>Your email is blocked because the OAuth app is in &quot;Testing&quot; mode. To fix this:</p>
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>
                      Go to{' '}
                      <a
                        href="https://console.cloud.google.com/apis/credentials/consent"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Google Cloud Console → OAuth consent screen
                      </a>
                    </li>
                    <li>Check the &quot;Publishing status&quot; - if it says &quot;Testing&quot;, you need to either:</li>
                    <li className="ml-4">
                      <strong>Option A (Quick fix for development):</strong>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>Scroll down to &quot;Test users&quot; section</li>
                        <li>Click &quot;+ ADD USERS&quot;</li>
                        <li>Add your email address</li>
                        <li>Click &quot;ADD&quot; and save</li>
                      </ul>
                    </li>
                    <li className="ml-4">
                      <strong>Option B (For production):</strong>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>Click &quot;PUBLISH APP&quot; button</li>
                        <li>Fill out the OAuth consent screen form</li>
                        <li>Submit for Google verification (may take a few days)</li>
                      </ul>
                    </li>
                  </ol>
                  <div className="mt-3 space-y-1">
                    <p>
                      <a
                        href="https://console.cloud.google.com/apis/credentials/consent"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        Open OAuth Consent Screen →
                      </a>
                    </p>
                    <p>
                      <a
                        href="https://supabase.com/dashboard/project/txjoamolqaltmvczetcp/auth/providers"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        Open Supabase Dashboard →
                      </a>
                    </p>
                  </div>
                  </>
                  )}
                </div>
              ) : (error?.includes('disabled_client') || error?.includes('OAuth client was disabled')) ? (
                <div className="mt-2 space-y-2">
                  <p>The OAuth client has been disabled in Google Cloud Console. To fix this:</p>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>
                      Go to{' '}
                      <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Google Cloud Console → APIs & Services → Credentials
                      </a>
                    </li>
                    <li>Find your OAuth 2.0 Client ID</li>
                    <li>Click on the client to open its settings</li>
                    <li>Make sure the client is <strong>Enabled</strong> (not disabled)</li>
                    <li>If it&apos;s disabled, click &quot;Enable&quot; or create a new OAuth client</li>
                    <li>Verify the redirect URI is set to: <code className="bg-gray-100 px-1 rounded">https://esndugjwgubxetjxqwgs.supabase.co/auth/v1/callback</code></li>
                    <li>Update the credentials in Supabase if you created a new client</li>
                  </ol>
                  <div className="mt-3 space-y-1">
                    <p>
                      <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        Open Google Cloud Console →
                      </a>
                    </p>
                    <p>
                      <a
                        href="https://supabase.com/dashboard/project/txjoamolqaltmvczetcp/auth/providers"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        Open Supabase Dashboard →
                      </a>
                    </p>
                  </div>
                </div>
              ) : (
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Go to your Supabase Dashboard</li>
                  <li>Navigate to Authentication → Providers</li>
                  <li>Enable Google provider</li>
                  <li>Add your Google OAuth credentials</li>
                  <li>
                    Add redirect URL:{' '}
                    {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}
                    /api/auth/callback
                  </li>
                </ol>
              )}
              {!(error?.includes('disabled_client') || error?.includes('OAuth client was disabled')) && (
                <p className="mt-2">
                  <a
                    href="https://supabase.com/dashboard/project/txjoamolqaltmvczetcp/auth/providers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Open Supabase Dashboard →
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-5 sm:mt-6">
        <GoogleButton />
      </div>
      <p className="mt-4 text-xs text-center text-gray-500">
        By signing in you agree to our{' '}
        <Link href="/terms" className="text-[#FF6B35] hover:underline font-medium">Terms & Conditions</Link>
        ,{' '}
        <Link href="/privacy" className="text-[#FF6B35] hover:underline font-medium">Privacy Policy</Link>
        {' '}and{' '}
        <Link href="/refund-policy" className="text-[#FF6B35] hover:underline font-medium">Refund Policy</Link>.
      </p>
    </div>
  );
}

