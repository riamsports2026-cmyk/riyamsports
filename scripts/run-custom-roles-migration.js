const fs = require('fs');
const path = require('path');

const migrationFile = path.join(__dirname, '../supabase/migrations/007_custom_roles.sql');
const sql = fs.readFileSync(migrationFile, 'utf8');

console.log('='.repeat(80));
console.log('CUSTOM ROLES MIGRATION');
console.log('='.repeat(80));
console.log('\nThis migration will:');
console.log('1. Remove role name restrictions (allow custom role names)');
console.log('2. Add description field to roles');
console.log('3. Add is_system_role flag to distinguish system vs custom roles');
console.log('\nSQL to execute:');
console.log('='.repeat(80));
console.log(sql);
console.log('='.repeat(80));
console.log('\n📋 Instructions:');
console.log('1. Go to your Supabase Dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy and paste the SQL above');
console.log('4. Click "Run" to execute');
console.log('\n🔗 Direct link: https://supabase.com/dashboard/project/esndugjwgubxetjxqwgs/sql/new');
console.log('='.repeat(80));


