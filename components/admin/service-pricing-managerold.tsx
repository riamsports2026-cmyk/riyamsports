'use client';

import { useState, useEffect } from 'react';
import { updateServicePricing, syncTurfPricingFromService } from '@/lib/actions/admin/service-pricing';
import { useActionState } from 'react';
import { Toast } from '@/components/ui/toast';

interface ServicePricingManagerProps {
  serviceId: string;
  initialPricing: Array<{ hour: number; price: number }>;
}

export function ServicePricingManager({ serviceId, initialPricing }: ServicePricingManagerProps) {
  // Helper function to merge initial pricing into all 24 hours
  const mergePricing = (existingPricing: Array<{ hour: number; price: number }>) => {
    const allHours: Array<{ hour: number; price: number | string }> = Array.from(
      { length: 24 },
      (_, i) => ({ hour: i, price: '' as number | string })
    );
    existingPricing.forEach((existing) => {
      const hourIndex = allHours.findIndex((h) => h.hour === existing.hour);
      if (hourIndex !== -1) {
        allHours[hourIndex].price = existing.price;
      }
    });
    return allHours;
  };

  const [pricing, setPricing] = useState<Array<{ hour: number; price: number | string }>>(
    mergePricing(initialPricing)
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [defaultPrice, setDefaultPrice] = useState<string>('1000');
  const [state, formAction] = useActionState(updateServicePricing, null);
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    isOpen: false,
    message: '',
    type: 'success',
  });

  // Update pricing when initialPricing changes (after save/reload)
  useEffect(() => {
    setPricing(mergePricing(initialPricing));
  }, [initialPricing]);

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

  useEffect(() => {
    if (state?.success) {
      // Auto-sync turf pricing after service pricing is updated
      handleSyncPricing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const handlePriceChange = (hour: number, value: string) => {
    setPricing((prev) =>
      prev.map((p) => (p.hour === hour ? { ...p, price: value } : p))
    );
  };

  const handleFormAction = (formData: FormData) => {
    formData.append('service_id', serviceId);
    formData.append('pricing', JSON.stringify(
      pricing
        .filter((p) => p.price !== '' && p.price !== null)
        .map((p) => ({
          hour: p.hour,
          price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
        }))
    ));
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
                <h3 className="text-xl font-bold text-gray-900">Manage Hourly Pricing</h3>
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
                <div className="mb-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                    <p className="text-sm text-blue-800 font-medium mb-1">💡 How it works:</p>
                    <ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
                      <li>Only hours with prices set will be available for booking</li>
                      <li>Hours without prices (empty) will be disabled/blurred for customers</li>
                      <li>This pricing will be applied to all turfs created for this service</li>
                      <li>Leave empty if you don&apos;t want that hour to be bookable</li>
                    </ul>
                  </div>
                  <div className="mb-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                      <p className="text-sm text-gray-600">
                        Set hourly pricing for this service. Prices are in ₹ (Indian Rupees).
                      </p>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-2">
                          <label htmlFor="default-price" className="text-xs text-gray-600 whitespace-nowrap">
                            Default Price:
                          </label>
                          <input
                            type="number"
                            id="default-price"
                            min="0"
                            step="0.01"
                            value={defaultPrice}
                            onChange={(e) => setDefaultPrice(e.target.value)}
                            className="w-24 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35]"
                            placeholder="1000"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const priceValue = defaultPrice.trim() === '' ? '1000' : defaultPrice;
                            const defaultPricing = pricing.map((p) => ({
                              ...p,
                              price: priceValue,
                            }));
                            setPricing(defaultPricing);
                          }}
                          className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 border border-gray-300 cursor-pointer whitespace-nowrap"
                          title="Fill all hours with the default price"
                        >
                          Set Default Pricing
                        </button>
                        <button
                          type="button"
                          onClick={handleSyncPricing}
                          disabled={isSyncing}
                          className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 border border-green-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                          title="Sync this pricing to all existing turfs for this service"
                        >
                          {isSyncing ? 'Syncing...' : 'Sync to Turfs'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {pricing.map((p) => {
                      const isEmpty = p.price === '' || p.price === null;
                      return (
                        <div key={p.hour} className="flex flex-col">
                          <label className={`text-xs font-medium mb-1 ${isEmpty ? 'text-gray-400' : 'text-gray-700'}`}>
                            {p.hour === 0
                              ? '12am'
                              : p.hour < 12
                              ? `${p.hour}am`
                              : p.hour === 12
                              ? '12pm'
                              : `${p.hour - 12}pm`}
                            {isEmpty && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={p.price}
                            onChange={(e) => handlePriceChange(p.hour, e.target.value)}
                            placeholder="0.00"
                            className={`px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 ${
                              isEmpty 
                                ? 'border-gray-200 bg-gray-50' 
                                : 'border-gray-300 bg-white'
                            }`}
                          />
                          {isEmpty && (
                            <span className="text-xs text-gray-400 mt-1">Will be disabled</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    * Hours without prices will be disabled for customers. Set a price to make them bookable.
                  </p>
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

