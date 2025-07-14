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
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Workers can view customer profiles for their assigned bookings
CREATE POLICY "Workers can view assigned customer profiles" ON users
    FOR SELECT USING (
        role = 'customer' AND EXISTS (
            SELECT 1 FROM bookings b
            JOIN workers w ON w.id = b.worker_id
            WHERE w.profile_id = auth.uid() AND b.user_id = users.id
        )
    );

-- WORKERS TABLE POLICIES
-- Workers can view their own worker profile
CREATE POLICY "Workers can view own worker profile" ON workers
    FOR SELECT USING (profile_id = auth.uid());

-- Workers can update their own worker profile
CREATE POLICY "Workers can update own worker profile" ON workers
    FOR UPDATE USING (profile_id = auth.uid());

-- Admins can manage all worker profiles
CREATE POLICY "Admins can manage all workers" ON workers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Customers can view workers assigned to their bookings
CREATE POLICY "Customers can view assigned workers" ON workers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.worker_id = workers.id AND b.user_id = auth.uid()
        )
    );

-- BOOKINGS TABLE POLICIES
-- Users can view their own bookings
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT USING (user_id = auth.uid());

-- Users can create their own bookings
CREATE POLICY "Users can create own bookings" ON bookings
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own bookings (before assignment)
CREATE POLICY "Users can update own bookings" ON bookings
    FOR UPDATE USING (
        user_id = auth.uid() AND 
        status IN ('pending', 'assigned')
    );

-- Workers can view their assigned bookings
CREATE POLICY "Workers can view assigned bookings" ON bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workers w
            WHERE w.id = bookings.worker_id AND w.profile_id = auth.uid()
        )
    );

-- Workers can update their assigned bookings
CREATE POLICY "Workers can update assigned bookings" ON bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workers w
            WHERE w.id = bookings.worker_id AND w.profile_id = auth.uid()
        )
    );

-- Admins can manage all bookings
CREATE POLICY "Admins can manage all bookings" ON bookings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ASSIGNMENTS TABLE POLICIES
-- Workers can view their own assignments
CREATE POLICY "Workers can view own assignments" ON assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workers w
            WHERE w.id = assignments.worker_id AND w.profile_id = auth.uid()
        )
    );

-- Workers can update their own assignments
CREATE POLICY "Workers can update own assignments" ON assignments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workers w
            WHERE w.id = assignments.worker_id AND w.profile_id = auth.uid()
        )
    );

-- Customers can view assignments for their bookings
CREATE POLICY "Customers can view booking assignments" ON assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = assignments.booking_id AND b.user_id = auth.uid()
        )
    );

-- Admins can manage all assignments
CREATE POLICY "Admins can manage all assignments" ON assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- NOTIFICATIONS TABLE POLICIES
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- System can insert notifications for any user
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Admins can manage all notifications
CREATE POLICY "Admins can manage all notifications" ON notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- SUBSCRIPTIONS TABLE POLICIES
-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (user_id = auth.uid());

-- Users can create their own subscriptions
CREATE POLICY "Users can create own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions" ON subscriptions
    FOR UPDATE USING (user_id = auth.uid());

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage all subscriptions" ON subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- PRODUCTS TABLE POLICIES
-- Everyone can view active products
CREATE POLICY "Everyone can view active products" ON products
    FOR SELECT USING (active = true);

-- Admins can manage all products
CREATE POLICY "Admins can manage all products" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ORDERS TABLE POLICIES
-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (user_id = auth.uid());

-- Users can create their own orders
CREATE POLICY "Users can create own orders" ON orders
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own orders (limited scenarios)
CREATE POLICY "Users can update own orders" ON orders
    FOR UPDATE USING (
        user_id = auth.uid() AND 
        status IN ('pending', 'processing')
    );

-- Admins can manage all orders
CREATE POLICY "Admins can manage all orders" ON orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ORDER_ITEMS TABLE POLICIES
-- Users can view items for their own orders
CREATE POLICY "Users can view own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
        )
    );

-- Users can create items for their own orders
CREATE POLICY "Users can create own order items" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
        )
    );

-- Admins can manage all order items
CREATE POLICY "Admins can manage all order items" ON order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- REVIEWS TABLE POLICIES
-- Users can view reviews for bookings they're involved in
CREATE POLICY "Users can view relevant reviews" ON reviews
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM bookings b
            JOIN workers w ON w.id = b.worker_id
            WHERE b.id = reviews.booking_id AND w.profile_id = auth.uid()
        )
    );

-- Users can create reviews for their own bookings
CREATE POLICY "Users can create own reviews" ON reviews
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" ON reviews
    FOR UPDATE USING (user_id = auth.uid());

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews" ON reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- PROMO_CODES TABLE POLICIES
-- Everyone can view active promo codes
CREATE POLICY "Everyone can view active promo codes" ON promo_codes
    FOR SELECT USING (active = true AND valid_until >= CURRENT_DATE);

-- Admins can manage all promo codes
CREATE POLICY "Admins can manage all promo codes" ON promo_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- SERVICE_CONFIGS TABLE POLICIES
-- Everyone can view active service configs
CREATE POLICY "Everyone can view active service configs" ON service_configs
    FOR SELECT USING (active = true);

-- Admins can manage all service configs
CREATE POLICY "Admins can manage all service configs" ON service_configs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- SERVICE_ADD_ONS TABLE POLICIES
-- Everyone can view active service add-ons
CREATE POLICY "Everyone can view active service add-ons" ON service_add_ons
    FOR SELECT USING (active = true);

-- Admins can manage all service add-ons
CREATE POLICY "Admins can manage all service add-ons" ON service_add_ons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- WORKER_LOCATIONS TABLE POLICIES
-- Workers can manage their own location data
CREATE POLICY "Workers can manage own location" ON worker_locations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workers w
            WHERE w.id = worker_locations.worker_id AND w.profile_id = auth.uid()
        )
    );

-- Customers can view location of workers assigned to their bookings
CREATE POLICY "Customers can view assigned worker locations" ON worker_locations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.worker_id = worker_locations.worker_id AND b.user_id = auth.uid()
        )
    );

-- Admins can manage all worker locations
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
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
