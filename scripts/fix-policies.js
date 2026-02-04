/**
 * Fix RLS policies - drop and recreate them safely
 */

const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'esndugjwgubxetjxqwgs';

const fixPath = path.join(__dirname, '..', 'supabase', 'migrations', '004_fix_policies_idempotent.sql');

if (!fs.existsSync(fixPath)) {
  console.error(`❌ Fix file not found: ${fixPath}`);
  process.exit(1);
}

const fixSQL = fs.readFileSync(fixPath, 'utf-8');

console.log('\n🔧 Fix RLS Policies (Drop & Recreate)\n');
console.log('📋 Run this SQL in Supabase:\n');
console.log('─'.repeat(70));
console.log(fixSQL);
console.log('─'.repeat(70));
console.log(`\n🔗 SQL Editor: https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
console.log('✨ This will:');
console.log('   • Drop all existing policies');
console.log('   • Recreate them without recursion issues');
console.log('   • Fix the locations visibility problem\n');


