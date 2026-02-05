'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateReceivedBalance } from '@/lib/actions/admin/bookings';
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
  const [additionalAmount, setAdditionalAmount] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({
    isOpen: false,
    message: '',
    type: 'success',
  });

  const remainingBalance = totalAmount - currentReceived;
  const additionalNum = parseFloat(additionalAmount) || 0;
  const newTotalReceived = currentReceived + additionalNum;
  const isInvalidAdditional = additionalNum < 0 || additionalNum > remainingBalance || (additionalAmount !== '' && isNaN(additionalNum));

  // Reset when modal opens or currentReceived changes
  useEffect(() => {
    if (isOpen) setAdditionalAmount('');
  }, [isOpen, currentReceived]);

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
    if (additionalNum <= 0) {
      setToast({ isOpen: true, message: 'Please enter an amount to add (greater than 0)', type: 'error' });
      return;
    }
    if (additionalNum > remainingBalance) {
      setToast({ isOpen: true, message: `You can add at most ₹${remainingBalance.toLocaleString()} (remaining balance)`, type: 'error' });
      return;
    }

    const newTotal = currentReceived + additionalNum;
    setIsUpdating(true);
    const result = await updateReceivedBalance(bookingId, newTotal);
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
            <span className={`font-semibold ${remainingBalance > 0 ? 'text-[#FF6B35]' : 'text-green-600'}`}>
              ₹{remainingBalance.toLocaleString()}
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 10050 }}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 my-auto max-h-[90vh] overflow-y-auto" style={{ zIndex: 10051 }}>
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
                  <span className="font-semibold text-[#FF6B35]">₹{remainingBalance.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E3A5F] mb-2">
                  Amount to add now (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  max={remainingBalance}
                  step="0.01"
                  value={additionalAmount}
                  onChange={(e) => setAdditionalAmount(e.target.value)}
                  className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 text-sm ${
                    isInvalidAdditional && additionalAmount !== ''
                      ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-[#1E3A5F]/30 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]'
                  }`}
                  placeholder="e.g. 100"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {/* Enter how much you are receiving now. <br/> */}
                  You can add up to ₹{remainingBalance.toLocaleString()} (remaining balance).
                </p>
                {isInvalidAdditional && additionalAmount !== '' && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {additionalNum < 0
                      ? 'Amount cannot be negative'
                      : additionalNum > remainingBalance
                      ? `Cannot add more than remaining balance (₹${remainingBalance.toLocaleString()})`
                      : 'Please enter a valid amount'}
                  </p>
                )}
              </div>

              {additionalNum > 0 && !isInvalidAdditional && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Adding now:</span>
                    <span className="font-semibold text-[#1E3A5F]">₹{additionalNum.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">New total received:</span>
                    <span className="font-semibold text-green-600">₹{newTotalReceived.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">New balance:</span>
                    <span className={`font-semibold ${(totalAmount - newTotalReceived) > 0 ? 'text-[#FF6B35]' : 'text-green-600'}`}>
                      ₹{(totalAmount - newTotalReceived).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                    Payment status will be: {
                      newTotalReceived >= totalAmount ? 'Paid' :
                      newTotalReceived > currentReceived ? 'Partial' :
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
                  setAdditionalAmount('');
                }}
                disabled={isUpdating}
                className="px-4 py-2 border-2 border-[#1E3A5F]/30 text-[#1E3A5F] rounded-lg text-sm font-semibold hover:bg-[#1E3A5F]/5 hover:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={isUpdating || additionalNum <= 0 || isInvalidAdditional}
                className="px-4 cursor-pointer py-2 text-white rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all shadow-lg hover:shadow-xl bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35] disabled:opacity-50 disabled:cursor-not-allowed"
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

