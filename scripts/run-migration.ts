/**
 * Script to run database migration via Supabase Management API
 * 
 * Usage: npx tsx scripts/run-migration.ts
 * 
 * Requires:
 * - SUPABASE_SERVICE_ROLE_KEY in .env.local
 * - NEXT_PUBLIC_SUPABASE_URL in .env.local
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { env } from '../lib/env';

async function runMigration() {
  const migrationPath = join(process.cwd(), 'supabase', 'migrations', '001_initial_schema.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  // Extract project ref from URL
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  
  if (!projectRef) {
    throw new Error('Could not extract project ref from Supabase URL');
  }

  console.log(`Running migration for project: ${projectRef}`);

  // Use Supabase Management API to execute SQL
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: migrationSQL,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Migration failed: ${error}`);
  }

  const result = await response.json();
  console.log('Migration completed successfully!');
  console.log('Result:', result);
}

runMigration().catch((error) => {
  console.error('Error running migration:', error);
  process.exit(1);
});


