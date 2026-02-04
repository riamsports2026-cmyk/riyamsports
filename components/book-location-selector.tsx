'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SafeImage } from '@/components/ui/safe-image';
import { Loader } from '@/components/ui/loader';

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

const SPORTS_FALLBACK_ICONS = ['⚽', '🏀', '🎾', '🏐', '🥏'] as const;
function getSportIconFallback(index: number): string {
  return SPORTS_FALLBACK_ICONS[index % SPORTS_FALLBACK_ICONS.length];
}

interface BookLocationSelectorProps {
  locations: Location[];
  services: Service[];
  initialLocationId?: string;
  initialServiceId?: string;
}

export function BookLocationSelector({
  locations: allLocations,
  services: allServices,
  initialLocationId,
  initialServiceId,
}: BookLocationSelectorProps) {
  const router = useRouter();
  const parseInitialServiceIds = (s?: string): string[] => {
    if (!s?.trim()) return [];
    return s.split(',').map((id) => id.trim()).filter(Boolean);
  };

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    initialLocationId || null
  );
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(() =>
    parseInitialServiceIds(initialServiceId)
  );
  const [filteredLocations, setFilteredLocations] = useState<Location[]>(allLocations);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    initialLocationId
      ? allLocations.find((l) => l.id === initialLocationId) || null
      : null
  );
  const servicesSectionRef = useRef<HTMLDivElement>(null);
  const sportDropdownRef = useRef<HTMLDivElement>(null);
  const [sportDropdownOpen, setSportDropdownOpen] = useState(false);

  const applyServiceFilter = async (serviceIds: string[]) => {
    setSelectedServiceIds(serviceIds);
    setSelectedLocationId(null);
    setSelectedLocation(null);
    setServices([]);

    const q = serviceIds.length ? `?service=${serviceIds.join(',')}` : '';
    router.push(`/book${q}`, { scroll: false });

    if (serviceIds.length === 0) {
      setFilteredLocations(allLocations);
      return;
    }

    setLoadingLocations(true);
    try {
      const response = await fetch(`/api/book/locations?serviceIds=${serviceIds.join(',')}`);
      const data = await response.json();
      if (data.locations) {
        setFilteredLocations(data.locations);
      } else {
        setFilteredLocations([]);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      setFilteredLocations([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const toggleSport = (serviceId: string) => {
    const next = selectedServiceIds.includes(serviceId)
      ? selectedServiceIds.filter((id) => id !== serviceId)
      : [...selectedServiceIds, serviceId];
    applyServiceFilter(next);
  };

  const clearSportFilter = () => {
    applyServiceFilter([]);
    setSportDropdownOpen(false);
  };

  const handleLocationSelect = async (location: Location) => {
    setSelectedLocationId(location.id);
    setSelectedLocation(location);
    setLoading(true);
    setServices([]);

    const serviceQ = selectedServiceIds.length ? `service=${selectedServiceIds.join(',')}&` : '';
    router.push(`/book?${serviceQ}location=${location.id}`, { scroll: false });

    try {
      const response = await fetch(`/api/book/services?locationId=${location.id}`);
      const data = await response.json();
      if (data.services) {
        setServices(data.services);
        
        // Scroll to services section on mobile after services load
        setTimeout(() => {
          if (servicesSectionRef.current) {
            servicesSectionRef.current.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            });
          }
        }, 150);
      } else {
        setServices([]);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedLocationId(null);
    setSelectedLocation(null);
    setServices([]);
    const q = selectedServiceIds.length ? `?service=${selectedServiceIds.join(',')}` : '';
    router.push(`/book${q}`, { scroll: false });
  };

  const getGoogleMapsUrl = (location: Location & { google_maps_address?: string }) => {
    const addressToUse =
      location.google_maps_address ||
      `${location.address}, ${location.city}, ${location.state} ${location.pincode}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressToUse)}`;
  };

  // Load filtered locations when initial service(s) provided (e.g. ?service=id1,id2)
  useEffect(() => {
    const ids = parseInitialServiceIds(initialServiceId);
    if (ids.length > 0 && !loadingLocations) {
      applyServiceFilter(ids);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialServiceId]);

  // Load services if initial location is provided
  useEffect(() => {
    if (initialLocationId && selectedLocation && services.length === 0 && !loading) {
      handleLocationSelect(selectedLocation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLocationId]); // Only run when initialLocationId changes

  // Close sport dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sportDropdownRef.current && !sportDropdownRef.current.contains(e.target as Node)) {
        setSportDropdownOpen(false);
      }
    };
    if (sportDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sportDropdownOpen]);

  const selectedServices = allServices.filter((s) => selectedServiceIds.includes(s.id));

  return (
    <div>
      <div className="mb-6 sm:mb-8 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-linear-to-r from-[#1E3A5F] to-[#FF6B35] bg-clip-text text-transparent mb-2">
          Book Your Turf
        </h1>
        <p className="text-[#1E3A5F] text-base sm:text-lg font-medium">Select a location and sport to get started</p>
      </div>

      {/* Service Filter - Multi-select: sport image when available, else emoji */}
      <div className="mb-6 sm:mb-8 bg-white rounded-xl shadow-lg border-2 border-[#1E3A5F]/10 p-4 sm:p-6">
        <p className="text-sm font-semibold text-[#1E3A5F] mb-1">
          🔍 Filter by Sport <span className="text-gray-500 font-normal text-xs">(Optional, multi-select)</span>
        </p>
        <p className="text-xs text-gray-500 mb-3">
          Select one or more sports. Locations that offer <em>any</em> of them are shown. If a location offers both Sport A and Sport B, it appears <strong>once</strong>.
        </p>
        <div ref={sportDropdownRef} className="relative w-full sm:w-auto sm:min-w-[280px]">
          <button
            type="button"
            id="service-filter"
            onClick={() => setSportDropdownOpen((o) => !o)}
            className="w-full flex items-center gap-3 px-4 py-2.5 border-2 border-[#1E3A5F]/20 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] text-[#1E3A5F] font-medium cursor-pointer bg-white text-left"
          >
            {selectedServices.length === 0 ? (
              <>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1E3A5F]/10 text-lg">🏟️</span>
                <span>All Sports</span>
              </>
            ) : selectedServices.length === 1 ? (
              (() => {
                const s = selectedServices[0];
                const idx = allServices.findIndex((x) => x.id === s.id);
                return (
                  <>
                    {s.image_url ? (
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-[#1E3A5F]/20">
                        <SafeImage src={s.image_url} alt={s.name} className="h-full w-full object-cover" fill />
                      </div>
                    ) : (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1E3A5F]/10 text-lg">
                        {getSportIconFallback(idx >= 0 ? idx : 0)}
                      </span>
                    )}
                    <span>{s.name}</span>
                  </>
                );
              })()
            ) : (
              <>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FF6B35]/20 text-lg">✓</span>
                <span>{selectedServices.length} sports selected</span>
              </>
            )}
            <svg
              className={`ml-auto w-5 h-5 text-[#1E3A5F] transition-transform ${sportDropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {sportDropdownOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border-2 border-[#FF6B35]/40 bg-white py-2 shadow-xl">
              <button
                type="button"
                onClick={() => clearSportFilter()}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${selectedServiceIds.length === 0 ? 'bg-[#FF6B35]/10 text-[#FF6B35]' : 'hover:bg-[#FF6B35]/5'}`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1E3A5F]/10 text-lg">🏟️</span>
                <span className="font-medium">All Sports</span>
              </button>
              {allServices.map((service, idx) => {
                const isSelected = selectedServiceIds.includes(service.id);
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleSport(service.id)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${isSelected ? 'bg-[#FF6B35]/10 text-[#FF6B35]' : 'hover:bg-[#FF6B35]/5'}`}
                  >
                    {service.image_url ? (
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-[#1E3A5F]/20">
                        <SafeImage src={service.image_url} alt={service.name} className="h-full w-full object-cover" fill />
                      </div>
                    ) : (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1E3A5F]/10 text-lg">
                        {getSportIconFallback(idx)}
                      </span>
                    )}
                    <span className="font-medium flex-1">{service.name}</span>
                    {isSelected && (
                      <span className="text-[#FF6B35] shrink-0" aria-hidden>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {selectedServiceIds.length > 0 && (
          <button
            onClick={clearSportFilter}
            className="mt-3 text-sm font-semibold text-[#FF6B35] hover:text-[#E55A2B] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear Filter
          </button>
        )}
      </div>

      {loadingLocations ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg border-2 border-[#1E3A5F]/10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
          <p className="text-[#1E3A5F] font-medium mt-3">Loading locations...</p>
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg border-2 border-[#1E3A5F]/10">
          <p className="text-[#1E3A5F] font-medium">
            {selectedServiceIds.length > 0
              ? `No locations available for ${selectedServices.map((s) => s.name).join(', ') || 'selected sports'} at the moment.`
              : 'No locations available at the moment.'}
          </p>
          {selectedServiceIds.length > 0 && (
            <button
              onClick={clearSportFilter}
              className="mt-4 text-sm font-semibold text-[#FF6B35] hover:text-[#E55A2B] transition-colors cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="mb-4 sm:mb-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1E3A5F]">📍 Select Location</h2>
              {selectedLocationId && (
                <button
                  onClick={() => {
                    document.getElementById('locations-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="sm:hidden text-xs font-semibold text-[#FF6B35] hover:text-[#E55A2B] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  Back to Locations
                </button>
              )}
            </div>
            <div id="locations-section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredLocations.map((location) => (
                <div
                  key={location.id}
                  className={`bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 ${
                    selectedLocationId === location.id
                      ? 'ring-4 ring-[#FF6B35]/30 border-[#FF6B35] bg-linear-to-br from-[#FF6B35]/10 to-[#1E3A5F]/10'
                      : 'border-[#1E3A5F]/20 hover:border-[#FF6B35]/50'
                  }`}
                >
                  <button
                    onClick={() => handleLocationSelect(location)}
                    className="w-full p-6 text-left cursor-pointer"
                  >
                    <h3 className={`text-xl font-bold mb-2 ${selectedLocationId === location.id ? 'text-[#FF6B35]' : 'text-[#1E3A5F]'}`}>
                      {location.name}
                    </h3>
                    <p className="mt-2 text-gray-700 font-medium">{location.address}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {location.city}, {location.state} - {location.pincode}
                    </p>
                  </button>
                  <div className="px-6 pb-4 pt-2 border-t border-gray-200">
                    <a
                      href={getGoogleMapsUrl(location)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF6B35] hover:text-[#E55A2B] transition-colors group"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Get Directions</span>
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedLocation && (
            <div ref={servicesSectionRef} id="services-section" className="mt-4 sm:mt-8 scroll-mt-20">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
                <div className="flex-1">
                  <h2 className="text-lg sm:text-2xl font-bold text-[#1E3A5F] mb-1">
                    ⚽ Available Sports at {selectedLocation.name}
                  </h2>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 mt-1.5 sm:mt-2">
                    <p className="text-sm text-gray-600">
                      {selectedLocation.address}, {selectedLocation.city}, {selectedLocation.state} -{' '}
                      {selectedLocation.pincode}
                    </p>
                    <a
                      href={getGoogleMapsUrl(selectedLocation)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#FF6B35] hover:text-[#E55A2B] transition-colors group cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Get Directions</span>
                      <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
                <button
                  onClick={handleClearSelection}
                  className="text-sm font-semibold text-[#FF6B35] hover:text-[#E55A2B] transition-colors flex items-center group cursor-pointer"
                >
                  <svg className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Change Location
                </button>
              </div>

              {loading ? (
                <div className="py-12 bg-white rounded-xl shadow-lg border-2 border-[#1E3A5F]/10">
                  <Loader size="md" label="Loading services..." />
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-lg border-2 border-[#1E3A5F]/10">
                  <p className="text-[#1E3A5F] font-medium">No services available at this location.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                  {services.map((service) => (
                    <Link
                      key={service.id}
                      href={`/book/${selectedLocationId}/${service.id}`}
                      className="block bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-4 sm:p-6 border-2 border-[#1E3A5F]/20 hover:border-[#FF6B35] transform hover:scale-105 active:scale-95 group cursor-pointer"
                    >
                      <div className="mb-4 rounded-lg overflow-hidden bg-gray-100 aspect-video">
                        <SafeImage
                          src={service.image_url}
                          alt={service.name}
                          className="w-full h-full min-h-[160px] sm:min-h-[200px] md:min-h-[240px] object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h3 className="text-xl font-bold text-[#1E3A5F] group-hover:text-[#FF6B35] transition-colors mb-2">
                        {service.name}
                      </h3>
                      {service.description && (
                        <p className="mt-2 text-gray-600 text-sm">{service.description}</p>
                      )}
                      <div className="mt-4 flex items-center text-[#FF6B35] font-semibold text-sm group-hover:translate-x-1 transition-transform">
                        Book Now
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

