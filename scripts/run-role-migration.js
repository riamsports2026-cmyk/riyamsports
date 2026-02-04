const fs = require('fs');
const path = require('path');

const migrationFile = path.join(__dirname, '../supabase/migrations/006_location_based_roles.sql');
const sql = fs.readFileSync(migrationFile, 'utf8');

console.log('='.repeat(80));
console.log('LOCATION-BASED ROLES MIGRATION');
console.log('='.repeat(80));
console.log('\nThis migration will:');
console.log('1. Add new roles: manager, sub_admin, account_manager');
console.log('2. Create user_role_locations table for location-based role assignments');
console.log('3. Add RLS policies for the new table');
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


