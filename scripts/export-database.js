/**
 * Database Export Script
 * Exports all data from your old Supabase database to JSON files
 * 
 * Usage:
 * 1. Update OLD_PROJECT_URL and OLD_SERVICE_ROLE_KEY below
 * 2. Run: node scripts/export-database.js
 * 3. Check the generated database-export.json file
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ⚠️ UPDATE THESE VALUES WITH YOUR OLD PROJECT CREDENTIALS
const OLD_PROJECT_URL = process.env.OLD_SUPABASE_URL || "https://esndugjwgubxetjxqwgs.supabase.co";
const OLD_SERVICE_ROLE_KEY = process.env.OLD_SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzbmR1Z2p3Z3VieGV0anhxd2dzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODk3OTAyNCwiZXhwIjoyMDg0NTU1MDI0fQ.smmE6WkIiq0XXLe9ft2rZpjvpndbg-0xhl1GPO0lSnk";

if (!OLD_SERVICE_ROLE_KEY || OLD_SERVICE_ROLE_KEY === 'YOUR_OLD_SERVICE_ROLE_KEY') {
  console.error('❌ Error: Please set OLD_SUPABASE_SERVICE_ROLE_KEY environment variable or update the script');
  console.error('   You can find it in: Supabase Dashboard → Settings → API → Service Role Key');
  process.exit(1);
}

// Validate URL format
if (!OLD_PROJECT_URL.startsWith('https://') || !OLD_PROJECT_URL.includes('.supabase.co')) {
  console.error('❌ Error: Invalid Supabase URL format');
  console.error(`   Current URL: ${OLD_PROJECT_URL}`);
  console.error('   Expected format: https://[project-id].supabase.co');
  process.exit(1);
}

console.log(`🔗 Connecting to: ${OLD_PROJECT_URL}`);
console.log(`🔑 Using service role key: ${OLD_SERVICE_ROLE_KEY.substring(0, 20)}...\n`);

const supabase = createClient(OLD_PROJECT_URL, OLD_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test connection first
async function testConnection() {
  try {
    console.log('🔍 Testing connection...');
    const { data, error } = await supabase.from('roles').select('count').limit(1);
    if (error && error.message.includes('fetch')) {
      console.error('❌ Connection failed. Possible issues:');
      console.error('   1. The account/project may be blocked or suspended');
      console.error('   2. Network connectivity issues');
      console.error('   3. Invalid service role key');
      console.error('   4. Project URL is incorrect');
      console.error(`\n   Error: ${error.message}`);
      return false;
    }
    console.log('✅ Connection successful!\n');
    return true;
  } catch (err) {
    console.error('❌ Connection test failed:', err.message);
    if (err.cause) {
      console.error('   Cause:', err.cause);
    }
    return false;
  }
}

async function exportTable(tableName, query = '*') {
  try {
    console.log(`📦 Exporting ${tableName}...`);
    const { data, error } = await supabase
      .from(tableName)
      .select(query);
    
    if (error) {
      console.error(`❌ Error exporting ${tableName}:`, error.message);
      console.error(`   Error details:`, JSON.stringify(error, null, 2));
      return null;
    }
    
    console.log(`✅ Exported ${data?.length || 0} records from ${tableName}`);
    return data || [];
  } catch (err) {
    console.error(`❌ Exception exporting ${tableName}:`, err.message);
    if (err.cause) {
      console.error(`   Cause:`, err.cause);
    }
    if (err.stack) {
      console.error(`   Stack:`, err.stack.split('\n').slice(0, 3).join('\n'));
    }
    return null;
  }
}

async function exportAllData() {
  console.log('🚀 Starting database export...\n');
  
  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    console.error('\n❌ Cannot proceed without a valid connection.');
    console.error('   Please check your credentials and network connection.');
    process.exit(1);
  }
  
  const exportData = {
    exported_at: new Date().toISOString(),
    project_url: OLD_PROJECT_URL,
    tables: {}
  };

  // Export tables in dependency order
  const tables = [
    { name: 'roles', query: 'id, name, description, is_system_role, created_at' },
    { name: 'permissions', query: 'id, name, description, created_at' },
    { name: 'role_permissions', query: 'id, role_id, permission_id, created_at' },
    { name: 'locations', query: 'id, name, address, city, state, pincode, is_active, created_at' },
    { name: 'services', query: 'id, name, description, is_active, created_at' },
    { name: 'profiles', query: 'id, full_name, mobile_number, profile_image, created_at' },
    { name: 'user_roles', query: 'id, user_id, role_id, created_at' },
    { name: 'user_role_locations', query: 'id, user_id, role_id, location_id, created_at' },
    { name: 'employee_locations', query: 'id, employee_id, location_id, created_at' },
    { name: 'turfs', query: 'id, location_id, service_id, name, is_available, created_at' },
    { name: 'hourly_pricing', query: 'id, turf_id, hour, price, created_at' },
    { name: 'bookings', query: 'id, booking_id, user_id, turf_id, booking_date, total_amount, advance_amount, payment_status, booking_status, payment_gateway, payment_gateway_order_id, created_at, updated_at' },
    { name: 'booking_slots', query: 'id, booking_id, hour, created_at' },
    { name: 'payments', query: 'id, booking_id, amount, payment_type, payment_gateway, gateway_order_id, gateway_payment_id, status, created_at, updated_at' },
    { name: 'payment_gateway_settings', query: 'id, active_gateway, created_at, updated_at' },
  ];

  for (const table of tables) {
    const data = await exportTable(table.name, table.query);
    if (data !== null) {
      exportData.tables[table.name] = data;
    }
  }

  // Save to file
  const outputPath = path.join(__dirname, '..', 'database-export.json');
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
  
  console.log(`\n✅ Export complete!`);
  console.log(`📄 Data saved to: ${outputPath}`);
  console.log(`\n📊 Summary:`);
  Object.entries(exportData.tables).forEach(([table, data]) => {
    console.log(`   ${table}: ${Array.isArray(data) ? data.length : 0} records`);
  });
  
  return exportData;
}

// Run export
exportAllData()
  .then(() => {
    console.log('\n✨ Done! You can now use import-database.js to import this data.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Export failed:', err);
    process.exit(1);
  });

