/**
 * Script to apply service_hourly_pricing migration
 * 
 * This script reads the migration file and provides instructions
 * to manually apply it via Supabase SQL Editor
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function showMigrationInstructions() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!SUPABASE_URL) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
    process.exit(1);
  }

  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  
  if (!projectRef) {
    console.error('❌ Could not extract project ref from Supabase URL');
    process.exit(1);
  }

  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '011_service_hourly_pricing.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('\n📋 Service Hourly Pricing Migration');
  console.log('=====================================\n');
  console.log('To apply this migration:\n');
  console.log(`1. Open Supabase SQL Editor:`);
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
  console.log('2. Copy and paste the SQL below:\n');
  console.log('─'.repeat(60));
  console.log(migrationSQL);
  console.log('─'.repeat(60));
  console.log('\n3. Click "Run" to execute the migration\n');
  console.log('4. Verify the table was created:\n');
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/editor\n`);
  console.log('   Look for "service_hourly_pricing" in the table list\n');
}

showMigrationInstructions().catch(console.error);




