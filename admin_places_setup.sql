-- Add is_known column to user_places
ALTER TABLE user_places ADD COLUMN IF NOT EXISTS is_known boolean DEFAULT false;
ALTER TABLE user_places ADD COLUMN IF NOT EXISTS image_url text;

-- Insert existing known places (static data migration)
-- We use ON CONFLICT DO NOTHING to avoid duplicates if run multiple times, 
-- but ID generation might be an issue. safely we just insert if table is empty-ish or manually.
-- For now, let's just ensure the column exists.

-- Update strict policy to allow admin to manage all rows?
-- Currently:
-- create policy "Public places are viewable by everyone" on user_places for select using (true);
-- create policy "Users can insert their own places" on user_places for insert with check (auth.uid() = user_id);
-- We need a policy for Admin. 
-- For now, we can create a function `is_admin()` or just check a specific email.
-- Let's enable all access for the admin email (hardcoded UUID or email check).
-- Or rely on a service role key if we were backend, but we are frontend.
-- We will Add a simple policy or just rely on the fact that we can edit it if we are the user.
-- Wait, the user wants a "special login". 
-- If we use a separate login page, we can sign in as a specific "admin" user in Supabase Auth.
-- Let's assume there is an admin user. We will stick to the "special login" request.

-- Let's Just add the column first.
