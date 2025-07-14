# Sweeper - Cleaning Services Management Platform

A full-stack web application for Margarita's Cleaning Services, providing real-time dispatch management, worker tracking, customer booking, and payment processing.

## 🚀 Features

### Core Functionality
- **Real-Time Dispatch System** - Drag-and-drop worker assignment with live GPS tracking
- **Customer Booking** - Complete booking flow with PayPal payment integration
- **Worker Mobile App** - GPS tracking, job management, and status updates
- **Admin Dashboard** - Business analytics, worker management, and operational oversight
- **Subscription System** - Membership plans with automatic billing
- **Product Catalog** - E-commerce functionality for cleaning supplies
- **Reviews System** - Customer feedback and rating system

### Technical Features
- **Real-Time Updates** - Supabase Realtime for live data synchronization
- **Geospatial Mapping** - Mapbox integration with custom markers and routing
- **Payment Processing** - PayPal integration for bookings and subscriptions
- **Role-Based Access** - Secure authentication with customer/worker/admin roles
- **Mobile-Responsive** - PWA-ready design for all devices
- **Location Tracking** - GPS tracking with 30-second updates for workers

## 🛠 Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router Dom** for navigation
- **React Hook Form** with Yup validation
- **React DnD** for drag-and-drop functionality

### Backend & Database
- **Supabase** (PostgreSQL with PostGIS)
- **Row Level Security** policies for data protection
- **Supabase Auth** for authentication
- **Supabase Realtime** for live updates
- **Supabase Storage** for file uploads

### External Services
- **Mapbox GL JS** for mapping and geolocation
- **PayPal Server SDK** for payment processing
- **Resend** for email notifications (via Edge Functions)
- **Twilio** for SMS notifications (via Edge Functions)

### Deployment
- **Vercel** for frontend hosting
- **Supabase** for backend infrastructure

## 📁 Project Structure

```
sweeper/
├── src/
│   ├── components/          # React components
│   │   ├── admin/          # Admin dashboard components
│   │   ├── auth/           # Authentication components
│   │   ├── booking/        # Customer booking components
│   │   ├── dashboard/      # Dashboard components
│   │   ├── layout/         # Layout and navigation
│   │   ├── map/            # Mapbox map components
│   │   ├── payment/        # PayPal payment components
│   │   ├── products/       # Product catalog components
│   │   ├── profile/        # User profile components
│   │   ├── reviews/        # Reviews and feedback components
│   │   ├── subscriptions/  # Subscription management components
│   │   └── worker/         # Worker mobile interface
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   │   ├── mapbox.ts      # Mapbox integration
│   │   ├── paypal.ts      # PayPal integration
│   │   └── supabase.ts    # Supabase client
│   └── types/              # TypeScript type definitions
├── supabase/
│   ├── functions/          # Edge Functions
│   │   ├── assign-booking-to-worker/
│   │   ├── handle-paypal-webhook/
│   │   ├── send-notification/
│   │   └── update-worker-location/
│   ├── schema.sql          # Database schema
│   └── rls-policies.sql    # Row Level Security policies
└── public/                 # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Mapbox account
- PayPal Developer account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sweeper
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Mapbox Configuration
   VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token
   
   # PayPal Configuration
   VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   
   # Business Configuration
   VITE_BUSINESS_NAME="Margarita's Cleaning Services"
   VITE_BUSINESS_PHONE="+1-956-XXX-XXXX"
   VITE_BUSINESS_EMAIL=info@margaritascleaning.com
   ```

4. **Set up Supabase database**
   ```bash
   # Run the schema creation
   # Execute supabase/schema.sql in your Supabase SQL editor
   
   # Apply RLS policies
   # Execute supabase/rls-policies.sql in your Supabase SQL editor
   ```

5. **Deploy Supabase Edge Functions** (Optional)
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Deploy functions
   supabase functions deploy handle-paypal-webhook
   supabase functions deploy send-notification
   supabase functions deploy update-worker-location
   supabase functions deploy assign-booking-to-worker
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

## 🌍 Deployment

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Set environment variables in Vercel dashboard**
   - Go to your Vercel project settings
   - Add all environment variables from `.env.example`

### Environment Variables for Production

Set these in your Vercel project settings:

- `@supabase_url` - Your Supabase project URL
- `@supabase_anon_key` - Your Supabase anonymous key
- `@mapbox_access_token` - Your Mapbox access token
- `@paypal_client_id` - Your PayPal client ID
- `@app_url` - Your production domain
- `@business_phone` - Business phone number
- `@business_email` - Business email address

## 🔧 Configuration

### Database Setup

The application requires PostgreSQL with PostGIS extension. The database schema includes:

- **User management** with role-based access (customer, worker, admin)
- **Geospatial data** for locations and service areas
- **Real-time subscriptions** for live updates
- **Comprehensive RLS policies** for data security

### PayPal Configuration

1. Create PayPal Developer account
2. Set up sandbox/production apps
3. Configure webhook endpoints for subscription management
4. Create subscription plans for membership tiers

### Mapbox Configuration

1. Create Mapbox account
2. Generate access token with appropriate scopes
3. Configure custom map styles (optional)

## 📱 User Roles & Features

### Customers
- Book cleaning services with real-time availability
- Track worker location during service
- Manage subscriptions and membership benefits
- Purchase cleaning products
- Leave reviews and feedback
- View service history and invoices

### Workers
- Mobile-optimized interface
- GPS location tracking
- Job assignment notifications
- Route navigation integration
- Status updates (available, en route, on job, etc.)
- Daily schedule management

### Administrators
- Real-time dispatch center with drag-and-drop assignment
- Worker location tracking and management
- Business analytics and reporting
- Customer and booking management
- Product catalog management
- Review and feedback oversight

## 🔐 Security Features

- **Row Level Security** on all database tables
- **JWT-based authentication** with Supabase Auth
- **Role-based access control** throughout the application
- **Location privacy** - workers only visible during work hours
- **Secure payment processing** with PayPal
- **API rate limiting** and webhook verification

## 🧪 Testing

```bash
# Run linting
npm run lint

# Run type checking
npm run build
```

## 📊 Analytics & Monitoring

The application includes built-in analytics for:
- Booking conversion rates
- Worker performance metrics
- Customer satisfaction scores
- Revenue tracking
- Service area coverage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is proprietary software for Margarita's Cleaning Services.

## 🆘 Support

For technical support or questions:
- Email: dev@margaritascleaning.com
- Phone: +1-956-XXX-XXXX

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - Real-time dispatch system
  - Customer booking with payments
  - Worker mobile interface
  - Basic admin dashboard
  - Subscription system
  - Product catalog
  - Reviews system