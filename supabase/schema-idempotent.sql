-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'worker', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE worker_status AS ENUM ('available', 'en_route', 'on_job', 'break', 'offline');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'assigned', 'en_route', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_type AS ENUM ('regular', 'deep', 'move_in_out', 'airbnb', 'office', 'commercial');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('silver', 'gold', 'platinum');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    role user_role DEFAULT 'customer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create workers table
CREATE TABLE IF NOT EXISTS workers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    status worker_status DEFAULT 'offline',
    current_location_lat DECIMAL(10, 8),
    current_location_lng DECIMAL(11, 8),
    last_location_update TIMESTAMPTZ,
    assigned_bookings_count INTEGER DEFAULT 0,
    vehicle_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    service_type service_type NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    address TEXT NOT NULL,
    status booking_status DEFAULT 'pending',
    price DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    paypal_order_id TEXT,
    location_lat DECIMAL(10, 8) NOT NULL,
    location_lng DECIMAL(11, 8) NOT NULL,
    add_ons TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assignments table for tracking worker assignments
CREATE TABLE IF NOT EXISTS assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    status booking_status DEFAULT 'assigned',
    estimated_arrival TIMESTAMPTZ,
    actual_arrival TIMESTAMPTZ,
    completion_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    tier subscription_tier NOT NULL,
    paypal_subscription_id TEXT UNIQUE NOT NULL,
    status subscription_status DEFAULT 'active',
    next_billing_date DATE NOT NULL,
    discount_percentage INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    inventory INTEGER DEFAULT 0,
    image_url TEXT,
    category TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    status order_status DEFAULT 'pending',
    paypal_order_id TEXT UNIQUE NOT NULL,
    paypal_capture_id TEXT,
    shipping_address JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
    worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    photos TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    discount_type discount_type NOT NULL,
    valid_until DATE NOT NULL,
    usage_limit INTEGER NOT NULL,
    times_used INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create service_configs table
CREATE TABLE IF NOT EXISTS service_configs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    service_type service_type UNIQUE NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    description TEXT NOT NULL,
    duration_hours DECIMAL(4, 2) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create service_add_ons table
CREATE TABLE IF NOT EXISTS service_add_ons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    service_config_id UUID REFERENCES service_configs(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create worker_locations table for tracking real-time location
CREATE TABLE IF NOT EXISTS worker_locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    heading DECIMAL(5, 2),
    speed DECIMAL(6, 2),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);
