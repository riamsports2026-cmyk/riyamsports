/**
 * Verify that database migration was successful
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

async function verifyMigration() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  console.log('\n🔍 Verifying database migration...\n');

  const tables = [
    'profiles',
    'roles',
    'user_roles',
    'employee_locations',
    'locations',
    'services',
    'turfs',
    'hourly_pricing',
    'bookings',
    'booking_slots',
    'payments',
    'payment_gateway_settings',
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: OK`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }

  console.log('\n✨ Verification complete!\n');
}

verifyMigration().catch(console.error);


