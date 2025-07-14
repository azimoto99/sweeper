# 🚀 Sweeper MVP - Quick Start Guide

## Get Your Cleaning Services App Running in 10 Minutes

### 1. Prerequisites ✅
- Node.js 18+ installed
- Supabase account (free tier works)
- PayPal Developer account (optional for MVP)

### 2. Clone & Install 📦
```bash
git clone <your-repo>
cd sweeper
npm install
```

### 3. Database Setup 🗄️

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com) → New Project
   - Copy your Project URL and Anon Key

2. **Run Database Schema**
   - Open Supabase SQL Editor
   - Copy & paste content from `supabase/schema.sql`
   - Click "Run"

3. **Apply Security Policies**
   - Copy & paste content from `supabase/rls-policies.sql`
   - Click "Run"

### 4. Environment Setup 🔧
```bash
cp .env.example .env
```

Update `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Start Development 🏃‍♂️
```bash
npm run dev
```

Visit `http://localhost:5173` 🎉

### 6. Create Demo Accounts 👥

**In Supabase Auth Dashboard:**
1. Create user: `customer@demo.com` / `password`
2. Create user: `worker@demo.com` / `password`
3. Create user: `admin@demo.com` / `password`

**Run Demo Data (Optional):**
- Copy & paste `setup-demo-data.sql` in Supabase SQL Editor

### 7. Test the App 🧪

**Customer Flow:**
- Login as customer@demo.com
- Book a service → Use mock payment
- View dashboard

**Admin Flow:**
- Login as admin@demo.com
- View dispatch center
- Assign workers to bookings

**Worker Flow:**
- Login as worker@demo.com
- Set status to "Available"
- View assigned jobs

### 8. Deploy to Production 🚀

**Quick Deploy with Vercel:**
```bash
npm install -g vercel
vercel --prod
```

Add environment variables in Vercel dashboard.

## 🎯 What You Get

### ✅ Core Features Working
- User authentication & roles
- Service booking with payment
- Real-time dispatch center
- Worker mobile app
- Admin dashboard
- Customer reviews
- Subscription plans
- Product catalog

### ✅ Production Ready
- Secure database with RLS
- Real-time updates
- Mobile responsive
- TypeScript throughout
- Optimized build

## 🔧 Customization

### Update Business Info
Edit `.env`:
```env
VITE_BUSINESS_NAME="Your Business Name"
VITE_BUSINESS_PHONE="+1-XXX-XXX-XXXX"
VITE_BUSINESS_EMAIL=info@yourbusiness.com
```

### Add Real PayPal
1. Get PayPal Client ID from developer.paypal.com
2. Update `.env`:
```env
VITE_PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-secret
```

### Customize Services
Edit `src/components/booking/BookingPage.tsx`:
```javascript
const SERVICE_TYPES = [
  {
    id: 'regular',
    name: 'Regular Cleaning',
    basePrice: 80, // Update prices
    // ... customize services
  }
]
```

## 🆘 Troubleshooting

**Build Errors?**
- Check Node.js version (18+)
- Delete `node_modules` and run `npm install`

**Database Issues?**
- Verify Supabase URL and key in `.env`
- Check RLS policies are applied

**Auth Not Working?**
- Confirm users exist in Supabase Auth
- Check email verification settings

## 📞 Need Help?

1. Check the full `README.md`
2. Review `MVP-DEPLOYMENT.md`
3. Test with demo accounts first

**🎉 You're ready to launch your cleaning services platform!**
