'use client';

import { updatePaymentGatewaySettings } from '@/lib/actions/admin/payment-gateways';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from '@/components/ui/loader';

interface PaymentGatewaySettingsFormProps {
  settings: {
    razorpay_enabled: boolean;
    payglobal_enabled: boolean;
    active_gateway: 'razorpay' | 'payglobal';
    razorpay_test_mode?: boolean;
    payglobal_test_mode?: boolean;
  } | null;
  apiKeyStatus: {
    razorpay_key_id: boolean;
    razorpay_key_secret: boolean;
    payglobal_merchant_id: boolean;
    payglobal_api_key: boolean;
    payglobal_webhook_secret: boolean;
  } | null;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg shadow-lg text-white bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B35]/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all transform hover:scale-105 disabled:hover:scale-100"
    >
      {pending ? 'Saving...' : 'Save Configuration'}
    </button>
  );
}

export function PaymentGatewaySettingsForm({ settings, apiKeyStatus }: PaymentGatewaySettingsFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(updatePaymentGatewaySettings, null);
  const [razorpayEnabled, setRazorpayEnabled] = useState(settings?.razorpay_enabled ?? true);
  const [payglobalEnabled, setPayglobalEnabled] = useState(settings?.payglobal_enabled ?? true);
  const [activeGateway, setActiveGateway] = useState<'razorpay' | 'payglobal'>(
    settings?.active_gateway || 'razorpay'
  );
  const [razorpayTestMode, setRazorpayTestMode] = useState(settings?.razorpay_test_mode ?? false);
  const [payglobalTestMode, setPayglobalTestMode] = useState(settings?.payglobal_test_mode ?? false);

  useEffect(() => {
    if (state?.success) {
      setTimeout(() => {
        router.refresh();
      }, 1000);
    }
  }, [state?.success, router]);

  if (!settings) {
    return (
      <div className="py-12">
        <Loader size="md" label="Loading settings..." />
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="razorpay_enabled" value={razorpayEnabled ? 'true' : 'false'} />
      <input type="hidden" name="payglobal_enabled" value={payglobalEnabled ? 'true' : 'false'} />
      <input type="hidden" name="razorpay_test_mode" value={razorpayTestMode ? 'true' : 'false'} />
      <input type="hidden" name="payglobal_test_mode" value={payglobalTestMode ? 'true' : 'false'} />
      
      {/* Active Gateway Selection */}
      <div className="bg-linear-to-br from-[#1E3A5F]/5 to-[#FF6B35]/5 rounded-xl p-6 border-2 border-[#1E3A5F]/10">
        <h3 className="text-xl font-bold text-[#1E3A5F] mb-2">
          Active Payment Gateway <span className="text-red-500">*</span>
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Select the payment gateway that will be used for all customer payments. Only one gateway can be active at a time.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> When you select a payment gateway as active, it will automatically be enabled and the other gateway will be disabled. Customers will only see the active gateway.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label 
            onClick={() => {
              setActiveGateway('razorpay');
              setRazorpayEnabled(true);
              setPayglobalEnabled(false);
            }}
            className={`flex items-center p-4 border-2 rounded-lg transition-all cursor-pointer ${
              activeGateway === 'razorpay'
                ? 'border-[#FF6B35] bg-linear-to-br from-[#FF6B35]/10 to-[#1E3A5F]/10 shadow-lg ring-2 ring-[#FF6B35]/20'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="active_gateway"
              value="razorpay"
              checked={activeGateway === 'razorpay'}
              onChange={(e) => {
                setActiveGateway(e.target.value as 'razorpay');
                setRazorpayEnabled(true);
                setPayglobalEnabled(false);
              }}
              className="h-5 w-5 text-[#FF6B35] focus:ring-[#FF6B35]/20 cursor-pointer"
              required
            />
            <div className="ml-4 flex-1">
              <div className="flex items-center gap-2">
                <div className="text-base font-bold text-gray-900">Razorpay</div>
                {activeGateway === 'razorpay' && (
                  <span className="px-2 py-0.5 text-xs font-semibold text-green-700 bg-green-100 rounded">
                    Active
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {activeGateway === 'razorpay' ? 'Currently active - customers will use this gateway' : 'Click to activate'}
              </div>
            </div>
          </label>

          <label 
            onClick={() => {
              setActiveGateway('payglobal');
              setPayglobalEnabled(true);
              setRazorpayEnabled(false);
            }}
            className={`flex items-center p-4 border-2 rounded-lg transition-all cursor-pointer ${
              activeGateway === 'payglobal'
                ? 'border-[#FF6B35] bg-linear-to-br from-[#FF6B35]/10 to-[#1E3A5F]/10 shadow-lg ring-2 ring-[#FF6B35]/20'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="active_gateway"
              value="payglobal"
              checked={activeGateway === 'payglobal'}
              onChange={(e) => {
                setActiveGateway(e.target.value as 'payglobal');
                setPayglobalEnabled(true);
                setRazorpayEnabled(false);
              }}
              className="h-5 w-5 text-[#FF6B35] focus:ring-[#FF6B35]/20 cursor-pointer"
              required
            />
            <div className="ml-4 flex-1">
              <div className="flex items-center gap-2">
                <div className="text-base font-bold text-gray-900">PayGlocal</div>
                {activeGateway === 'payglobal' && (
                  <span className="px-2 py-0.5 text-xs font-semibold text-green-700 bg-green-100 rounded">
                    Active
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {activeGateway === 'payglobal' ? 'Currently active - customers will use this gateway' : 'Click to activate'}
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Razorpay Configuration Section */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-[#1E3A5F]/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#1E3A5F]">Razorpay Configuration</h3>
          <span className={`px-3 py-1 text-xs font-semibold rounded ${
            activeGateway === 'razorpay' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {activeGateway === 'razorpay' ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="space-y-4">
          {/* API Key Status */}
          <div className={`border rounded-lg p-4 ${
            apiKeyStatus?.razorpay_key_id && apiKeyStatus?.razorpay_key_secret
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-2">
              {apiKeyStatus?.razorpay_key_id && apiKeyStatus?.razorpay_key_secret ? (
                <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <div className="flex-1">
                <p className={`text-sm font-semibold mb-1 ${
                  apiKeyStatus?.razorpay_key_id && apiKeyStatus?.razorpay_key_secret
                    ? 'text-green-900'
                    : 'text-red-900'
                }`}>
                  API Keys Status
                </p>
                <div className="text-xs space-y-1">
                  <div className={`flex items-center gap-2 ${
                    apiKeyStatus?.razorpay_key_id ? 'text-green-700' : 'text-red-700'
                  }`}>
                    <span>{apiKeyStatus?.razorpay_key_id ? '✓' : '✗'}</span>
                    <span>RAZORPAY_KEY_ID {apiKeyStatus?.razorpay_key_id ? 'configured' : 'missing'}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${
                    apiKeyStatus?.razorpay_key_secret ? 'text-green-700' : 'text-red-700'
                  }`}>
                    <span>{apiKeyStatus?.razorpay_key_secret ? '✓' : '✗'}</span>
                    <span>RAZORPAY_KEY_SECRET {apiKeyStatus?.razorpay_key_secret ? 'configured' : 'missing'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Test Mode Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <label htmlFor="razorpay_test_mode" className="block text-sm font-medium text-gray-900 cursor-pointer">
                Test Mode
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Enable test mode to use Razorpay test credentials. Disable for live payments.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="razorpay_test_mode"
                checked={razorpayTestMode}
                onChange={(e) => setRazorpayTestMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FF6B35]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6B35]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* PayGlobal Configuration Section */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-[#1E3A5F]/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#1E3A5F]">PayGlocal Configuration</h3>
          <span className={`px-3 py-1 text-xs font-semibold rounded ${
            activeGateway === 'payglobal' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {activeGateway === 'payglobal' ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="space-y-4">
          {/* API Key Status */}
          <div className={`border rounded-lg p-4 ${
            apiKeyStatus?.payglobal_merchant_id && apiKeyStatus?.payglobal_api_key && apiKeyStatus?.payglobal_webhook_secret
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-2">
              {apiKeyStatus?.payglobal_merchant_id && apiKeyStatus?.payglobal_api_key && apiKeyStatus?.payglobal_webhook_secret ? (
                <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <div className="flex-1">
                <p className={`text-sm font-semibold mb-1 ${
                  apiKeyStatus?.payglobal_merchant_id && apiKeyStatus?.payglobal_api_key && apiKeyStatus?.payglobal_webhook_secret
                    ? 'text-green-900'
                    : 'text-red-900'
                }`}>
                  API Keys Status
                </p>
                <div className="text-xs space-y-1">
                  <div className={`flex items-center gap-2 ${
                    apiKeyStatus?.payglobal_merchant_id ? 'text-green-700' : 'text-red-700'
                  }`}>
                    <span>{apiKeyStatus?.payglobal_merchant_id ? '✓' : '✗'}</span>
                    <span>PAYGLOBAL_MERCHANT_ID {apiKeyStatus?.payglobal_merchant_id ? 'configured' : 'missing'}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${
                    apiKeyStatus?.payglobal_api_key ? 'text-green-700' : 'text-red-700'
                  }`}>
                    <span>{apiKeyStatus?.payglobal_api_key ? '✓' : '✗'}</span>
                    <span>PAYGLOBAL_API_KEY {apiKeyStatus?.payglobal_api_key ? 'configured' : 'missing'}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${
                    apiKeyStatus?.payglobal_webhook_secret ? 'text-green-700' : 'text-red-700'
                  }`}>
                    <span>{apiKeyStatus?.payglobal_webhook_secret ? '✓' : '✗'}</span>
                    <span>PAYGLOBAL_WEBHOOK_SECRET {apiKeyStatus?.payglobal_webhook_secret ? 'configured' : 'missing'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Test Mode Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <label htmlFor="payglobal_test_mode" className="block text-sm font-medium text-gray-900 cursor-pointer">
                Test Mode
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Enable test mode to use PayGlocal test credentials. Disable for live payments.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="payglobal_test_mode"
                checked={payglobalTestMode}
                onChange={(e) => setPayglobalTestMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FF6B35]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6B35]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900 mb-1">Payment Gateway Configuration</p>
            <p className="text-xs text-blue-700">
              All payment gateway API keys and credentials are configured via environment variables in your <code className="bg-blue-100 px-1 rounded">.env.local</code> file. 
              Webhook URLs are configured in your payment gateway dashboard (Razorpay/PayGlocal).
            </p>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {state?.error && (
        <div className="rounded-lg bg-red-50 border-2 border-red-200 p-4">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-red-800">{state.error}</p>
          </div>
        </div>
      )}

      {state?.success && (
        <div className="rounded-lg bg-green-50 border-2 border-green-200 p-4">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-green-800">Payment gateway configuration updated successfully!</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <SubmitButton />
      </div>
    </form>
  );
}
