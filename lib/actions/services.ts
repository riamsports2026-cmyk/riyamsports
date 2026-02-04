'use server';

import { createClient } from '@/lib/supabase/server';
import type { Service } from '@/lib/types';

export async function getServices() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('name');

  return data || [];
}

export async function getServicesByLocation(locationId: string) {
  const supabase = await createClient();
  const serviceMap = new Map();

  // First, get services from location_services table (explicit service-location links)
  const { data: locationServices, error: lsError } = await supabase
    .from('location_services')
    .select('service:services(*)')
    .eq('location_id', locationId)
    .eq('is_active', true);

  if (lsError) {
    console.warn('[getServicesByLocation] Error fetching location_services:', lsError.message);
  }

  if (!lsError && locationServices) {
    locationServices.forEach((item: any) => {
      const service = item.service;
      if (service && service.is_active && !serviceMap.has(service.id)) {
        serviceMap.set(service.id, service);
      }
    });
  }

  // Also get services that have turfs at this location (fallback/backward compatibility)
  const { data: turfsData, error: turfsError } = await supabase
    .from('turfs')
    .select('service:services(*)')
    .eq('location_id', locationId)
    .eq('is_available', true);

  if (turfsError) {
    console.warn('[getServicesByLocation] Error fetching turfs:', turfsError.message);
  }

  if (!turfsError && turfsData) {
    turfsData.forEach((item: any) => {
      const service = item.service;
      if (service && service.is_active && !serviceMap.has(service.id)) {
        serviceMap.set(service.id, service);
      }
    });
  }

  const services = Array.from(serviceMap.values()) as Service[];
  services.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  console.log(`[getServicesByLocation] Location ${locationId}: Found ${services.length} service(s)`, services.map((s) => s.name));
  return services;
}

export async function getService(id: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  return data;
}

