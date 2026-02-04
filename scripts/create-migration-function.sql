-- Create a function to execute SQL safely
-- Run this FIRST in Supabase SQL Editor to enable automated migrations
-- Then you can use: npm run db:migrate

CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO service_role;

-- Note: This function allows executing arbitrary SQL
-- Only use in development or with proper security measures


