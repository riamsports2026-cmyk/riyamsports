'use client';

import { useEffect } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'info',
}: ConfirmDialogProps) {
  // Lock body scroll when dialog is open and handle ESC key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onCancel();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      confirmBg: 'bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    warning: {
      confirmBg: 'bg-linear-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    info: {
      confirmBg: 'bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35]',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-100 animate-in fade-in">
      <div className="min-h-full flex items-center justify-center p-4" onClick={(e) => {
        // Only close if clicking the overlay, not the dialog content
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}>
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="p-6">
            <div className="flex items-start">
              <div className={`shrink-0 ${styles.iconBg} rounded-full p-2`}>
                <div className={styles.iconColor}>
                  {styles.icon}
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-bold text-[#1E3A5F] mb-2">
                  {title}
                </h3>
                <p className="text-sm text-gray-600">
                  {message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border-2 border-[#1E3A5F]/30 text-[#1E3A5F] rounded-lg text-sm font-semibold hover:bg-[#1E3A5F]/5 hover:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 transition-all cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`px-4 py-2 text-white rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all cursor-pointer shadow-lg hover:shadow-xl ${styles.confirmBg}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

