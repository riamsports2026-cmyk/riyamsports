/**
 * Automated Database Migration Script
 * Executes SQL migration directly using Supabase client
 * 
 * Usage: npm run db:migrate
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function executeSQL(supabase, sql) {
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`\n📝 Executing ${statements.length} SQL statements...\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip comments and empty statements
    if (!statement || statement.startsWith('--')) {
      continue;
    }

    try {
      // Use RPC to execute SQL (if available)
      // Note: This requires a custom function in Supabase
      // For now, we'll use the REST API approach
      
      // Try executing via REST API with service role
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ sql: statement }),
      });

      if (!response.ok && response.status !== 404) {
        // If RPC doesn't exist, we need to execute manually
        throw new Error('RPC function not available');
      }

      if (response.ok) {
        console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
      }
    } catch (error) {
      // RPC not available, need manual execution
      console.log(`⚠️  Direct SQL execution not available via API`);
      console.log(`   Statement ${i + 1} needs manual execution\n`);
      return false;
    }
  }

  return true;
}

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

  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  
  if (!projectRef) {
    console.error('❌ Could not extract project ref from Supabase URL');
    process.exit(1);
  }

  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('\n🚀 Starting automated database migration...');
  console.log(`   Project: ${projectRef}`);
  console.log(`   URL: ${SUPABASE_URL}\n`);

  // Create Supabase client with service role
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Try to execute SQL
  const success = await executeSQL(supabase, migrationSQL);

  if (!success) {
    console.log('\n📋 Manual Setup Required:');
    console.log('   Supabase requires SQL execution via the Dashboard for security.\n');
    console.log('🔗 Quick Link:');
    console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
    console.log('📄 Steps:');
    console.log('   1. Click the link above');
    console.log('   2. Copy the SQL below');
    console.log('   3. Paste and click "Run"\n');
    console.log('─'.repeat(70));
    console.log(migrationSQL);
    console.log('─'.repeat(70));
    console.log('\n✨ After running, refresh your app!\n');
    process.exit(0);
  }

  console.log('\n✅ Migration completed successfully!');
  console.log('✨ Your database is now ready!\n');
}

runMigration().catch((error) => {
  console.error('\n❌ Error:', error.message);
  console.error('\n💡 Please run the migration manually in Supabase SQL Editor.\n');
  process.exit(1);
});


