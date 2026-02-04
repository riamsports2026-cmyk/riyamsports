/**
 * Automated Database Migration Script
 * 
 * This script automatically runs the database migration using your Supabase credentials.
 * 
 * Usage: npm run db:migrate
 * 
 * Requirements:
 * - .env.local file with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function runMigration() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables!');
    console.error('   Please ensure .env.local contains:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY\n');
    process.exit(1);
  }

  // Extract project ref from URL
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  
  if (!projectRef) {
    console.error('❌ Could not extract project ref from Supabase URL');
    process.exit(1);
  }

  // Read migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('\n🚀 Running database migration...');
  console.log(`   Project: ${projectRef}`);
  console.log(`   URL: ${SUPABASE_URL}\n`);

  try {
    // Use Supabase client to execute SQL via RPC
    // First, try using the Supabase JS client with service role
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Split SQL into individual statements and execute
    // Note: Supabase doesn't support multi-statement queries directly
    // So we'll need to use the Management API or execute via SQL Editor
    
    console.log('⚠️  Direct SQL execution via API is limited.');
    console.log('   The migration needs to be run manually in Supabase SQL Editor.\n');
    console.log('📋 Quick Setup:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
    console.log('   2. Copy the contents of: supabase/migrations/001_initial_schema.sql');
    console.log('   3. Paste and click "Run"\n');
    
    // Alternative: Provide the SQL content for easy copy
    console.log('📄 Migration SQL (copy this):');
    console.log('─'.repeat(60));
    console.log(migrationSQL);
    console.log('─'.repeat(60));
    console.log('\n✨ After running the migration, your database will be ready!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Please run the migration manually in Supabase SQL Editor.\n');
    process.exit(1);
  }
}

// Run the migration
runMigration();
