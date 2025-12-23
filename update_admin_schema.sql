-- Create a table to track daily site visits
CREATE TABLE IF NOT EXISTS daily_site_stats (
    date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
    visit_count INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on daily_site_stats
ALTER TABLE daily_site_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view stats (Assuming a way to check admin, or just open for now and handle in app logic if role is not set up)
-- For now, we will allow public read for dev simplicity or create a policy that returns true if no specific auth logic is complex
CREATE POLICY "Enable read access for all users" ON daily_site_stats FOR SELECT USING (true);


-- Function to increment daily visits securely
CREATE OR REPLACE FUNCTION increment_daily_visit()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO daily_site_stats (date, visit_count)
    VALUES (CURRENT_DATE, 1)
    ON CONFLICT (date)
    DO UPDATE SET visit_count = daily_site_stats.visit_count + 1;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_daily_visit() TO anon, authenticated, service_role;

-- Ensure profiles table has policies for admin to read all
-- (This might duplicate existing policies but ensures admin panel works)
CREATE POLICY "Enable read access for all users" ON profiles FOR SELECT USING (true);
