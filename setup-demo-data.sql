-- Demo data setup for Sweeper MVP
-- Run this in your Supabase SQL editor after setting up the schema

-- Insert demo users (these will be created when users sign up, but we can create profiles)
-- Note: You'll need to create these users through the Supabase Auth interface first

-- Demo customer
INSERT INTO profiles (id, email, full_name, phone, address, role) VALUES 
('00000000-0000-0000-0000-000000000001', 'customer@demo.com', 'John Customer', '(555) 123-4567', '123 Main St, Laredo, TX 78040', 'customer')
ON CONFLICT (id) DO NOTHING;

-- Demo worker
INSERT INTO profiles (id, email, full_name, phone, address, role) VALUES 
('00000000-0000-0000-0000-000000000002', 'worker@demo.com', 'Maria Worker', '(555) 234-5678', '456 Oak Ave, Laredo, TX 78041', 'worker')
ON CONFLICT (id) DO NOTHING;

-- Demo admin
INSERT INTO profiles (id, email, full_name, phone, address, role) VALUES 
('00000000-0000-0000-0000-000000000003', 'admin@demo.com', 'Admin User', '(555) 345-6789', '789 Pine St, Laredo, TX 78042', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Create worker profile for the demo worker
INSERT INTO workers (profile_id, status, current_location_lat, current_location_lng, assigned_bookings_count, vehicle_info) VALUES 
('00000000-0000-0000-0000-000000000002', 'available', 27.5306, -99.4803, 0, '2020 Honda Civic - White')
ON CONFLICT (profile_id) DO NOTHING;

-- Create some demo bookings
INSERT INTO bookings (user_id, service_type, scheduled_date, scheduled_time, address, status, price, location_lat, location_lng, notes) VALUES 
('00000000-0000-0000-0000-000000000001', 'regular', '2025-07-15', '10:00', '123 Main St, Laredo, TX 78040', 'pending', 80.00, 27.5306, -99.4803, 'Please focus on the kitchen and bathrooms'),
('00000000-0000-0000-0000-000000000001', 'deep', '2025-07-16', '14:00', '456 Elm St, Laredo, TX 78041', 'pending', 150.00, 27.5400, -99.4900, 'Move-in cleaning for new apartment'),
('00000000-0000-0000-0000-000000000001', 'office', '2025-07-17', '09:00', '789 Business Blvd, Laredo, TX 78042', 'assigned', 120.00, 27.5200, -99.4700, 'Weekly office cleaning')
ON CONFLICT DO NOTHING;

-- Assign one booking to the worker
UPDATE bookings 
SET worker_id = (SELECT id FROM workers WHERE profile_id = '00000000-0000-0000-0000-000000000002' LIMIT 1)
WHERE status = 'assigned';

-- Create some demo products (these are already in the code as mock data)

-- Create a demo subscription
INSERT INTO subscriptions (user_id, tier, paypal_subscription_id, status, next_billing_date, discount_percentage) VALUES 
('00000000-0000-0000-0000-000000000001', 'gold', 'demo_subscription_123', 'active', '2025-08-14', 15)
ON CONFLICT DO NOTHING;

-- Create some demo reviews
INSERT INTO reviews (user_id, booking_id, rating, comment) VALUES 
('00000000-0000-0000-0000-000000000001', 
 (SELECT id FROM bookings WHERE user_id = '00000000-0000-0000-0000-000000000001' LIMIT 1), 
 5, 'Excellent service! Very thorough and professional.')
ON CONFLICT DO NOTHING;
