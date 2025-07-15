-- Add pricing multiplier fields to service_configs table
ALTER TABLE service_configs ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE service_configs ADD COLUMN IF NOT EXISTS price_per_mile DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE service_configs ADD COLUMN IF NOT EXISTS rush_multiplier DECIMAL(4, 2) DEFAULT 1;
ALTER TABLE service_configs ADD COLUMN IF NOT EXISTS weekend_multiplier DECIMAL(4, 2) DEFAULT 1;
ALTER TABLE service_configs ADD COLUMN IF NOT EXISTS holiday_multiplier DECIMAL(4, 2) DEFAULT 1;
ALTER TABLE service_configs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Rename duration_hours to duration for consistency
ALTER TABLE service_configs RENAME COLUMN duration_hours TO duration;

-- Make service_add_ons independent of service_configs
ALTER TABLE service_add_ons DROP CONSTRAINT IF EXISTS service_add_ons_service_config_id_fkey;
ALTER TABLE service_add_ons DROP COLUMN IF EXISTS service_config_id;
ALTER TABLE service_add_ons ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing data with pricing multipliers
UPDATE service_configs SET 
    name = CASE 
        WHEN service_type = 'regular' THEN 'Regular Cleaning'
        WHEN service_type = 'deep' THEN 'Deep Cleaning'
        WHEN service_type = 'move_in_out' THEN 'Move In/Out Cleaning'
        WHEN service_type = 'airbnb' THEN 'Airbnb Cleaning'
        WHEN service_type = 'office' THEN 'Office Cleaning'
        WHEN service_type = 'commercial' THEN 'Commercial Cleaning'
        ELSE service_type::text
    END,
    price_per_mile = CASE 
        WHEN service_type = 'regular' THEN 2.50
        WHEN service_type = 'deep' THEN 3.00
        WHEN service_type = 'move_in_out' THEN 3.50
        WHEN service_type = 'airbnb' THEN 2.00
        WHEN service_type = 'office' THEN 2.75
        WHEN service_type = 'commercial' THEN 3.25
        ELSE 2.50
    END,
    rush_multiplier = CASE 
        WHEN service_type = 'regular' THEN 1.15
        WHEN service_type = 'deep' THEN 1.20
        WHEN service_type = 'move_in_out' THEN 1.25
        WHEN service_type = 'airbnb' THEN 1.10
        WHEN service_type = 'office' THEN 1.15
        WHEN service_type = 'commercial' THEN 1.20
        ELSE 1.15
    END,
    weekend_multiplier = CASE 
        WHEN service_type = 'regular' THEN 1.10
        WHEN service_type = 'deep' THEN 1.15
        WHEN service_type = 'move_in_out' THEN 1.20
        WHEN service_type = 'airbnb' THEN 1.05
        WHEN service_type = 'office' THEN 1.25
        WHEN service_type = 'commercial' THEN 1.30
        ELSE 1.10
    END,
    holiday_multiplier = CASE 
        WHEN service_type = 'regular' THEN 1.25
        WHEN service_type = 'deep' THEN 1.30
        WHEN service_type = 'move_in_out' THEN 1.35
        WHEN service_type = 'airbnb' THEN 1.20
        WHEN service_type = 'office' THEN 1.40
        WHEN service_type = 'commercial' THEN 1.45
        ELSE 1.25
    END,
    is_active = COALESCE(active, true)
WHERE name IS NULL;

-- Update service_add_ons with is_active
UPDATE service_add_ons SET is_active = COALESCE(active, true) WHERE is_active IS NULL;

-- Add some default add-ons if they don't exist
INSERT INTO service_add_ons (name, price, description, is_active) VALUES
    ('Inside Oven Cleaning', 25.00, 'Deep clean inside of oven', true),
    ('Inside Refrigerator Cleaning', 20.00, 'Clean inside of refrigerator', true),
    ('Window Cleaning (Interior)', 15.00, 'Clean interior windows', true),
    ('Garage Cleaning', 40.00, 'Clean garage area', true),
    ('Basement Cleaning', 35.00, 'Clean basement area', true),
    ('Attic Cleaning', 30.00, 'Clean attic area', true),
    ('Carpet Cleaning', 50.00, 'Professional carpet cleaning', true),
    ('Upholstery Cleaning', 45.00, 'Clean furniture upholstery', true),
    ('Laundry Service', 25.00, 'Wash and fold laundry', true),
    ('Dish Washing', 15.00, 'Wash and put away dishes', true)
ON CONFLICT (name) DO NOTHING;