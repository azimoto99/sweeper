-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_locations ENABLE ROW LEVEL SECURITY;

-- USERS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
CREATE POLICY "Admins can view all profiles" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can update all profiles" ON users;
CREATE POLICY "Admins can update all profiles" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Workers can view assigned customer profiles" ON users;
CREATE POLICY "Workers can view assigned customer profiles" ON users
    FOR SELECT USING (
        role = 'customer' AND EXISTS (
            SELECT 1 FROM bookings b
            JOIN workers w ON w.id = b.worker_id
            WHERE w.profile_id = auth.uid() AND b.user_id = users.id
        )
    );

-- WORKERS TABLE POLICIES
DROP POLICY IF EXISTS "Workers can view own worker profile" ON workers;
CREATE POLICY "Workers can view own worker profile" ON workers
    FOR SELECT USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Workers can update own worker profile" ON workers;
CREATE POLICY "Workers can update own worker profile" ON workers
    FOR UPDATE USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all workers" ON workers;
CREATE POLICY "Admins can manage all workers" ON workers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Customers can view assigned workers" ON workers;
CREATE POLICY "Customers can view assigned workers" ON workers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.worker_id = workers.id AND b.user_id = auth.uid()
        )
    );

-- BOOKINGS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own bookings" ON bookings;
CREATE POLICY "Users can create own bookings" ON bookings
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
CREATE POLICY "Users can update own bookings" ON bookings
    FOR UPDATE USING (
        user_id = auth.uid() AND 
        status IN ('pending', 'assigned')
    );

DROP POLICY IF EXISTS "Workers can view assigned bookings" ON bookings;
CREATE POLICY "Workers can view assigned bookings" ON bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workers w
            WHERE w.id = bookings.worker_id AND w.profile_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Workers can update assigned bookings" ON bookings;
CREATE POLICY "Workers can update assigned bookings" ON bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workers w
            WHERE w.id = bookings.worker_id AND w.profile_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;
CREATE POLICY "Admins can manage all bookings" ON bookings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ASSIGNMENTS TABLE POLICIES
DROP POLICY IF EXISTS "Workers can view own assignments" ON assignments;
CREATE POLICY "Workers can view own assignments" ON assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workers w
            WHERE w.id = assignments.worker_id AND w.profile_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Workers can update own assignments" ON assignments;
CREATE POLICY "Workers can update own assignments" ON assignments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workers w
            WHERE w.id = assignments.worker_id AND w.profile_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Customers can view booking assignments" ON assignments;
CREATE POLICY "Customers can view booking assignments" ON assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = assignments.booking_id AND b.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage all assignments" ON assignments;
CREATE POLICY "Admins can manage all assignments" ON assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- NOTIFICATIONS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage all notifications" ON notifications;
CREATE POLICY "Admins can manage all notifications" ON notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- SUBSCRIPTIONS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own subscriptions" ON subscriptions;
CREATE POLICY "Users can create own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
CREATE POLICY "Users can update own subscriptions" ON subscriptions
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON subscriptions;
CREATE POLICY "Admins can manage all subscriptions" ON subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- PRODUCTS TABLE POLICIES
DROP POLICY IF EXISTS "Everyone can view active products" ON products;
CREATE POLICY "Everyone can view active products" ON products
    FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Admins can manage all products" ON products;
CREATE POLICY "Admins can manage all products" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ORDERS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own orders" ON orders;
CREATE POLICY "Users can create own orders" ON orders
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own orders" ON orders;
CREATE POLICY "Users can update own orders" ON orders
    FOR UPDATE USING (
        user_id = auth.uid() AND 
        status IN ('pending', 'processing')
    );

DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;
CREATE POLICY "Admins can manage all orders" ON orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ORDER_ITEMS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create own order items" ON order_items;
CREATE POLICY "Users can create own order items" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage all order items" ON order_items;
CREATE POLICY "Admins can manage all order items" ON order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- REVIEWS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view relevant reviews" ON reviews;
CREATE POLICY "Users can view relevant reviews" ON reviews
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM bookings b
            JOIN workers w ON w.id = b.worker_id
            WHERE b.id = reviews.booking_id AND w.profile_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create own reviews" ON reviews;
CREATE POLICY "Users can create own reviews" ON reviews
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
CREATE POLICY "Users can update own reviews" ON reviews
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all reviews" ON reviews;
CREATE POLICY "Admins can manage all reviews" ON reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- PROMO_CODES TABLE POLICIES
DROP POLICY IF EXISTS "Everyone can view active promo codes" ON promo_codes;
CREATE POLICY "Everyone can view active promo codes" ON promo_codes
    FOR SELECT USING (active = true AND valid_until >= CURRENT_DATE);

DROP POLICY IF EXISTS "Admins can manage all promo codes" ON promo_codes;
CREATE POLICY "Admins can manage all promo codes" ON promo_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- SERVICE_CONFIGS TABLE POLICIES
DROP POLICY IF EXISTS "Everyone can view active service configs" ON service_configs;
CREATE POLICY "Everyone can view active service configs" ON service_configs
    FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Admins can manage all service configs" ON service_configs;
CREATE POLICY "Admins can manage all service configs" ON service_configs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- SERVICE_ADD_ONS TABLE POLICIES
DROP POLICY IF EXISTS "Everyone can view active service add-ons" ON service_add_ons;
CREATE POLICY "Everyone can view active service add-ons" ON service_add_ons
    FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Admins can manage all service add-ons" ON service_add_ons;
CREATE POLICY "Admins can manage all service add-ons" ON service_add_ons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- WORKER_LOCATIONS TABLE POLICIES
DROP POLICY IF EXISTS "Workers can manage own location" ON worker_locations;
CREATE POLICY "Workers can manage own location" ON worker_locations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workers w
            WHERE w.id = worker_locations.worker_id AND w.profile_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Customers can view assigned worker locations" ON worker_locations;
CREATE POLICY "Customers can view assigned worker locations" ON worker_locations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.worker_id = worker_locations.worker_id AND b.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage all worker locations" ON worker_locations;
CREATE POLICY "Admins can manage all worker locations" ON worker_locations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'customer'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
