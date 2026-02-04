const fs = require('fs');
const path = require('path');

const migrationFile = path.join(__dirname, '../supabase/migrations/008_permissions.sql');
const sql = fs.readFileSync(migrationFile, 'utf8');

console.log('='.repeat(80));
console.log('PERMISSIONS MIGRATION SQL');
console.log('='.repeat(80));
console.log('\n');
console.log('Copy and paste this SQL into your Supabase SQL Editor:');
console.log('\n');
console.log('👉 https://supabase.com/dashboard/project/esndugjwgubxetjxqwgs/sql/new');
console.log('\n');
console.log('-'.repeat(80));
console.log(sql);
console.log('-'.repeat(80));


