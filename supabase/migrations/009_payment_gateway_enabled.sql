-- Add enabled_gateways columns to payment_gateway_settings
ALTER TABLE payment_gateway_settings 
ADD COLUMN IF NOT EXISTS razorpay_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS payglobal_enabled BOOLEAN DEFAULT true;

-- Update existing rows to have both enabled by default
UPDATE payment_gateway_settings 
SET razorpay_enabled = true, payglobal_enabled = true
WHERE razorpay_enabled IS NULL OR payglobal_enabled IS NULL;





