# Manual Fix for Signup Issue

Since the CLI is having issues with environment file parsing, here's the manual fix:

## 🚀 Quick Manual Solution

1. **Go to your Supabase SQL Editor**: 
   https://supabase.com/dashboard/project/yabxcxqelpsvslwcardc/sql

2. **Create a new query and paste this SQL**:

```sql
-- Drop the problematic trigger causing signup failures
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Fix RLS policies to allow user creation during signup
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT INSERT ON public.users TO authenticated;
GRANT INSERT ON public.workers TO authenticated;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_workers_profile_id ON workers(profile_id);

-- Fix worker creation policy
DROP POLICY IF EXISTS "Workers can create own profile" ON workers;
CREATE POLICY "Workers can create own profile" ON workers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = profile_id AND id = auth.uid() AND role = 'worker'
        )
    );
```

3. **Click "Run" to execute the SQL**

4. **Test signup again** - it should work now!

## 🔍 What this does:

- ✅ Removes the problematic database trigger
- ✅ Fixes Row Level Security policies 
- ✅ Grants proper permissions for user creation
- ✅ Lets the application handle user profile creation (more reliable)

## 🎯 After running this:

The "Database error saving new user" should be resolved and signups should work properly.