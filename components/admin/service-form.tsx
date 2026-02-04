'use client';

import { createService, updateService } from '@/lib/actions/admin/services';
import { Service, Location } from '@/lib/types';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ImageUpload } from '@/components/ui/image-upload';

interface ServiceFormProps {
  service?: Service;
  locations?: Location[];
  serviceLocationIds?: string[];
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

export function ServiceForm({ service, locations = [], serviceLocationIds = [] }: ServiceFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(serviceLocationIds);
  const [imageUrl, setImageUrl] = useState<string>(service?.image_url || '');
  const [state, formAction] = useActionState(
    service ? updateService : createService,
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

  useEffect(() => {
    if (service && serviceLocationIds.length > 0) {
      setSelectedLocations(serviceLocationIds);
    }
  }, [service, serviceLocationIds]);

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
        {service ? 'Edit' : '+ Add Service'}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {service ? 'Edit Service' : 'Create Service'}
            </h3>
          <form action={formAction} className="space-y-4">
            {service && <input type="hidden" name="id" value={service.id} />}
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                defaultValue={service?.name}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#FF6B35]/30 focus:border-[#FF6B35]"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                defaultValue={service?.description || ''}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#FF6B35]/30 focus:border-[#FF6B35]"
              />
            </div>

            <div>
              <ImageUpload
                currentImage={service?.image_url}
                onImageUploaded={(url) => setImageUrl(url)}
                type="service"
                label="Service Image"
              />
              <input type="hidden" name="image_url" value={imageUrl} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available at Locations
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3 space-y-2">
                {locations.length === 0 ? (
                  <p className="text-sm text-gray-500">No locations available</p>
                ) : (
                  locations.map((location) => (
                    <label key={location.id} className="flex items-center">
                      <input
                        type="checkbox"
                        name="location_ids"
                        value={location.id}
                        checked={selectedLocations.includes(location.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLocations([...selectedLocations, location.id]);
                          } else {
                            setSelectedLocations(selectedLocations.filter(id => id !== location.id));
                          }
                        }}
                        className="h-4 w-4 text-[#FF6B35] focus:ring-[#FF6B35]/30 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-900">{location.name}</span>
                      {selectedLocations.includes(location.id) && (
                        <input type="hidden" name="location_ids" value={location.id} />
                      )}
                    </label>
                  ))
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Select locations where this service is available
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                id="is_active"
                value="true"
                defaultChecked={service?.is_active ?? true}
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
              <SubmitButton isEdit={!!service} />
            </div>
          </form>
          {state?.success && (
            <div className="mt-4 rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">Service saved successfully! Closing...</p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

