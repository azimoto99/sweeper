#!/bin/bash

echo "🚀 Running signup trigger fix migration directly..."

# Load environment variables from .env safely
if [ -f .env ]; then
    # More robust env loading that handles special characters
    set -o allexport
    source .env
    set +o allexport
fi

# Extract project ref from Supabase URL
if [ -n "$VITE_SUPABASE_URL" ]; then
    PROJECT_REF=$(echo "$VITE_SUPABASE_URL" | sed 's|https://||' | sed 's|\.supabase\.co||')
else
    echo "❌ VITE_SUPABASE_URL not found in .env file"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY not found in .env file"
    echo "💡 Make sure your .env file contains SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

echo "🔧 Attempting to authenticate with CLI..."

# Try to login with project linking (don't expose the key in logs)
npx supabase login --token "$SUPABASE_SERVICE_ROLE_KEY" 2>/dev/null || true

# Link the project
echo "🔗 Linking project..."
npx supabase link --project-ref "$PROJECT_REF" || {
  echo "❌ CLI linking failed"
  echo ""
  echo "📋 MANUAL SOLUTION:"
  echo "   1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/$PROJECT_REF"
  echo "   2. Go to SQL Editor"
  echo "   3. Create a new query and paste this SQL:"
  echo ""
  cat << 'EOF'
-- Drop the problematic trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Fix RLS policies  
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Grant permissions
GRANT INSERT ON public.users TO authenticated;
GRANT INSERT ON public.workers TO authenticated;

-- Add indexes
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
EOF
  echo ""
  echo "   4. Click 'Run' to execute"
  echo "   5. Try signup again"
  exit 1
}

# Push the migration
echo "📤 Pushing migration..."
npx supabase db push

if [ $? -eq 0 ]; then
  echo "✅ Migration pushed successfully!"
  echo "🎉 The signup trigger has been fixed"
  echo "🧪 Try signing up again - it should work now"
else
  echo "❌ Migration push failed"
  echo "💡 Try the manual solution above"
fi