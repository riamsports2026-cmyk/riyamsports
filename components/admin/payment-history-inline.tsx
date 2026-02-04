'use client';

import { format } from 'date-fns';
import { Payment } from '@/lib/types';
import { useState } from 'react';

interface PaymentHistoryInlineProps {
  payments: Payment[];
  bookingId: string;
}

export function PaymentHistoryInline({ payments, bookingId }: PaymentHistoryInlineProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const sortedPayments = [...payments].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (payments.length === 0) {
    return (
      <div className="text-xs text-gray-500 italic">No payments yet</div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left text-xs font-semibold text-[#FF6B35] hover:text-[#E55A2B] flex items-center justify-between cursor-pointer"
      >
        <span>View Payment History ({payments.length})</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 max-h-64 overflow-y-auto">
          <div className="space-y-2">
            {sortedPayments.map((payment) => {
              const paymentDate = new Date(payment.created_at);
              const isSuccess = payment.status === 'success';
              
              return (
                <div 
                  key={payment.id} 
                  className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:border-[#FF6B35] transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#1E3A5F]">
                        ₹{Number(payment.amount).toLocaleString()}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isSuccess ? 'bg-green-100 text-green-800' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payment.status === 'success' ? '✅' : payment.status === 'pending' ? '⏳' : '❌'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      <span className="font-semibold">{format(paymentDate, 'MMM dd, yyyy')}</span>
                      {' '}at{' '}
                      <span className="font-semibold text-[#FF6B35]">{format(paymentDate, 'hh:mm a')}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 capitalize">
                      {payment.payment_type} • {(payment as any).payment_method || 'online'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}



