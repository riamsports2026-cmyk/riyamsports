-- Add test_mode and webhook_url columns to payment_gateway_settings
ALTER TABLE payment_gateway_settings
ADD COLUMN IF NOT EXISTS razorpay_test_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payglobal_test_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS razorpay_webhook_url TEXT,
ADD COLUMN IF NOT EXISTS payglobal_webhook_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN payment_gateway_settings.razorpay_test_mode IS 'Whether Razorpay is in test mode (true) or live mode (false)';
COMMENT ON COLUMN payment_gateway_settings.payglobal_test_mode IS 'Whether PayGlobal is in test mode (true) or live mode (false)';
COMMENT ON COLUMN payment_gateway_settings.razorpay_webhook_url IS 'Razorpay webhook URL for payment notifications';
COMMENT ON COLUMN payment_gateway_settings.payglobal_webhook_url IS 'PayGlobal webhook URL for payment notifications';



