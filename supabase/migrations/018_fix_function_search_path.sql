-- Fix function search_path security issues
-- Functions should have search_path set to prevent potential security vulnerabilities

-- Recreate update_updated_at_column with secure search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate update_service_hourly_pricing_updated_at with secure search_path
CREATE OR REPLACE FUNCTION public.update_service_hourly_pricing_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
