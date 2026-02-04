'use client';

import { useState, useEffect } from 'react';
import { Location, Service } from '@/lib/types';
import { Toast } from '@/components/ui/toast';

interface LocationServicesManagerProps {
  location: Location;
  allServices: Service[];
  currentServiceIds: string[];
}

export function LocationServicesManager({
  location,
  allServices,
  currentServiceIds,
}: LocationServicesManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>(currentServiceIds);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({
    isOpen: false,
    message: '',
    type: 'success',
  });

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('location_id', location.id);
      selectedServices.forEach(serviceId => {
        formData.append('service_ids', serviceId);
      });

      const response = await fetch('/api/admin/location-services', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // Auto-create turfs for newly linked services
        try {
          await fetch('/api/admin/auto-create-turfs', {
            method: 'POST',
          });
        } catch (e) {
          // Ignore errors in auto-creation, it's not critical
          console.warn('Failed to auto-create turfs:', e);
        }
        
        setIsOpen(false);
        setToast({ isOpen: true, message: 'Services updated successfully', type: 'success' });
        setTimeout(() => window.location.reload(), 1000); // Refresh to show updated services
      } else {
        const error = await response.json();
        setToast({ isOpen: true, message: error.error || 'Failed to update services', type: 'error' });
      }
    } catch (error) {
      setToast({ isOpen: true, message: 'Failed to update services', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-[#FF6B35] hover:text-[#E55A2B] cursor-pointer font-semibold"
      >
        Manage Sports
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Manage Sports for {location.name}
            </h3>
            
            <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-md p-3 space-y-2 mb-4">
            {allServices.length === 0 ? (
              <p className="text-sm text-gray-500">No services available</p>
            ) : (
              allServices.map((service) => (
                <label key={service.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedServices([...selectedServices, service.id]);
                      } else {
                        setSelectedServices(selectedServices.filter(id => id !== service.id));
                      }
                    }}
                    className="h-4 w-4 text-[#FF6B35] focus:ring-[#FF6B35]/20 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">{service.name}</span>
                </label>
              ))
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setSelectedServices(currentServiceIds);
              }}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-linear-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#E55A2B] hover:to-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B35]/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
          </div>
        </div>
      </div>

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  );
}

