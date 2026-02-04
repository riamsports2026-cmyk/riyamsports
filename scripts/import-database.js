/**
 * Database Import Script
 * Imports data from database-export.json into your new Supabase database
 * 
 * Usage:
 * 1. Make sure you've run export-database.js first
 * 2. Update NEW_PROJECT_URL and NEW_SERVICE_ROLE_KEY below
 * 3. Run: node scripts/import-database.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ⚠️ UPDATE THESE VALUES WITH YOUR NEW PROJECT CREDENTIALS
// The service role key shows project ID: txjoamolqaltmvczetcp
// So the URL should match that project
const NEW_PROJECT_URL = process.env.NEW_SUPABASE_URL || 'https://txjoamolqaltmvczetcp.supabase.co';
const NEW_SERVICE_ROLE_KEY = process.env.NEW_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4am9hbW9scWFsdG12Y3pldGNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA0NTMzNCwiZXhwIjoyMDg0NjIxMzM0fQ.ZGCWZJCduT0zMkJALRl22LugevXbCASLZl4aQHQb8Uc';

if (!NEW_SERVICE_ROLE_KEY || NEW_SERVICE_ROLE_KEY === 'YOUR_NEW_SERVICE_ROLE_KEY') {
  console.error('❌ Error: Please set NEW_SUPABASE_SERVICE_ROLE_KEY environment variable or update the script');
  console.error('   You can find it in: Supabase Dashboard → Settings → API → Service Role Key');
  console.error('\n   To set it, either:');
  console.error('   1. Set environment variable: export NEW_SUPABASE_SERVICE_ROLE_KEY="your_key"');
  console.error('   2. Or edit this script and update NEW_SERVICE_ROLE_KEY directly');
  process.exit(1);
}

// Validate URL format
if (!NEW_PROJECT_URL.startsWith('https://') || !NEW_PROJECT_URL.includes('.supabase.co')) {
  console.error('❌ Error: Invalid Supabase URL format');
  console.error(`   Current URL: ${NEW_PROJECT_URL}`);
  console.error('   Expected format: https://[project-id].supabase.co');
  console.error('   Make sure you\'re using your NEW project URL, not the old one!');
  process.exit(1);
}

// Check if URL matches the old project (common mistake)
if (NEW_PROJECT_URL.includes('esndugjwgubxetjxqwgs')) {
  console.warn('⚠️  Warning: You\'re using the OLD project URL!');
  console.warn('   Make sure you\'ve created a NEW Supabase project and updated the URL.');
  console.warn('   The URL should be different from the old project.\n');
}

console.log(`🔗 Connecting to: ${NEW_PROJECT_URL}`);
console.log(`🔑 Using service role key: ${NEW_SERVICE_ROLE_KEY.substring(0, 20)}...\n`);

const supabase = createClient(NEW_PROJECT_URL, NEW_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test connection first
async function testConnection() {
  try {
    console.log('🔍 Testing connection to new database...');
    
    // First, test if we can connect at all
    const { data: testData, error: testError } = await supabase.from('roles').select('count').limit(1);
    
    if (testError) {
      if (testError.message.includes('Invalid API key') || testError.code === 'PGRST301' || testError.message.includes('JWT')) {
        console.error('❌ Invalid API key. Please check:');
        console.error('   1. You\'re using the SERVICE ROLE KEY (not the anon key)');
        console.error('   2. The key is from your NEW Supabase project (not the old one)');
        console.error('   3. The key matches the project URL');
        console.error('   4. The key hasn\'t been rotated or expired');
        console.error(`\n   Error: ${testError.message}`);
        console.error(`   Code: ${testError.code || 'N/A'}`);
        return false;
      } else if (testError.message.includes('relation') || testError.message.includes('does not exist')) {
        console.error('❌ Tables do not exist yet!');
        console.error('   You need to run migrations first before importing data.');
        console.error('   Steps:');
        console.error('   1. Go to your NEW Supabase project → SQL Editor');
        console.error('   2. Run all migration files in order (001 through 008)');
        console.error('   3. Or use: npm run db:migrate');
        console.error(`\n   Error: ${testError.message}`);
        return false;
      } else {
        console.error('❌ Connection failed:', testError.message);
        console.error(`   Code: ${testError.code || 'N/A'}`);
        return false;
      }
    }
    
    console.log('✅ Connection successful!');
    console.log('✅ Tables exist - ready to import data!\n');
    return true;
  } catch (err) {
    console.error('❌ Connection test failed:', err.message);
    if (err.cause) {
      console.error('   Cause:', err.cause);
    }
    return false;
  }
}

// Load exported data
const exportPath = path.join(__dirname, '..', 'database-export.json');
if (!fs.existsSync(exportPath)) {
  console.error('❌ Error: database-export.json not found!');
  console.error('   Please run export-database.js first to create the export file.');
  process.exit(1);
}

const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));

// ID mapping for foreign key updates
const idMappings = {
  roles: {},
  permissions: {},
  locations: {},
  services: {},
  turfs: {},
  bookings: {},
  users: {} // Will need to be mapped manually for auth users
};

async function importTable(tableName, data, options = {}) {
  if (!data || data.length === 0) {
    console.log(`⏭️  Skipping ${tableName} (no data)`);
    return;
  }

  try {
    console.log(`📥 Importing ${tableName} (${data.length} records)...`);
    
    // Handle ID mapping if needed
    let mappedData = data;
    if (options.mapIds && idMappings[tableName]) {
      mappedData = data.map(record => {
        const newRecord = { ...record };
        // Map old ID to new ID if it exists
        if (idMappings[tableName][record.id]) {
          newRecord.id = idMappings[tableName][record.id];
        }
        return newRecord;
      });
    }

    // Insert in batches to avoid timeouts
    const batchSize = 100;
    let imported = 0;
    
    for (let i = 0; i < mappedData.length; i += batchSize) {
      const batch = mappedData.slice(i, i + batchSize);
      const { data: inserted, error } = await supabase
        .from(tableName)
        .insert(batch)
        .select();
      
      if (error) {
        console.error(`❌ Error importing batch ${i / batchSize + 1} of ${tableName}:`, error.message);
        // Continue with next batch
      } else {
        imported += inserted?.length || 0;
        
        // Store ID mappings for foreign key updates
        if (inserted && options.mapIds) {
          batch.forEach((oldRecord, idx) => {
            if (inserted[idx]) {
              idMappings[tableName][oldRecord.id] = inserted[idx].id;
            }
          });
        }
      }
    }
    
    console.log(`✅ Imported ${imported} records to ${tableName}`);
  } catch (err) {
    console.error(`❌ Exception importing ${tableName}:`, err.message);
  }
}

async function importAllData() {
  console.log('🚀 Starting database import...\n');
  console.log(`📦 Source: ${exportData.project_url || 'Unknown'}`);
  console.log(`📅 Exported: ${exportData.exported_at || 'Unknown'}\n`);
  
  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    console.error('\n❌ Cannot proceed without a valid connection.');
    console.error('   Please check your NEW project credentials.');
    process.exit(1);
  }

  // Import in dependency order
  const importOrder = [
    { table: 'roles', mapIds: true, filter: (r) => !r.is_system_role }, // Only import custom roles
    { table: 'permissions', mapIds: true },
    { table: 'role_permissions', mapIds: false, requiresMapping: ['role_id', 'permission_id'] },
    { table: 'locations', mapIds: true },
    { table: 'services', mapIds: true },
    { table: 'profiles', mapIds: false }, // User IDs will be different
    { table: 'user_roles', mapIds: false }, // User IDs will be different
    { table: 'user_role_locations', mapIds: false }, // User IDs will be different
    { table: 'employee_locations', mapIds: false }, // User IDs will be different
    { table: 'turfs', mapIds: true, requiresMapping: ['location_id', 'service_id'] },
    { table: 'hourly_pricing', mapIds: false, requiresMapping: ['turf_id'] },
    { table: 'bookings', mapIds: true, requiresMapping: ['turf_id'] }, // User IDs will be different
    { table: 'booking_slots', mapIds: false, requiresMapping: ['booking_id'] },
    { table: 'payments', mapIds: false, requiresMapping: ['booking_id'] },
    { table: 'payment_gateway_settings', mapIds: false },
  ];

  for (const { table, mapIds, requiresMapping } of importOrder) {
    const data = exportData.tables[table];
    if (data && data.length > 0) {
      // Apply ID mappings for foreign keys
      let mappedData = data;
      if (requiresMapping) {
        mappedData = data.map(record => {
          const newRecord = { ...record };
          requiresMapping.forEach(fkField => {
            const [tableName, fieldName] = fkField.split('_').slice(0, -1).join('_') === 'role' 
              ? ['roles', 'role_id'] 
              : fkField.includes('location') 
              ? ['locations', 'location_id']
              : fkField.includes('service')
              ? ['services', 'service_id']
              : fkField.includes('turf')
              ? ['turfs', 'turf_id']
              : fkField.includes('booking')
              ? ['bookings', 'booking_id']
              : [null, fkField];
            
            if (tableName && idMappings[tableName] && idMappings[tableName][record[fkField]]) {
              newRecord[fkField] = idMappings[tableName][record[fkField]];
            }
          });
          return newRecord;
        });
      }
      
      await importTable(table, mappedData, { mapIds });
    } else {
      console.log(`⏭️  Skipping ${table} (no data in export)`);
    }
  }

  console.log('\n✅ Import complete!');
  console.log('\n⚠️  Important Notes:');
  console.log('   1. Auth users need to be created separately');
  console.log('   2. User IDs in profiles, user_roles, etc. will need to be updated manually');
  console.log('   3. Verify all data was imported correctly');
  console.log('   4. Test your application with the new database');
}

// Run import
importAllData()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Import failed:', err);
    process.exit(1);
  });

