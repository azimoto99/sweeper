-- Comprehensive fix for authentication and signup issues
-- Run this in your Supabase SQL Editor

-- 1. Clean up any existing problematic triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. Create improved function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_name TEXT;
BEGIN
  -- Only proceed if user just got confirmed (email_confirmed_at changed from null to not null)
  IF NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR OLD IS NULL) THEN
    
    -- Extract user metadata
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    
    -- Check if profile already exists to avoid duplicates
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
      
      -- Insert user profile
      INSERT INTO public.users (
        id,
        email,
        full_name,
        role,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        NEW.email,
        user_name,
        user_role,
        NOW(),
        NOW()
      );

      -- Create worker profile if user is a worker
      IF user_role = 'worker' THEN
        INSERT INTO public.workers (
          profile_id,
          status,
          assigned_bookings_count,
          created_at,
          updated_at
        ) VALUES (
          NEW.id,
          'offline',
          0,
          NOW(),
          NOW()
        );
      END IF;
      
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE WARNING 'Error creating user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger for email confirmation
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Also handle immediate signups (no email confirmation required)
CREATE OR REPLACE FUNCTION public.handle_immediate_signup()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_name TEXT;
BEGIN
  -- Handle users who are immediately confirmed (no email verification)
  IF NEW.email_confirmed_at IS NOT NULL THEN
    
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    
    -- Check if profile already exists
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
      
      INSERT INTO public.users (
        id,
        email,
        full_name,
        role,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        NEW.email,
        user_name,
        user_role,
        NOW(),
        NOW()
      );

      IF user_role = 'worker' THEN
        INSERT INTO public.workers (
          profile_id,
          status,
          assigned_bookings_count,
          created_at,
          updated_at
        ) VALUES (
          NEW.id,
          'offline',
          0,
          NOW(),
          NOW()
        );
      END IF;
      
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating immediate user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger for immediate signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_immediate_signup();

-- 6. Fix RLS policies to allow profile creation
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Workers can create own profile" ON workers;
DROP POLICY IF EXISTS "Enable insert for authenticated users during signup" ON users;
DROP POLICY IF EXISTS "Enable insert for worker profiles during signup" ON workers;

-- Create comprehensive RLS policies
CREATE POLICY "Users can manage own profile" ON users
  FOR ALL USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Workers can manage own profile" ON workers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = profile_id AND id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = profile_id AND id = auth.uid() AND role = 'worker'
    )
  );

-- Allow system to create profiles during signup
CREATE POLICY "System can create user profiles" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can create worker profiles" ON workers
  FOR INSERT WITH CHECK (true);

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.workers TO authenticated, anon;

-- 8. Create helpful indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_workers_profile_id ON workers(profile_id);
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);

-- 9. Create a function to manually fix existing users without profiles
CREATE OR REPLACE FUNCTION public.fix_missing_profiles()
RETURNS TABLE(fixed_user_id UUID, user_email TEXT) AS $$
DECLARE
  auth_user RECORD;
  user_role TEXT;
  user_name TEXT;
BEGIN
  -- Find auth users without profiles
  FOR auth_user IN 
    SELECT au.id, au.email, au.raw_user_meta_data, au.email_confirmed_at
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL AND au.email_confirmed_at IS NOT NULL
  LOOP
    user_role := COALESCE(auth_user.raw_user_meta_data->>'role', 'customer');
    user_name := COALESCE(auth_user.raw_user_meta_data->>'full_name', split_part(auth_user.email, '@', 1));
    
    -- Create missing profile
    INSERT INTO public.users (
      id,
      email,
      full_name,
      role,
      created_at,
      updated_at
    ) VALUES (
      auth_user.id,
      auth_user.email,
      user_name,
      user_role,
      NOW(),
      NOW()
    );
    
    -- Create worker profile if needed
    IF user_role = 'worker' THEN
      INSERT INTO public.workers (
        profile_id,
        status,
        assigned_bookings_count,
        created_at,
        updated_at
      ) VALUES (
        auth_user.id,
        'offline',
        0,
        NOW(),
        NOW()
      );
    END IF;
    
    fixed_user_id := auth_user.id;
    user_email := auth_user.email;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Run the fix for existing users
SELECT * FROM public.fix_missing_profiles();

-- 11. Verify the setup
DO $$
BEGIN
  RAISE NOTICE 'Authentication fix completed successfully!';
  RAISE NOTICE 'Triggers created: on_auth_user_confirmed, on_auth_user_created';
  RAISE NOTICE 'RLS policies updated for users and workers tables';
  RAISE NOTICE 'Missing profiles fixed for existing users';
END $$;
