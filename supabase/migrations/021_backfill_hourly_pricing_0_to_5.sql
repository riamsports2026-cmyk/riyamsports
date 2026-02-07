-- Backfill hourly_pricing for hours 0–5 (12am–6am) for ALL turfs.
-- 1) Insert missing rows for every turf (any turf missing hour 0–5 gets them).
-- 2) Update existing 0–5 rows to the same night rate so all turfs are consistent.
-- Safe to run multiple times.

-- Insert missing (turf_id, hour) for hours 0–5 for every turf
INSERT INTO hourly_pricing (turf_id, hour, price)
SELECT t.id, h.hour, 500
FROM turfs t
CROSS JOIN (SELECT generate_series(0, 5) AS hour) h
WHERE NOT EXISTS (
  SELECT 1 FROM hourly_pricing hp
  WHERE hp.turf_id = t.id AND hp.hour = h.hour
)
ON CONFLICT (turf_id, hour) DO NOTHING;

-- Update existing rows for hours 0–5 so all turfs have the same night rate
UPDATE hourly_pricing
SET price = 500
WHERE hour BETWEEN 0 AND 5;
