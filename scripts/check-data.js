/**
 * Check if sample data exists in database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

async function checkData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY, // Use service role to bypass RLS
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  console.log('\n🔍 Checking database data...\n');

  // Check locations
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('*');

  if (locError) {
    console.log(`❌ Locations error: ${locError.message}`);
  } else {
    console.log(`✅ Locations: ${locations?.length || 0} found`);
    if (locations && locations.length > 0) {
      locations.forEach(loc => {
        console.log(`   - ${loc.name} (${loc.city}, ${loc.state})`);
      });
    }
  }

  // Check services
  const { data: services, error: servError } = await supabase
    .from('services')
    .select('*');

  if (servError) {
    console.log(`❌ Services error: ${servError.message}`);
  } else {
    console.log(`\n✅ Services: ${services?.length || 0} found`);
    if (services && services.length > 0) {
      services.forEach(serv => {
        console.log(`   - ${serv.name}`);
      });
    }
  }

  // Check turfs
  const { data: turfs, error: turfError } = await supabase
    .from('turfs')
    .select('*');

  if (turfError) {
    console.log(`❌ Turfs error: ${turfError.message}`);
  } else {
    console.log(`\n✅ Turfs: ${turfs?.length || 0} found`);
  }

  // Check with anon key (simulating user access)
  console.log('\n🔐 Checking with user permissions (anon key)...\n');
  
  const anonSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: userLocations, error: userLocError } = await anonSupabase
    .from('locations')
    .select('*')
    .eq('is_active', true);

  if (userLocError) {
    console.log(`❌ User can't see locations: ${userLocError.message}`);
    console.log(`   This might be an RLS policy issue.`);
  } else {
    console.log(`✅ User can see ${userLocations?.length || 0} locations`);
    if (userLocations && userLocations.length === 0 && locations && locations.length > 0) {
      console.log(`\n⚠️  RLS ISSUE: Data exists but user can't see it!`);
      console.log(`   Check RLS policies on locations table.`);
    }
  }

  console.log('\n✨ Check complete!\n');
}

checkData().catch(console.error);


