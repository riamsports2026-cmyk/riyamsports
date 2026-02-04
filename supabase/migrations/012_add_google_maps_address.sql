-- Add google_maps_address field to locations table
-- This allows admins to set a custom address/coordinates for Google Maps
-- If not provided, the system will use the regular address

ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS google_maps_address TEXT;

COMMENT ON COLUMN locations.google_maps_address IS 'Custom address or coordinates for Google Maps. If not provided, uses the regular address field.';



