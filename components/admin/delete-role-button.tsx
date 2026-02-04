'use client';

import { deleteRole } from '@/lib/actions/admin/roles';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Toast } from '@/components/ui/toast';

interface DeleteRoleButtonProps {
  roleId: string;
}

export function DeleteRoleButton({ roleId }: DeleteRoleButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({
    isOpen: false,
    message: '',
    type: 'success',
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    setShowConfirm(false);

    try {
      const result = await deleteRole(roleId);
      if (result.error) {
        setToast({ isOpen: true, message: result.error, type: 'error' });
      } else {
        setToast({ isOpen: true, message: 'Role deleted successfully', type: 'success' });
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (_err) {
      setToast({ isOpen: true, message: 'Failed to delete role', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
      >
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Delete Role"
        message="Are you sure you want to delete this role? This action cannot be undone."
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


