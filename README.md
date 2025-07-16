# Sweeper - Professional Cleaning Services Platform

A comprehensive cleaning services platform that connects customers with professional cleaning workers through a real-time dispatch system. Built for Margarita's Cleaning Services in the Laredo, TX area.

## 🚀 Features

- **Real-time Booking & Dispatch** - Live assignment of workers to customer requests
- **Multi-role Platform** - Separate interfaces for customers, workers, and administrators
- **Payment Processing** - PayPal integration with subscription management
- **Location Services** - Geographic service area management with Mapbox integration
- **Mobile-first Design** - Responsive interface optimized for worker mobile usage
- **Review System** - Customer feedback and rating system
- **E-commerce Integration** - Product catalog for cleaning supplies
- **Subscription Plans** - Membership tiers with discounts for regular customers

## 🛠 Technology Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for build tooling and development server
- **Tailwind CSS 4.x** with custom design system
- **React Router DOM** for client-side routing
- **React Hook Form** with Yup validation

### Backend & Database
- **Supabase** for backend-as-a-service
- **PostgreSQL** with Row Level Security (RLS)
- **Real-time subscriptions** for live updates
- **Supabase Auth** for authentication

### Key Libraries
- **React DnD** - Drag-and-drop functionality
- **Mapbox GL** - Mapping and location services
- **PayPal SDK** - Payment processing
- **React Hot Toast** - Notifications
- **Date-fns** - Date manipulation
- **Heroicons** - Consistent iconography

## 📋 Prerequisites

- **Node.js 18+**
- **npm** or **yarn**
- **Supabase account** and project
- **PayPal Developer account**
- **Mapbox account** for mapping services

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd sweeper
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env` and configure:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# PayPal Configuration
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id

# Mapbox Configuration
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token

# Business Configuration
VITE_BUSINESS_NAME="Margarita's Cleaning Services"
VITE_BUSINESS_PHONE="+1-956-XXX-XXXX"
VITE_BUSINESS_EMAIL="info@margaritascleaning.com"
VITE_SERVICE_AREA_RADIUS=25
VITE_SERVICE_AREA_CENTER_LAT=27.5306
VITE_SERVICE_AREA_CENTER_LNG=-99.4803
```

### 3. Database Setup
In your Supabase SQL Editor, execute in order:
1. `supabase/schema.sql` - Database schema
2. `supabase/rls-policies.sql` - Security policies
3. `supabase/notifications.sql` - Real-time notifications
4. `setup-demo-data.sql` - (Optional) Demo data for testing

### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to see the application.

## 📁 Project Structure

```
sweeper/
├── src/
│   ├── components/          # React components organized by feature
│   │   ├── admin/          # Admin dashboard and dispatch center
│   │   ├── auth/           # Authentication forms and guards
│   │   ├── booking/        # Service booking flow
│   │   ├── customer/       # Customer-specific features
│   │   ├── worker/         # Worker mobile interface
│   │   ├── dashboard/      # Role-based dashboards
│   │   ├── layout/         # Shared layout components
│   │   ├── ui/             # Reusable UI components
│   │   ├── forms/          # Form components and validation
│   │   ├── payment/        # PayPal integration
│   │   ├── map/            # Mapbox integration
│   │   ├── notifications/  # Toast and real-time notifications
│   │   ├── products/       # E-commerce catalog
│   │   ├── reviews/        # Rating and review system
│   │   └── subscriptions/  # Membership plans
│   ├── contexts/           # React contexts (Auth, Loading)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Third-party service integrations
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions and helpers
│   ├── pages/              # Full page components
│   └── styles/             # Additional CSS files
├── supabase/               # Database schema and policies
├── public/                 # Static assets
└── plans/                  # Project planning documents
```

## 🎯 User Roles

### Customer
- Browse and book cleaning services
- Manage appointments and subscriptions
- Rate and review completed services
- Purchase cleaning supplies

### Worker
- Mobile-optimized interface for field work
- Receive real-time job assignments
- Update job status and completion
- Access customer information and service details

### Administrator
- Dispatch center for managing bookings
- Worker management and scheduling
- Customer service and support
- Analytics and reporting

## 🔧 Development Commands

```bash
# Development
npm run dev          # Start development server (localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Database
# Execute SQL files in Supabase SQL Editor in this order:
# 1. supabase/schema.sql
# 2. supabase/rls-policies.sql
# 3. supabase/notifications.sql
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### Manual Build
```bash
npm run build
# Deploy the 'dist' folder to your hosting provider
```

## 🔐 Security Features

- **Row Level Security (RLS)** - Database-level access control
- **Role-based Authentication** - Separate permissions for each user type
- **Secure Payment Processing** - PayPal SDK integration
- **Environment Variable Protection** - Sensitive data in environment variables

## 📱 Mobile Support

The application is built mobile-first with special attention to:
- Worker mobile interface for field operations
- Touch-friendly booking interface for customers
- Responsive design across all screen sizes
- Offline-capable features for workers

## 🗺 Service Area

Currently configured for Laredo, TX area with a 25-mile service radius. Geographic boundaries are enforced through:
- Mapbox integration for address validation
- Service area visualization on booking forms
- Automatic distance calculations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Email: info@margaritascleaning.com
- Phone: +1-956-XXX-XXXX

## 🎉 Acknowledgments

Built with modern web technologies and best practices for a seamless cleaning service experience.