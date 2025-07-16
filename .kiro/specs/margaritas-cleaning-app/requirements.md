# Requirements Document

## Introduction

Margarita's Cleaning Services is a professional cleaning business in Laredo, TX that needs a modern, full-stack web application to manage their operations. The application will serve customers, workers, and administrators with features including service booking, real-time worker dispatch, payment processing, and comprehensive business management tools. The system will use Supabase as the backend, PayPal for payments, and Mapbox for mapping and dispatch functionality.

## Requirements

### Requirement 1

**User Story:** As a customer, I want to book cleaning services online with immediate payment, so that I can schedule services conveniently and securely.

#### Acceptance Criteria

1. WHEN a customer visits the booking page THEN the system SHALL display available service types (Regular Cleaning, Deep Cleaning, Move In/Out, Airbnb, Office, Commercial)
2. WHEN a customer selects a service and date THEN the system SHALL show available time slots based on worker availability
3. WHEN a customer enters their address THEN the system SHALL validate the address using Mapbox geocoding and confirm service area coverage
4. WHEN a customer adds service add-ons THEN the system SHALL update the total price dynamically (fridge cleaning +$25, window cleaning +$35)
5. WHEN a customer completes booking THEN the system SHALL process payment through PayPal Checkout integration
6. WHEN payment is successful THEN the system SHALL create a booking record and send confirmation email

### Requirement 2

**User Story:** As an administrator, I want a real-time dispatch system with interactive mapping, so that I can efficiently assign workers to jobs and track their progress.

#### Acceptance Criteria

1. WHEN an admin opens the dispatch center THEN the system SHALL display a full-screen Mapbox map with 70% map and 30% sidebar layout
2. WHEN workers are on duty THEN the system SHALL show their real-time locations as markers on the map updated every 30 seconds
3. WHEN there are unassigned bookings THEN the system SHALL display them in the sidebar with booking details
4. WHEN an admin drags a booking to a worker marker THEN the system SHALL assign the booking and calculate optimal route using Mapbox Directions API
5. WHEN an assignment is made THEN the system SHALL send real-time notifications to the worker via Supabase Realtime
6. WHEN a worker updates job status THEN the system SHALL reflect changes in real-time on the admin dashboard

### Requirement 3

**User Story:** As a worker, I want a mobile-friendly interface to manage my assignments and update job status, so that I can efficiently complete my work and communicate with dispatch.

#### Acceptance Criteria

1. WHEN a worker logs in THEN the system SHALL display their daily schedule with assigned jobs
2. WHEN a worker receives a new assignment THEN the system SHALL show job details with navigation to customer location
3. WHEN a worker updates job status THEN the system SHALL allow status changes (en route, arrived, in progress, completed)
4. WHEN a worker completes a job THEN the system SHALL allow uploading before/after photos to Supabase Storage
5. WHEN a worker is on duty THEN the system SHALL track and update their location every 30 seconds
6. WHEN a worker needs navigation THEN the system SHALL provide turn-by-turn directions using Mapbox

### Requirement 4

**User Story:** As a customer, I want to track my assigned worker's arrival and receive updates, so that I can prepare for the service and know when to expect them.

#### Acceptance Criteria

1. WHEN a worker is assigned to my booking THEN the system SHALL send me a notification with worker details
2. WHEN a worker is en route THEN the system SHALL show their real-time location on a map (like Uber tracking)
3. WHEN a worker updates their status THEN the system SHALL send me notifications about arrival estimates
4. WHEN a worker arrives THEN the system SHALL notify me of their arrival
5. WHEN service is completed THEN the system SHALL prompt me to leave a review and rating

### Requirement 5

**User Story:** As a business owner, I want a subscription system with different membership tiers, so that I can offer discounts to loyal customers and generate recurring revenue.

#### Acceptance Criteria

1. WHEN a customer views subscription options THEN the system SHALL display three tiers: Silver (10% off), Gold (15% off), Platinum (20% off)
2. WHEN a customer subscribes THEN the system SHALL process recurring payments through PayPal Subscriptions API
3. WHEN a subscribed customer books services THEN the system SHALL automatically apply their tier discount
4. WHEN subscription payments are processed THEN the system SHALL handle PayPal webhooks via Supabase Edge Functions
5. WHEN a customer wants to manage their subscription THEN the system SHALL allow them to upgrade, downgrade, or cancel

### Requirement 6

**User Story:** As an administrator, I want comprehensive user management with role-based access control, so that I can securely manage customers, workers, and admin access.

#### Acceptance Criteria

1. WHEN users register THEN the system SHALL use Supabase Auth with email/password authentication
2. WHEN customers register THEN the system SHALL offer social auth options (Google, Facebook)
3. WHEN users are created THEN the system SHALL assign appropriate roles (customer, worker, admin)
4. WHEN users access features THEN the system SHALL enforce Row Level Security policies based on their role
5. WHEN workers are added THEN the system SHALL create worker profiles with status tracking capabilities
6. WHEN admins manage users THEN the system SHALL allow role changes and account management

### Requirement 7

**User Story:** As a customer, I want to purchase cleaning products and gift cards online, so that I can buy supplies and give services as gifts.

#### Acceptance Criteria

1. WHEN a customer visits the products page THEN the system SHALL display available products with images from Supabase Storage
2. WHEN a customer adds products to cart THEN the system SHALL calculate totals and manage inventory
3. WHEN a customer purchases products THEN the system SHALL process payment through PayPal Checkout
4. WHEN a customer buys a gift card THEN the system SHALL generate a digital gift card code
5. WHEN gift cards are used THEN the system SHALL validate and apply the discount to bookings

### Requirement 8

**User Story:** As an administrator, I want analytics and reporting capabilities, so that I can track business performance and make data-driven decisions.

#### Acceptance Criteria

1. WHEN an admin views the dashboard THEN the system SHALL display key metrics (revenue, bookings, worker performance)
2. WHEN an admin generates reports THEN the system SHALL provide revenue reports by date range
3. WHEN an admin reviews worker performance THEN the system SHALL show completion times, customer ratings, and efficiency metrics
4. WHEN an admin analyzes booking patterns THEN the system SHALL display heat maps of booking density using Mapbox
5. WHEN an admin needs historical data THEN the system SHALL provide route playback and historical tracking

### Requirement 9

**User Story:** As a user, I want to receive timely notifications about booking updates and service status, so that I stay informed throughout the service process.

#### Acceptance Criteria

1. WHEN bookings are confirmed THEN the system SHALL send email confirmations using Resend
2. WHEN workers are dispatched THEN the system SHALL send SMS notifications using Twilio
3. WHEN there are delays or issues THEN the system SHALL notify relevant parties immediately
4. WHEN services are completed THEN the system SHALL send feedback requests to customers
5. WHEN emergencies occur THEN the system SHALL enable emergency reassignment with notifications

### Requirement 10

**User Story:** As a system, I want robust security and data protection measures, so that user data and business operations remain secure and private.

#### Acceptance Criteria

1. WHEN users access data THEN the system SHALL enforce Row Level Security policies for all database tables
2. WHEN worker locations are tracked THEN the system SHALL only show locations during work hours to authorized users
3. WHEN customers track workers THEN the system SHALL only show their assigned worker's location
4. WHEN API keys are used THEN the system SHALL securely manage Mapbox, PayPal, and Supabase credentials
5. WHEN location updates occur THEN the system SHALL implement rate limiting to prevent abuse
6. WHEN payments are processed THEN the system SHALL comply with PCI DSS requirements through PayPal integration