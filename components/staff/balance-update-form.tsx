'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateReceivedBalance } from '@/lib/actions/staff/bookings';
import { Toast } from '@/components/ui/toast';

interface BalanceUpdateFormProps {
  bookingId: string;
  totalAmount: number;
  currentReceived: number;
  onUpdate?: () => void;
}

export function BalanceUpdateForm({
  bookingId,
  totalAmount,
  currentReceived,
  onUpdate,
}: BalanceUpdateFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<string>(currentReceived.toString());
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({
    isOpen: false,
    message: '',
    type: 'success',
  });

  const balanceAmount = totalAmount - currentReceived;
  const receivedAmount = parseFloat(amount) || 0;
  // Validate: receivedAmount must be between currentReceived and totalAmount (can only add up to remaining balance)
  const isInvalidAmount = receivedAmount < currentReceived || receivedAmount > totalAmount || isNaN(receivedAmount);

  // Update local state when currentReceived prop changes (after refresh)
  useEffect(() => {
    setAmount(currentReceived.toString());
  }, [currentReceived]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleUpdate = async () => {
    if (receivedAmount < currentReceived) {
      setToast({ isOpen: true, message: `Amount cannot be less than already received (₹${currentReceived.toLocaleString()})`, type: 'error' });
      return;
    }

    if (receivedAmount > totalAmount) {
      setToast({ isOpen: true, message: `Amount cannot exceed total amount (₹${totalAmount.toLocaleString()})`, type: 'error' });
      return;
    }

    // Check if trying to add more than remaining balance
    const additionalAmount = receivedAmount - currentReceived;
    if (additionalAmount > balanceAmount) {
      setToast({ isOpen: true, message: `You can only add up to the remaining balance (₹${balanceAmount.toLocaleString()})`, type: 'error' });
      return;
    }

    setIsUpdating(true);
    const result = await updateReceivedBalance(bookingId, receivedAmount);
    setIsUpdating(false);

    if (result.error) {
      setToast({ isOpen: true, message: result.error, type: 'error' });
    } else {
      setToast({ isOpen: true, message: 'Balance updated successfully', type: 'success' });
      setIsOpen(false);
      // Refresh the page to show updated data
      router.refresh();
      if (onUpdate) {
        onUpdate();
      }
    }
  };

  return (
    <>
      <div className="space-y-2">
        <div className="text-xs sm:text-sm text-gray-600">
          <div className="flex justify-between mb-1">
            <span>Total Amount:</span>
            <span className="font-semibold text-[#1E3A5F]">₹{totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Received:</span>
            <span className="font-semibold text-green-600">₹{currentReceived.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Balance:</span>
            <span className={`font-semibold ${balanceAmount > 0 ? 'text-[#FF6B35]' : 'text-green-600'}`}>
              ₹{balanceAmount.toLocaleString()}
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full sm:w-auto px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 transition-all cursor-pointer shadow-md hover:shadow-lg"
        >
          Update Balance
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-100 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 my-auto animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#1E3A5F] mb-4">Update Received Balance</h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-semibold text-[#1E3A5F]">₹{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Current Received:</span>
                  <span className="font-semibold text-green-600">₹{currentReceived.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Remaining Balance:</span>
                  <span className="font-semibold text-[#FF6B35]">₹{balanceAmount.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E3A5F] mb-2">
                  Received Amount (₹)
                </label>
                <input
                  type="number"
                  min={currentReceived}
                  max={totalAmount}
                  step="0.01"
                  value={amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow any value while typing - we'll validate on blur
                    setAmount(value);
                  }}
                  onBlur={(e) => {
                    // Validate and correct on blur (when user leaves the field)
                    const value = e.target.value;
                    if (value === '') {
                      setAmount(currentReceived.toString());
                      return;
                    }
                    const numValue = parseFloat(value);
                    if (isNaN(numValue)) {
                      setAmount(currentReceived.toString());
                      return;
                    }
                    // Clamp value between currentReceived and totalAmount
                    if (numValue < currentReceived) {
                      setAmount(currentReceived.toString());
                    } else if (numValue > totalAmount) {
                      setAmount(totalAmount.toString());
                    }
                  }}
                  className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 text-sm ${
                    isInvalidAmount && amount !== ''
                      ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-[#1E3A5F]/30 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]'
                  }`}
                  placeholder={`Enter total received (min: ₹${currentReceived.toLocaleString()})`}
                />
                {isInvalidAmount && amount !== '' && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {receivedAmount < currentReceived 
                      ? `Amount cannot be less than already received (₹${currentReceived.toLocaleString()})` 
                      : receivedAmount > totalAmount 
                      ? `Amount cannot exceed total amount (₹${totalAmount.toLocaleString()})`
                      : 'Please enter a valid amount'}
                  </p>
                )}
                {!isInvalidAmount && amount !== '' && (
                  <p className="mt-1 text-xs text-gray-500">
                    You can add up to ₹{balanceAmount.toLocaleString()} (remaining balance)
                  </p>
                )}
                {amount === '' && (
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum: ₹{currentReceived.toLocaleString()} | Maximum: ₹{totalAmount.toLocaleString()}
                  </p>
                )}
              </div>

              {receivedAmount > currentReceived && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Additional Payment:</span>
                    <span className="font-semibold text-[#1E3A5F]">
                      ₹{(receivedAmount - currentReceived).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">New Total Received:</span>
                    <span className="font-semibold text-green-600">
                      ₹{receivedAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">New Balance:</span>
                    <span className={`font-semibold ${(totalAmount - receivedAmount) > 0 ? 'text-[#FF6B35]' : 'text-green-600'}`}>
                      ₹{(totalAmount - receivedAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                    Payment status will be: {
                      receivedAmount >= totalAmount ? 'Paid' :
                      receivedAmount > currentReceived ? 'Partial' :
                      'Pending Payment'
                    }
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setAmount(currentReceived.toString());
                }}
                disabled={isUpdating}
                className="px-4 py-2 border-2 border-[#1E3A5F]/30 text-[#1E3A5F] rounded-lg text-sm font-semibold hover:bg-[#1E3A5F]/5 hover:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={isUpdating || receivedAmount === currentReceived || isInvalidAmount || amount === ''}
                className="px-4 py-2 text-white rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all shadow-lg hover:shadow-xl bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Updating...' : 'Update'}
              </button>
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

