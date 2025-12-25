-- 1. Ensure 'role' column exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. Add permissions and customization columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_special_flair_allowed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS flair_color TEXT DEFAULT '#000000';

-- 3. REMOVE Security Layers as requested
DROP TRIGGER IF EXISTS protect_special_flair_permission_trigger ON profiles;
DROP FUNCTION IF EXISTS protect_special_flair_permission();

-- 4. Re-create Admin Policy (Drop first to avoid errors)
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

CREATE POLICY "Admins can update any profile" ON profiles
FOR UPDATE
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()::text) = 'admin'
);
