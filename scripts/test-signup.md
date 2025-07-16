# Test Signup Flow

## Prerequisites
1. Run the SQL fix script in Supabase: `supabase/fix-signup-recursion.sql`
2. Ensure your `.env` file has the correct environment variables

## Testing Steps

### 1. Open Browser Console
Open your app in the browser and open the DevTools Console to see the debug logs.

### 2. Test Customer Signup
1. Go to the signup page
2. Fill in the form with a test email like `test-customer@example.com`
3. Check the console for logs:
   - "Starting signup process..."
   - "Signup successful:"
   - "Auth state change: SIGNED_IN"
   - "Fetching profile for user:"
   - "Profile not found, creating new profile..."
   - "Creating profile with data:"
   - "Profile created successfully:"

### 3. Test Worker Signup
1. Use a different email like `test-worker@example.com`
2. Select "Worker" role in the signup form
3. Check console for additional logs:
   - "Creating worker profile..."
   - "Worker profile created successfully"

### 4. Verify Database
Check your Supabase dashboard:
1. Go to Table Editor → users
2. You should see the new user records
3. For workers, check Table Editor → workers for the worker profile

## Expected Results
- ✅ No infinite recursion errors
- ✅ User profiles created in `users` table
- ✅ Worker profiles created in `workers` table (for worker signups)
- ✅ No "Database error saving new user" messages
- ✅ Smooth signup and immediate login

## Troubleshooting
If signup still fails:
1. Check the browser console for specific error messages
2. Verify the SQL script was run successfully
3. Check Supabase logs in the dashboard
4. Ensure RLS policies are not blocking the insert operations