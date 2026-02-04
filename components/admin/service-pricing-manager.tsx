'use client';

import { useState, useEffect } from 'react';
import { updateServicePricing } from '@/lib/actions/admin/service-pricing';
// TEMPORARILY DISABLED - Sync turf pricing
// import { syncTurfPricingFromService } from '@/lib/actions/admin/service-pricing';
import { useActionState } from 'react';
import { Toast } from '@/components/ui/toast';

interface ServicePricingManagerProps {
  serviceId: string;
  initialPricing: Array<{ hour: number; price: number }>;
}

export function ServicePricingManager({ serviceId, initialPricing }: ServicePricingManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Get initial price from existing pricing (use first hour's price or default to 1000)
  const initialPrice = initialPricing.length > 0 ? String(initialPricing[0].price) : '1000';
  const [defaultPrice, setDefaultPrice] = useState<string>(initialPrice);
  const [state, formAction] = useActionState(updateServicePricing, null);
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    isOpen: false,
    message: '',
    type: 'success',
  });

  // Update default price when initialPricing changes
  useEffect(() => {
    if (initialPricing.length > 0) {
      setDefaultPrice(String(initialPricing[0].price));
    }
  }, [initialPricing]);

  /* TEMPORARILY DISABLED - Sync turf pricing
  const handleSyncPricing = async () => {
    setIsSyncing(true);
    try {
      const result = await syncTurfPricingFromService(serviceId);
      if (result.success) {
        setToast({ isOpen: true, message: `Successfully synced pricing to ${result.updated || 0} turf(s).`, type: 'success' });
        setIsOpen(false);
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setToast({ isOpen: true, message: `Error syncing pricing: ${result.error}`, type: 'error' });
      }
    } catch (error: any) {
      setToast({ isOpen: true, message: `Error syncing pricing: ${error.message}`, type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };
  */

  // Show success message when pricing is saved
  useEffect(() => {
    if (state?.success) {
      setToast({ isOpen: true, message: 'Pricing saved successfully!', type: 'success' });
      setIsOpen(false);
    }
  }, [state]);

  const handleFormAction = (formData: FormData) => {
    // Use default price for all 24 hours directly
    const priceValue = parseFloat(defaultPrice) || 1000;
    const allHoursPricing = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      price: priceValue,
    }));
    
    formData.append('service_id', serviceId);
    formData.append('pricing', JSON.stringify(allHoursPricing));
    return formAction(formData);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-sm text-[#FF6B35] hover:text-[#E55A2B] font-medium cursor-pointer"
      >
        Manage Pricing
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Set Service Price</h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form action={handleFormAction}>
                <div className="mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                    <p className="text-sm text-blue-800 font-medium">💡 Set the price per hour for all booking slots</p>
                  </div>
                  
                  <div className="flex flex-col items-center gap-4">
                    <label htmlFor="default-price" className="text-sm font-medium text-gray-700">
                      Price per Hour (₹)
                    </label>
                    <input
                      type="number"
                      id="default-price"
                      min="0"
                      step="1"
                      value={defaultPrice}
                      onChange={(e) => setDefaultPrice(e.target.value)}
                      className="w-40 px-4 py-3 text-xl text-center border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35]"
                      placeholder="1000"
                    />
                    {/* <p className="text-xs text-gray-500">
                      This price will apply to all 24 hours
                    </p> */}
                  </div>
                </div>

                {state?.error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{state.error}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white rounded-md text-sm font-medium bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35] cursor-pointer shadow-lg hover:shadow-xl transition-all"
                  >
                    Save Pricing
                  </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </>
  );
}

