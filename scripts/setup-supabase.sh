#!/bin/bash

echo "🔐 Setting up Supabase CLI authentication..."

# Check if token is provided as argument
if [ -n "$1" ]; then
  echo "1️⃣ Logging in with provided token..."
  npx supabase login --token "$1"
else
  echo "1️⃣ Logging in to Supabase..."
  echo "   This will open your browser to authenticate"
  echo "   OR you can run: npm run db:setup YOUR_ACCESS_TOKEN"
  npx supabase login
fi

if [ $? -ne 0 ]; then
  echo "❌ Login failed"
  echo "💡 To get an access token:"
  echo "   1. Go to https://supabase.com/dashboard/account/tokens"
  echo "   2. Generate a new token"
  echo "   3. Run: npm run db:setup YOUR_TOKEN"
  exit 1
fi

echo "✅ Login successful!"

# Step 2: Link project
echo ""
echo "2️⃣ Linking to your remote project..."
echo "   You'll need your Project Reference ID from your Supabase dashboard"
echo "   (Find it in your dashboard URL: https://supabase.com/dashboard/project/YOUR_PROJECT_REF)"
echo ""

npx supabase link

if [ $? -eq 0 ]; then
  echo "✅ Project linked successfully!"
  echo ""
  echo "3️⃣ Now you can push the migration:"
  echo "   npm run db:push"
else
  echo "❌ Project linking failed"
  echo "💡 Make sure you have the correct Project Reference ID"
fi