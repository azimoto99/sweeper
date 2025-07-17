-- Create a function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile if user is confirmed (email_confirmed_at is not null)
  -- and profile doesn't already exist
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    -- Check if profile already exists
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
      -- Insert new user profile
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
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
        NOW(),
        NOW()
      );

      -- If user is a worker, create worker profile
      IF COALESCE(NEW.raw_user_meta_data->>'role', 'customer') = 'worker' THEN
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for when users confirm their email
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT INSERT ON public.users TO authenticated;
GRANT INSERT ON public.workers TO authenticated;

-- Ensure RLS policies allow profile creation
DROP POLICY IF EXISTS "Enable insert for authenticated users during signup" ON users;
CREATE POLICY "Enable insert for authenticated users during signup" ON users
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable insert for worker profiles during signup" ON workers;
CREATE POLICY "Enable insert for worker profiles during signup" ON workers
  FOR INSERT WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_workers_profile_id ON workers(profile_id);
CREATE INDEX IF NOT EXISTS idx_auth_users_email_confirmed ON auth.users(email_confirmed_at) WHERE email_confirmed_at IS NOT NULL;
