-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_locations ENABLE ROW LEVEL SECURITY;

-- PROFILES TABLE POLICIES
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Workers can view customer profiles for their assigned bookings
CREATE POLICY "Workers can view assigned customer profiles" ON profiles
    FOR SELECT USING (
        role = 'customer' AND EXISTS (
            SELECT 1 FROM bookings b
            JOIN workers w ON w.id = b.worker_id
            WHERE w.profile_id = auth.uid() AND b.user_id = profiles.id
        )
    );

-- WORKERS TABLE POLICIES
-- Workers can view and update their own worker record
CREATE POLICY "Workers can manage own record" ON workers
    FOR ALL USING (profile_id = auth.uid());

-- Admins can view and manage all worker records
CREATE POLICY "Admins can manage all workers" ON workers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Customers can view worker info for their bookings (limited fields)
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

-- Users can update their own pending bookings
CREATE POLICY "Users can update own pending bookings" ON bookings
    FOR UPDATE USING (
        user_id = auth.uid() AND status = 'pending'
    );

-- Workers can view their assigned bookings
CREATE POLICY "Workers can view assigned bookings" ON bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workers w
            WHERE w.id = bookings.worker_id AND w.profile_id = auth.uid()
        )
    );

-- Workers can update status of their assigned bookings
CREATE POLICY "Workers can update assigned booking status" ON bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workers w
            WHERE w.id = bookings.worker_id AND w.profile_id = auth.uid()
        )
    );

-- Admins can view and manage all bookings
CREATE POLICY "Admins can manage all bookings" ON bookings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
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

-- Admins can manage all assignments
CREATE POLICY "Admins can manage all assignments" ON assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Customers can view assignments for their bookings
CREATE POLICY "Customers can view own booking assignments" ON assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = assignments.booking_id AND b.user_id = auth.uid()
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

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions" ON subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
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
            SELECT 1 FROM profiles 
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

-- Admins can view all orders
CREATE POLICY "Admins can view all orders" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ORDER_ITEMS TABLE POLICIES
-- Users can view order items for their own orders
CREATE POLICY "Users can view own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
        )
    );

-- Users can create order items for their own orders
CREATE POLICY "Users can create own order items" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
        )
    );

-- Admins can view all order items
CREATE POLICY "Admins can view all order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- REVIEWS TABLE POLICIES
-- Users can view reviews for services they've booked
CREATE POLICY "Users can view reviews for own bookings" ON reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = reviews.booking_id AND b.user_id = auth.uid()
        )
    );

-- Users can create reviews for their completed bookings
CREATE POLICY "Users can create reviews for own bookings" ON reviews
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = reviews.booking_id 
            AND b.user_id = auth.uid() 
            AND b.status = 'completed'
        )
    );

-- Workers can view reviews for their work
CREATE POLICY "Workers can view own reviews" ON reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workers w
            WHERE w.id = reviews.worker_id AND w.profile_id = auth.uid()
        )
    );

-- Everyone can view reviews (for public display)
CREATE POLICY "Public can view reviews" ON reviews
    FOR SELECT USING (true);

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews" ON reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- PROMO_CODES TABLE POLICIES
-- Admins can manage all promo codes
CREATE POLICY "Admins can manage all promo codes" ON promo_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Authenticated users can view active promo codes
CREATE POLICY "Users can view active promo codes" ON promo_codes
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND 
        active = true AND 
        valid_until >= CURRENT_DATE AND
        times_used < usage_limit
    );

-- SERVICE_CONFIGS TABLE POLICIES
-- Everyone can view active service configs
CREATE POLICY "Everyone can view active service configs" ON service_configs
    FOR SELECT USING (active = true);

-- Admins can manage all service configs
CREATE POLICY "Admins can manage all service configs" ON service_configs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
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
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- WORKER_LOCATIONS TABLE POLICIES
-- Workers can insert/update their own location
CREATE POLICY "Workers can manage own location" ON worker_locations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workers w
            WHERE w.id = worker_locations.worker_id AND w.profile_id = auth.uid()
        )
    );

-- Admins can view all worker locations
CREATE POLICY "Admins can view all worker locations" ON worker_locations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Customers can view location of workers assigned to their bookings
CREATE POLICY "Customers can view assigned worker location" ON worker_locations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.worker_id = worker_locations.worker_id 
            AND b.user_id = auth.uid()
            AND b.status IN ('assigned', 'en_route', 'in_progress')
        )
    );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')::user_role
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update worker assignment count
CREATE OR REPLACE FUNCTION update_worker_assignment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE workers 
        SET assigned_bookings_count = assigned_bookings_count + 1
        WHERE id = NEW.worker_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE workers 
        SET assigned_bookings_count = assigned_bookings_count - 1
        WHERE id = OLD.worker_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' AND OLD.worker_id != NEW.worker_id THEN
        UPDATE workers 
        SET assigned_bookings_count = assigned_bookings_count - 1
        WHERE id = OLD.worker_id;
        
        UPDATE workers 
        SET assigned_bookings_count = assigned_bookings_count + 1
        WHERE id = NEW.worker_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update worker assignment count
CREATE TRIGGER update_worker_assignment_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON bookings
    FOR EACH ROW 
    WHEN (TG_OP != 'UPDATE' OR OLD.worker_id IS DISTINCT FROM NEW.worker_id)
    EXECUTE FUNCTION update_worker_assignment_count();