'use client';

import { createRole, updateRole } from '@/lib/actions/admin/roles';
import { Role } from '@/lib/types';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface RoleFormProps {
  role?: Role & { description?: string | null; is_system_role?: boolean };
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B35]/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
    >
      {pending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
    </button>
  );
}

export function RoleForm({ role }: RoleFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useActionState(role ? updateRole : createRole, null);

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

  // Close modal and refresh page on success
  useEffect(() => {
    if (state?.success) {
      setTimeout(() => {
        setIsOpen(false);
        router.refresh();
      }, 1500);
    }
  }, [state?.success, router]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
      >
        {role ? 'Edit' : '+ New Role'}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {role ? 'Edit Role' : 'Create New Role'}
            </h3>
          <form action={formAction} className="space-y-4">
            {role && <input type="hidden" name="id" value={role.id} />}
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                defaultValue={role?.name?.replace(/_/g, ' ') || ''}
                placeholder="e.g., Branch Manager, Sales Executive"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
              />
              <p className="mt-1 text-xs text-gray-500">
                Spaces will be converted to underscores (e.g. &quot;Branch Manager&quot; → &quot;branch_manager&quot;)
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                defaultValue={role?.description || ''}
                placeholder="Describe the role's responsibilities..."
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
              />
            </div>

            {state?.error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{state.error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed"
                disabled={state?.success}
              >
                Cancel
              </button>
              <SubmitButton isEdit={!!role} />
            </div>
          </form>
          {state?.success && (
            <div className="mt-4 rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">Role {role ? 'updated' : 'created'} successfully! Closing...</p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}


