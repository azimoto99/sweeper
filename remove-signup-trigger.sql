-- Alternative: Remove automatic user creation trigger
-- This lets the application handle user profile creation instead

-- Drop the trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- The application will handle user creation in the auth state change handler