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