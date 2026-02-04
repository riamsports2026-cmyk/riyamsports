/**
 * Opens Supabase SQL Editor with migration ready to run
 * This is the most reliable way to run migrations
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'esndugjwgubxetjxqwgs';

const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

console.log('\n🚀 Database Migration Setup\n');
console.log('📋 Follow these steps:\n');
console.log('1. Click this link to open SQL Editor:');
console.log(`   ${sqlEditorUrl}\n`);
console.log('2. Copy the SQL below:');
console.log('─'.repeat(70));
console.log(migrationSQL);
console.log('─'.repeat(70));
console.log('\n3. Paste into the SQL Editor and click "Run"\n');
console.log('✨ After running, your database will be ready!\n');

// Try to open browser (works on most systems)
if (process.platform === 'win32') {
  exec(`start ${sqlEditorUrl}`);
} else if (process.platform === 'darwin') {
  exec(`open ${sqlEditorUrl}`);
} else {
  exec(`xdg-open ${sqlEditorUrl}`);
}


