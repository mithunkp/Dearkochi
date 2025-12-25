-- 1. Add user_id column to user_places
ALTER TABLE user_places 
ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE;

-- 2. Enable RLS
ALTER TABLE user_places ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow authenticated users to INSERT their own places
DROP POLICY IF EXISTS "Users can add their own places" ON user_places;
CREATE POLICY "Users can add their own places" ON user_places
FOR INSERT
WITH CHECK (
  auth.uid()::text = user_id
);

-- 4. Policy: Allow everyone to VIEW approved places (assuming 'is_approved' column exists, or just all)
-- Adjust based on approval logic. For now, let's allow viewing all.
DROP POLICY IF EXISTS "Public can view places" ON user_places;
CREATE POLICY "Public can view places" ON user_places
FOR SELECT
USING (true);

-- 5. Policy: Users can DELETE their own places
DROP POLICY IF EXISTS "Users can delete their own places" ON user_places;
CREATE POLICY "Users can delete their own places" ON user_places
FOR DELETE
USING (
  auth.uid()::text = user_id
);
