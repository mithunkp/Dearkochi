-- Add google_maps_url column
ALTER TABLE user_places ADD COLUMN IF NOT EXISTS google_maps_url text;

-- Disable RLS on user_places to allow 'anon' (admin panel without supabase auth) to DELETE and UPDATE
-- Warning: This makes the table public writable for anyone who knows the API URL and Key. 
-- In a production app, we would use proper Admin Auth with RLS.
-- For this prototype/request where we removed Supabase Auth for Admin:
ALTER TABLE user_places DISABLE ROW LEVEL SECURITY;
