import { getPaymentGatewaySettings, getPaymentGatewayApiKeyStatus } from '@/lib/actions/admin/payment-gateways';
import { PaymentGatewaySettingsForm } from '@/components/admin/payment-gateway-settings-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payment Gateways | Admin',
  description: 'Manage payment gateway settings',
};

export default async function PaymentGatewaysPage() {
  const settings = await getPaymentGatewaySettings();
  const apiKeyStatus = await getPaymentGatewayApiKeyStatus();

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h2 className="text-3xl font-bold bg-linear-to-r from-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent">
          Payment Gateway Settings
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Enable or disable payment gateways, set test/live mode, and configure the active gateway for customer payments
        </p>
      </div>

      <div className="bg-white shadow-xl rounded-xl border-2 border-[#1E3A5F]/10 p-6 sm:p-8">
        <PaymentGatewaySettingsForm settings={settings} apiKeyStatus={apiKeyStatus} />
      </div>
    </div>
  );
}



