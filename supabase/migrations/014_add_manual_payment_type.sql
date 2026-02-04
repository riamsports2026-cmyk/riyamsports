-- Add 'manual' payment type for staff/admin balance updates
ALTER TABLE payments
DROP CONSTRAINT IF EXISTS payments_payment_type_check;

ALTER TABLE payments
ADD CONSTRAINT payments_payment_type_check 
CHECK (payment_type IN ('advance', 'full', 'remaining', 'manual'));

-- Update payment_gateway constraint to allow 'manual'
ALTER TABLE payments
DROP CONSTRAINT IF EXISTS payments_payment_gateway_check;

ALTER TABLE payments
ADD CONSTRAINT payments_payment_gateway_check 
CHECK (payment_gateway IN ('razorpay', 'payglobal', 'manual'));

-- Add payment_method column to track cash/online/manual
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'online' CHECK (payment_method IN ('online', 'cash', 'manual'));

-- Add notes column for payment remarks
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS notes TEXT;

