'use client';

import { deleteService } from '@/lib/actions/admin/services';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Toast } from '@/components/ui/toast';

interface DeleteServiceButtonProps {
  serviceId: string;
}

export function DeleteServiceButton({ serviceId }: DeleteServiceButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({
    isOpen: false,
    message: '',
    type: 'success',
  });
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteService(serviceId);
    setIsDeleting(false);
    setShowConfirm(false);

    if (result.success) {
      setToast({ isOpen: true, message: 'Service deleted successfully', type: 'success' });
      router.refresh();
    } else {
      setToast({ isOpen: true, message: result.error || 'Failed to delete service', type: 'error' });
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shadow-lg hover:shadow-xl"
      >
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Delete Service"
        message="Are you sure you want to delete this service? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </>
  );
}


