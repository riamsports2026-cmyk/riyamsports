/**
 * Script to check user permissions
 * Usage: node scripts/check-user-permissions.js <user_email>
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const userEmail = process.argv[2];

if (!userEmail) {
  console.error('❌ Usage: node scripts/check-user-permissions.js <user_email>');
  process.exit(1);
}

async function checkUserPermissions() {
  console.log(`\n🔍 Checking permissions for: ${userEmail}\n`);

  // Get user
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error('❌ Error fetching users:', userError);
    return;
  }

  const user = users.users.find(u => u.email === userEmail);
  if (!user) {
    console.error(`❌ User not found: ${userEmail}`);
    return;
  }

  console.log(`✅ Found user: ${user.id} (${user.email})\n`);

  // Get user roles
  const { data: globalRoles } = await supabase
    .from('user_roles')
    .select('role_id, roles(name, description)')
    .eq('user_id', user.id);

  const { data: locationRoles } = await supabase
    .from('user_role_locations')
    .select('role_id, location_id, roles(name, description), locations(name)')
    .eq('user_id', user.id);

  console.log('📋 Roles:');
  if (globalRoles && globalRoles.length > 0) {
    globalRoles.forEach((ur) => {
      console.log(`  - ${ur.roles?.name} (Global)`);
    });
  }
  if (locationRoles && locationRoles.length > 0) {
    locationRoles.forEach((url) => {
      console.log(`  - ${url.roles?.name} (Location: ${url.locations?.name})`);
    });
  }
  if ((!globalRoles || globalRoles.length === 0) && (!locationRoles || locationRoles.length === 0)) {
    console.log('  No roles assigned');
  }

  // Get all role IDs
  const roleIds = [
    ...(globalRoles?.map(r => r.role_id) || []),
    ...(locationRoles?.map(r => r.role_id) || [])
  ];

  if (roleIds.length === 0) {
    console.log('\n❌ No roles found, no permissions to check');
    return;
  }

  // Get permissions for these roles
  const { data: rolePermissions } = await supabase
    .from('role_permissions')
    .select('role_id, permission:permissions(id, name, description), roles(name)')
    .in('role_id', roleIds);

  console.log('\n🔐 Permissions:');
  if (rolePermissions && rolePermissions.length > 0) {
    const permissionsMap = new Map();
    rolePermissions.forEach((rp) => {
      const permName = rp.permission?.name;
      const roleName = rp.roles?.name;
      if (permName) {
        if (!permissionsMap.has(permName)) {
          permissionsMap.set(permName, []);
        }
        permissionsMap.get(permName).push(roleName);
      }
    });

    permissionsMap.forEach((roles, perm) => {
      console.log(`  ✅ ${perm}`);
      console.log(`     From roles: ${roles.join(', ')}`);
    });
  } else {
    console.log('  ❌ No permissions found for assigned roles');
  }

  // Check specific permissions
  console.log('\n🔍 Checking specific permissions:');
  const permissionNames = ['manage_bookings', 'book_turf', 'view_bookings', 'manage_locations', 'manage_services', 'manage_roles', 'manage_users'];
  
  for (const permName of permissionNames) {
    const { data: permission } = await supabase
      .from('permissions')
      .select('id')
      .eq('name', permName)
      .single();

    if (permission) {
      const { data: hasPerm } = await supabase
        .from('role_permissions')
        .select('role_id')
        .in('role_id', roleIds)
        .eq('permission_id', permission.id)
        .limit(1);

      const has = (hasPerm?.length || 0) > 0;
      console.log(`  ${has ? '✅' : '❌'} ${permName}: ${has ? 'YES' : 'NO'}`);
    } else {
      console.log(`  ⚠️  ${permName}: Permission not found in database`);
    }
  }
}

checkUserPermissions().catch(console.error);





