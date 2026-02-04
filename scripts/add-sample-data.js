/**
 * Add sample data to the database
 * Usage: npm run db:sample-data
 */

const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'esndugjwgubxetjxqwgs';

const sampleDataPath = path.join(__dirname, '..', 'supabase', 'migrations', '002_sample_data.sql');

if (!fs.existsSync(sampleDataPath)) {
  console.error(`❌ Sample data file not found: ${sampleDataPath}`);
  process.exit(1);
}

const sampleSQL = fs.readFileSync(sampleDataPath, 'utf-8');

console.log('\n📦 Adding Sample Data to Database\n');
console.log('📋 Follow these steps:\n');
console.log('1. Go to Supabase SQL Editor:');
console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
console.log('2. Copy the SQL below:\n');
console.log('─'.repeat(70));
console.log(sampleSQL);
console.log('─'.repeat(70));
console.log('\n3. Paste and click "Run"\n');
console.log('✨ This will add:');
console.log('   • 3 sample locations');
console.log('   • 6 sports/services');
console.log('   • Turfs for each location+service combination');
console.log('   • Hourly pricing (₹500-₹1500)');
console.log('   • Default payment gateway setting\n');

// Try to open browser
const { exec } = require('child_process');
const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

if (process.platform === 'win32') {
  exec(`start ${sqlEditorUrl}`);
} else if (process.platform === 'darwin') {
  exec(`open ${sqlEditorUrl}`);
} else {
  exec(`xdg-open ${sqlEditorUrl}`);
}


