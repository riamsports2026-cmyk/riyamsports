'use client';

import { format } from 'date-fns';
import { Payment } from '@/lib/types';

interface PaymentHistoryProps {
  payments: Payment[];
  totalAmount: number;
  receivedAmount: number;
}

export function PaymentHistory({ payments, totalAmount, receivedAmount }: PaymentHistoryProps) {
  const sortedPayments = [...payments].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const balanceAmount = totalAmount - receivedAmount;

  return (
    <div className="space-y-4">
      <div className="bg-linear-to-r from-[#1E3A5F] to-[#2D4F7C] rounded-lg p-4 text-white">
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Payment History
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-white/70 text-xs">Total Amount</div>
            <div className="font-bold text-lg">₹{totalAmount.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-white/70 text-xs">Received</div>
            <div className="font-bold text-lg text-green-300">₹{receivedAmount.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-white/70 text-xs">Balance</div>
            <div className={`font-bold text-lg ${balanceAmount > 0 ? 'text-yellow-300' : 'text-green-300'}`}>
              ₹{balanceAmount.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-white/70 text-xs">Payments</div>
            <div className="font-bold text-lg">{sortedPayments.length}</div>
          </div>
        </div>
      </div>

      {sortedPayments.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-6 text-center border-2 border-gray-200">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 font-medium">No payment records found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border-2 border-[#1E3A5F]/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#1E3A5F]/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#1E3A5F] uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#1E3A5F] uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#1E3A5F] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#1E3A5F] uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#1E3A5F] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#1E3A5F] uppercase tracking-wider">
                    Gateway
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedPayments.map((payment) => {
                  const paymentDate = new Date(payment.created_at);
                  const isSuccess = payment.status === 'success';
                  
                  return (
                    <tr key={payment.id} className="hover:bg-[#FF6B35]/5 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">
                          {format(paymentDate, 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(paymentDate, 'hh:mm a')}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-[#1E3A5F]">
                        ₹{Number(payment.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {payment.payment_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 capitalize">
                        {(payment as any).payment_method || 'online'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isSuccess ? 'bg-green-100 text-green-800' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {payment.status === 'success' ? '✅ Success' :
                           payment.status === 'pending' ? '⏳ Pending' :
                           payment.status === 'failed' ? '❌ Failed' :
                           payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {payment.payment_type === 'manual' ? (
                          <span className="text-gray-500">Manual Entry</span>
                        ) : (
                          <span className="capitalize">{payment.payment_gateway}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}



