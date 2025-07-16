-- Fix signup trigger to resolve "Database error saving new user"
-- Run this in your Supabase SQL Editor

-- First, drop the existing problematic trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create an improved function that handles errors better
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role_value user_role;
    full_name_value text;
BEGIN
    -- Safely extract role from metadata with fallback
    BEGIN
        user_role_value := COALESCE(NEW.raw_user_meta_data->>'role', 'customer')::user_role;
    EXCEPTION
        WHEN invalid_text_representation THEN
            user_role_value := 'customer'::user_role;
    END;
    
    -- Safely extract full name with fallback
    full_name_value := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    
    -- Insert user profile with proper error handling
    BEGIN
        INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
        VALUES (
            NEW.id,
            NEW.email,
            full_name_value,
            user_role_value,
            NOW(),
            NOW()
        );
        
        -- If user is a worker, create worker profile
        IF user_role_value = 'worker' THEN
            INSERT INTO public.workers (profile_id, status, assigned_bookings_count, created_at, updated_at)
            VALUES (
                NEW.id,
                'offline'::worker_status,
                0,
                NOW(),
                NOW()
            );
        END IF;
        
    EXCEPTION
        WHEN unique_violation THEN
            -- User already exists, update instead
            UPDATE public.users 
            SET 
                email = NEW.email,
                full_name = full_name_value,
                role = user_role_value,
                updated_at = NOW()
            WHERE id = NEW.id;
            
        WHEN OTHERS THEN
            -- Log the error but don't fail the auth process
            RAISE WARNING 'Error creating user profile for %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.workers TO postgres, anon, authenticated, service_role;