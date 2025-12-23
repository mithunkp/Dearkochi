-- Create a table for site-wide settings
CREATE TABLE IF NOT EXISTS site_settings (
    id SERIAL PRIMARY KEY,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    maintenance_title TEXT DEFAULT 'Site Under Maintenance',
    maintenance_message TEXT DEFAULT 'We are currently performing scheduled maintenance. We will be back shortly.',
    maintenance_image_url TEXT,
    bg_color TEXT DEFAULT '#ffffff',
    text_color TEXT DEFAULT '#000000',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Ensure only one row exists (Singleton pattern)
CREATE UNIQUE INDEX IF NOT EXISTS one_row_only_uidx ON site_settings((TRUE));

-- Insert default row if not exists
INSERT INTO site_settings (id, maintenance_mode)
VALUES (1, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (everyone needs to know if site is down)
CREATE POLICY "Public read access" ON site_settings
    FOR SELECT USING (true);

-- Allow admin update access (adjust 'admin' check as per your actual admin role logic)
-- Assuming you have an 'is_admin' function or similar, or checking specific user IDs
-- For now, allowing authenticated users to update for demonstration, BUT YOU SHOULD LOCK THIS DOWN
-- TODO: Replace with actual admin check, e.g., (auth.jwt() ->> 'role' = 'service_role') OR (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
CREATE POLICY "Admin update access" ON site_settings
    FOR UPDATE USING (auth.role() = 'authenticated'); -- REPLACE WITH STRICTER CHECK
