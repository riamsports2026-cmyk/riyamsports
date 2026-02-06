-- Configurable booking reminder schedules (admin can set 1 day, 1 hour, 5 min, etc.)
CREATE TABLE IF NOT EXISTS reminder_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  minutes_before INTEGER NOT NULL CHECK (minutes_before > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log which reminder was sent so we don't send the same one twice
CREATE TABLE IF NOT EXISTS booking_reminders_sent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  minutes_before INTEGER NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id, minutes_before)
);

CREATE INDEX IF NOT EXISTS idx_reminder_schedules_active ON reminder_schedules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_booking_reminders_sent_booking ON booking_reminders_sent(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_reminders_sent_lookup ON booking_reminders_sent(booking_id, minutes_before);

ALTER TABLE reminder_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_reminders_sent ENABLE ROW LEVEL SECURITY;

-- Only service role / backend can read/write (admin actions and cron use createServiceClient)
-- No policies: public/anon cannot access; service role bypasses RLS

-- Seed default schedules only when table is empty
INSERT INTO reminder_schedules (label, minutes_before, is_active, sort_order)
SELECT * FROM (VALUES
  ('1 day before', 1440, true, 1),
  ('1 hour before', 60, true, 2),
  ('5 minutes before', 5, true, 3)
) AS t(label, minutes_before, is_active, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM reminder_schedules LIMIT 1);
