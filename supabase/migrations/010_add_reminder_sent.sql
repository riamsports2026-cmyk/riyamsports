-- Add reminder_sent column to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS reminder_sent TIMESTAMPTZ;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_bookings_reminder_sent ON bookings(reminder_sent) WHERE reminder_sent IS NULL;





