-- Create job_photos table for storing before/after photos
CREATE TABLE job_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE NOT NULL,
    photo_url TEXT NOT NULL,
    photo_type TEXT CHECK (photo_type IN ('before', 'after', 'progress')) NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_job_photos_booking_id ON job_photos(booking_id);
CREATE INDEX idx_job_photos_worker_id ON job_photos(worker_id);
CREATE INDEX idx_job_photos_type ON job_photos(photo_type);

-- Create storage bucket for job photos
INSERT INTO storage.buckets (id, name, public) VALUES ('job-photos', 'job-photos', true);

-- Create RLS policies for job_photos table
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;

-- Workers can insert/update/delete their own photos
CREATE POLICY "Workers can manage their own job photos" ON job_photos
    FOR ALL USING (
        worker_id IN (
            SELECT id FROM workers WHERE profile_id = auth.uid()
        )
    );

-- Customers can view photos for their bookings
CREATE POLICY "Customers can view photos for their bookings" ON job_photos
    FOR SELECT USING (
        booking_id IN (
            SELECT id FROM bookings WHERE user_id = auth.uid()
        )
    );

-- Admins can view all photos
CREATE POLICY "Admins can view all job photos" ON job_photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Storage policies for job-photos bucket
CREATE POLICY "Workers can upload job photos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'job-photos' AND
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM workers WHERE profile_id = auth.uid()
        )
    );

CREATE POLICY "Workers can view job photos" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'job-photos' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Workers can delete their own job photos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'job-photos' AND
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM workers WHERE profile_id = auth.uid()
        )
    );