CREATE INDEX IF NOT EXISTS idx_workers_profile_id ON workers(profile_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_worker_id ON bookings(worker_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_bookings_location ON bookings(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_assignments_booking_id ON assignments(booking_id);
CREATE INDEX IF NOT EXISTS idx_assignments_worker_id ON assignments(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_locations_worker_id ON worker_locations(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_locations_timestamp ON worker_locations(timestamp);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_worker_id ON reviews(worker_id);

-- Create spatial index for location-based queries (only if they don't exist)
DO $$ BEGIN
    CREATE INDEX idx_bookings_location_gist ON bookings USING GIST(ST_Point(location_lng, location_lat));
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_workers_location_gist ON workers USING GIST(ST_Point(current_location_lng, current_location_lat));
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (drop and recreate to avoid conflicts)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workers_updated_at ON workers;
CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_promo_codes_updated_at ON promo_codes;
CREATE TRIGGER update_promo_codes_updated_at BEFORE UPDATE ON promo_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_configs_updated_at ON service_configs;
CREATE TRIGGER update_service_configs_updated_at BEFORE UPDATE ON service_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_add_ons_updated_at ON service_add_ons;
CREATE TRIGGER update_service_add_ons_updated_at BEFORE UPDATE ON service_add_ons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default service configurations (only if they don't exist)
INSERT INTO service_configs (service_type, base_price, description, duration_hours) 
SELECT 'regular', 120.00, 'Standard cleaning service including dusting, vacuuming, mopping, and bathroom/kitchen cleaning', 2.5
WHERE NOT EXISTS (SELECT 1 FROM service_configs WHERE service_type = 'regular');

INSERT INTO service_configs (service_type, base_price, description, duration_hours) 
SELECT 'deep', 250.00, 'Comprehensive deep cleaning including all regular services plus baseboards, inside appliances, and detailed scrubbing', 4.5
WHERE NOT EXISTS (SELECT 1 FROM service_configs WHERE service_type = 'deep');

INSERT INTO service_configs (service_type, base_price, description, duration_hours) 
SELECT 'move_in_out', 300.00, 'Complete move-in or move-out cleaning for empty properties', 5.0
WHERE NOT EXISTS (SELECT 1 FROM service_configs WHERE service_type = 'move_in_out');

INSERT INTO service_configs (service_type, base_price, description, duration_hours) 
SELECT 'airbnb', 80.00, 'Quick turnaround cleaning for short-term rentals', 1.5
WHERE NOT EXISTS (SELECT 1 FROM service_configs WHERE service_type = 'airbnb');

INSERT INTO service_configs (service_type, base_price, description, duration_hours) 
SELECT 'office', 150.00, 'Professional office cleaning including workstations, common areas, and restrooms', 3.0
WHERE NOT EXISTS (SELECT 1 FROM service_configs WHERE service_type = 'office');

INSERT INTO service_configs (service_type, base_price, description, duration_hours) 
SELECT 'commercial', 200.00, 'Commercial space cleaning tailored to business needs', 4.0
WHERE NOT EXISTS (SELECT 1 FROM service_configs WHERE service_type = 'commercial');

-- Insert default service add-ons (only if they don't exist)
INSERT INTO service_add_ons (service_config_id, name, price, description) 
SELECT sc.id, 'Refrigerator Cleaning', 25.00, 'Deep cleaning inside and outside of refrigerator'
FROM service_configs sc 
WHERE sc.service_type IN ('regular', 'deep', 'move_in_out')
AND NOT EXISTS (
    SELECT 1 FROM service_add_ons sa 
    WHERE sa.service_config_id = sc.id AND sa.name = 'Refrigerator Cleaning'
);

INSERT INTO service_add_ons (service_config_id, name, price, description)
SELECT sc.id, 'Window Cleaning', 35.00, 'Interior and exterior window cleaning'
FROM service_configs sc 
WHERE sc.service_type IN ('regular', 'deep', 'move_in_out', 'office')
AND NOT EXISTS (
    SELECT 1 FROM service_add_ons sa 
    WHERE sa.service_config_id = sc.id AND sa.name = 'Window Cleaning'
);

INSERT INTO service_add_ons (service_config_id, name, price, description)
SELECT sc.id, 'Oven Cleaning', 40.00, 'Deep cleaning of oven interior and racks'
FROM service_configs sc 
WHERE sc.service_type IN ('regular', 'deep', 'move_in_out')
AND NOT EXISTS (
    SELECT 1 FROM service_add_ons sa 
    WHERE sa.service_config_id = sc.id AND sa.name = 'Oven Cleaning'
);

INSERT INTO service_add_ons (service_config_id, name, price, description)
SELECT sc.id, 'Garage Cleaning', 50.00, 'Sweeping and organizing garage space'
FROM service_configs sc 
WHERE sc.service_type IN ('deep', 'move_in_out')
AND NOT EXISTS (
    SELECT 1 FROM service_add_ons sa 
    WHERE sa.service_config_id = sc.id AND sa.name = 'Garage Cleaning'
);

-- Insert sample products (only if they don't exist)
INSERT INTO products (name, description, price, inventory, category) 
SELECT 'Premium All-Purpose Cleaner', 'Professional-grade eco-friendly all-purpose cleaner', 15.99, 100, 'cleaning-supplies'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Premium All-Purpose Cleaner');

INSERT INTO products (name, description, price, inventory, category) 
SELECT 'Microfiber Cleaning Cloths (Pack of 6)', 'High-quality microfiber cloths for streak-free cleaning', 24.99, 50, 'cleaning-supplies'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Microfiber Cleaning Cloths (Pack of 6)');

INSERT INTO products (name, description, price, inventory, category) 
SELECT 'Glass Cleaner Spray', 'Ammonia-free glass and mirror cleaner', 12.99, 75, 'cleaning-supplies'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Glass Cleaner Spray');

INSERT INTO products (name, description, price, inventory, category) 
SELECT 'Stainless Steel Polish', 'Premium polish for stainless steel appliances', 18.99, 30, 'cleaning-supplies'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Stainless Steel Polish');

INSERT INTO products (name, description, price, inventory, category) 
SELECT 'Gift Card - $50', 'Digital gift card for cleaning services', 50.00, 999, 'gift-cards'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Gift Card - $50');

INSERT INTO products (name, description, price, inventory, category) 
SELECT 'Gift Card - $100', 'Digital gift card for cleaning services', 100.00, 999, 'gift-cards'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Gift Card - $100');

INSERT INTO products (name, description, price, inventory, category) 
SELECT 'Gift Card - $200', 'Digital gift card for cleaning services', 200.00, 999, 'gift-cards'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Gift Card - $200');

-- Insert sample promo codes (only if they don't exist)
INSERT INTO promo_codes (code, discount_amount, discount_type, valid_until, usage_limit) 
SELECT 'WELCOME20', 20.00, 'percentage', '2024-12-31', 100
WHERE NOT EXISTS (SELECT 1 FROM promo_codes WHERE code = 'WELCOME20');

INSERT INTO promo_codes (code, discount_amount, discount_type, valid_until, usage_limit) 
SELECT 'FIRSTTIME', 25.00, 'fixed', '2024-12-31', 50
WHERE NOT EXISTS (SELECT 1 FROM promo_codes WHERE code = 'FIRSTTIME');

INSERT INTO promo_codes (code, discount_amount, discount_type, valid_until, usage_limit) 
SELECT 'SUMMER2024', 15.00, 'percentage', '2024-09-30', 200
WHERE NOT EXISTS (SELECT 1 FROM promo_codes WHERE code = 'SUMMER2024');
