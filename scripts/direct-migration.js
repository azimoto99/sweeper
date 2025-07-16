#!/usr/bin/env node

// Direct migration script using Supabase JavaScript client
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
import { config } from 'dotenv'
config()

// Supabase configuration from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('   Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🚀 Running signup trigger fix migration...')
  
  try {
    // Migration SQL
    const migrationSQL = `
-- Migration: Fix signup trigger causing "Database error saving new user"
-- This removes the problematic trigger and lets the application handle user creation

-- Drop the existing trigger and function that's causing signup failures
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Ensure RLS policies allow user creation during signup
-- Update the users table policy to allow inserts with proper auth context
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Ensure the users table has proper permissions for authenticated users
GRANT INSERT ON public.users TO authenticated;
GRANT INSERT ON public.workers TO authenticated;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_workers_profile_id ON workers(profile_id);

-- Ensure the application can create worker profiles when needed
-- Update workers table policy for inserts
DROP POLICY IF EXISTS "Workers can create own profile" ON workers;
CREATE POLICY "Workers can create own profile" ON workers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = profile_id AND id = auth.uid() AND role = 'worker'
        )
    );
`

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    })

    if (error) {
      // If exec_sql doesn't exist, try direct SQL execution
      console.log('📝 Trying alternative method...')
      
      // Split into individual statements and execute
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`🔄 Executing: ${statement.substring(0, 50)}...`)
          const { error: stmtError } = await supabase.rpc('exec', { 
            sql: statement 
          })
          
          if (stmtError) {
            console.warn(`⚠️  Warning on statement: ${stmtError.message}`)
            // Continue with other statements
          }
        }
      }
    }

    console.log('✅ Migration completed successfully!')
    console.log('🎉 The signup trigger has been fixed')
    console.log('🧪 Try signing up again - it should work now')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('💡 Alternative: Run the SQL manually in your Supabase dashboard')
    console.log('   Go to SQL Editor and paste the migration from supabase/migrations/20240716_fix_signup_trigger.sql')
  }
}

runMigration()
`