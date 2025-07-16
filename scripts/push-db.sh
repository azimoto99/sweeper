#!/bin/bash

# Script to push database migrations to Supabase
echo "🚀 Pushing database migration to fix signup trigger..."

# Check if Supabase is linked
if [ ! -f ".env.local" ]; then
  echo "❗ Project not linked to remote Supabase yet"
  echo "📝 You need to run: npx supabase link --project-ref YOUR_PROJECT_REF"
  echo "🔍 Find your project ref in your Supabase dashboard URL"
  exit 1
fi

# Push the migration
echo "📤 Pushing migration: fix_signup_trigger.sql"
npx supabase db push

if [ $? -eq 0 ]; then
  echo "✅ Migration pushed successfully!"
  echo "🎉 The signup trigger has been fixed"
  echo "🧪 Try signing up again - it should work now"
else
  echo "❌ Migration failed"
  echo "🔍 Check the error above and verify your Supabase configuration"
fi