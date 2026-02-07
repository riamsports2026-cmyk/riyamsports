-- Backfill hourly_pricing for hours 0–5 (12am–6am) for turfs that only had 6–23 from old sample data.
-- Safe to run multiple times (ON CONFLICT DO NOTHING).

INSERT INTO hourly_pricing (turf_id, hour, price)
SELECT t.id, h.hour, 500
FROM turfs t
CROSS JOIN (SELECT generate_series(0, 5) AS hour) h
WHERE t.is_available = true
  AND NOT EXISTS (
    SELECT 1 FROM hourly_pricing hp
    WHERE hp.turf_id = t.id AND hp.hour = h.hour
  )
ON CONFLICT (turf_id, hour) DO NOTHING;
