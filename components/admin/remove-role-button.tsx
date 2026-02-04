'use client';

import { removeLocationRole } from '@/lib/actions/admin/user-roles';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Toast } from '@/components/ui/toast';

interface RemoveRoleButtonProps {
  userId: string;
  roleId: string;
  locationId: string | null;
}

export function RemoveRoleButton({ userId, roleId, locationId }: RemoveRoleButtonProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({
    isOpen: false,
    message: '',
    type: 'success',
  });

  const handleRemove = async () => {
    setIsRemoving(true);
    setShowConfirm(false);

    try {
      const result = await removeLocationRole(userId, roleId, locationId);
      if (result.error) {
        setToast({ isOpen: true, message: result.error, type: 'error' });
      } else {
        setToast({ isOpen: true, message: 'Role assignment removed successfully', type: 'success' });
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (_err) {
      setToast({ isOpen: true, message: 'Failed to remove role', type: 'error' });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isRemoving}
        className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
      >
        {isRemoving ? 'Removing...' : 'Remove'}
      </button>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Remove Role Assignment"
        message="Are you sure you want to remove this role assignment?"
        confirmText="Remove"
        cancelText="Cancel"
        variant="warning"
        onConfirm={handleRemove}
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


