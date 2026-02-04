/**
 * Fix RLS recursion issue
 */

const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'esndugjwgubxetjxqwgs';

const fixSQL = `-- Fix RLS policy recursion issue
-- This removes the problematic policies that cause infinite recursion

-- Drop the problematic user_roles policy that causes recursion
DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;

-- The "Users can view own roles" policy is fine (no recursion)
-- Keep it as is

-- Remove redundant locations policy
-- "Everyone can view active locations" already covers all users
DROP POLICY IF EXISTS "Employees can view assigned locations" ON locations;

-- Verify: All authenticated users can now see locations via "Everyone can view active locations" policy`;

console.log('\n🔧 Fix RLS Recursion Issue\n');
console.log('📋 Run this SQL in Supabase:\n');
console.log('─'.repeat(70));
console.log(fixSQL);
console.log('─'.repeat(70));
console.log(`\n🔗 SQL Editor: https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);


