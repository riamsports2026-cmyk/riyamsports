'use client';

import { createLocation, updateLocation } from '@/lib/actions/admin/locations';
import { Location } from '@/lib/types';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LocationFormProps {
  location?: Location & { google_maps_address?: string };
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B35]/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
    >
      {pending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
    </button>
  );
}

export function LocationForm({ location }: LocationFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useActionState(
    location ? updateLocation : createLocation,
    null
  );

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
        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
      >
        {location ? 'Edit' : '+ Add Location'}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {location ? 'Edit Location' : 'Create Location'}
            </h3>
            <form action={formAction} className="space-y-4">
            {location && <input type="hidden" name="id" value={location.id} />}
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                defaultValue={location?.name}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                id="address"
                required
                defaultValue={location?.address}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City (Optional)
                </label>
                <input
                  type="text"
                  name="city"
                  id="city"
                  defaultValue={location?.city || ''}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
                />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State (Optional)
                </label>
                <input
                  type="text"
                  name="state"
                  id="state"
                  defaultValue={location?.state || ''}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                Pincode (Optional)
              </label>
              <input
                type="text"
                name="pincode"
                id="pincode"
                pattern="\d{6}"
                defaultValue={location?.pincode || ''}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
              />
            </div>

            <div>
              <label htmlFor="google_maps_address" className="block text-sm font-medium text-gray-700">
                Google Maps Address (Optional)
              </label>
              <input
                type="text"
                name="google_maps_address"
                id="google_maps_address"
                placeholder="e.g., Exact address, coordinates, or landmark for Google Maps"
                defaultValue={location?.google_maps_address || ''}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
              />
              <p className="mt-1 text-xs text-gray-500">
                If provided, this address will be used for &quot;Get Directions&quot; instead of the regular address above.
                You can enter coordinates (e.g. &quot;12.9716,77.5946&quot;) or a more specific address.
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                id="is_active"
                value="true"
                defaultChecked={location?.is_active ?? true}
                className="h-4 w-4 text-[#FF6B35] focus:ring-[#FF6B35]/20 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                Active (Optional - checked by default)
              </label>
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
              <SubmitButton isEdit={!!location} />
            </div>
          </form>
          {state?.success && (
            <div className="mt-4 rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">Location saved successfully! Closing...</p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}


