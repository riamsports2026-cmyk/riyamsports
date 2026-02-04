-- Add received_amount column to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS received_amount DECIMAL(10, 2) DEFAULT 0;

-- Update existing bookings: set received_amount based on payment_status
UPDATE bookings
SET received_amount = CASE
  WHEN payment_status = 'paid' THEN total_amount
  WHEN payment_status = 'partial' THEN advance_amount
  ELSE 0
END
WHERE received_amount IS NULL OR received_amount = 0;

-- Add check constraint to ensure received_amount doesn't exceed total_amount
ALTER TABLE bookings
ADD CONSTRAINT check_received_amount CHECK (received_amount >= 0 AND received_amount <= total_amount);



