/**
 * Fix RLS policies - outputs clean SQL without formatting
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

// Write clean SQL to a file
const outputPath = path.join(__dirname, '..', 'fix-policies-clean.sql');
fs.writeFileSync(outputPath, fixSQL, 'utf-8');

console.log('\n🔧 Fix RLS Policies - Clean SQL File Created\n');
console.log(`📄 Clean SQL file: ${outputPath}\n`);
console.log(`🔗 SQL Editor: https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
console.log('📋 Steps:');
console.log('   1. Open the SQL file: fix-policies-clean.sql');
console.log('   2. Copy all contents');
console.log('   3. Paste in Supabase SQL Editor');
console.log('   4. Click "Run"\n');
console.log('✨ This will fix the RLS recursion and make locations visible!\n');


