# Supabase Authentication Configuration for Production

## 🔧 Fix Email Verification Links

To fix email verification links redirecting to localhost instead of your production URL, you need to configure both your application and Supabase dashboard.

### **Step 1: Update Your Environment Variables**

Add this to your `.env` file (using the actual Render URL):

```bash
VITE_SITE_URL=https://sweeper-margaritas-cleaning.onrender.com
```

### **Step 2: Configure Supabase Dashboard**

1. **Go to your Supabase Dashboard**: 
   https://supabase.com/dashboard/project/yabxcxqelpsvslwcardc

2. **Navigate to Authentication → URL Configuration**

3. **Update these settings**:

   **Site URL:**
   ```
   https://sweeper-margaritas-cleaning.onrender.com
   ```

   **Additional Redirect URLs** (add all these):
   ```
   https://sweeper-margaritas-cleaning.onrender.com/auth/callback
   https://sweeper-margaritas-cleaning.onrender.com/auth/email-verified
   http://localhost:5173/auth/callback
   http://localhost:5173/auth/email-verified
   ```

### **Step 3: Update Environment Variables on Render**

In your Render dashboard, add:
- `VITE_SITE_URL` = `https://sweeper-margaritas-cleaning.onrender.com`

### **Step 4: Test**

1. Deploy your app with the new environment variable
2. Test email verification - links should now point to your production URL

## 🔍 What this fixes:

- ✅ Email verification links will use your production URL
- ✅ Password reset links will work correctly
- ✅ OAuth redirects will work for production
- ✅ Magic link authentication will work

## 📱 Mobile Considerations

If you plan to add mobile apps later, you'll also need to add custom URL schemes to the redirect URLs list.