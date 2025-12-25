-- 1. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable generic access" ON date_plans;
DROP POLICY IF EXISTS "Public date plans are viewable by everyone" ON date_plans;
DROP POLICY IF EXISTS "Users can insert their own date plans" ON date_plans;
DROP POLICY IF EXISTS "Users can update their own date plans" ON date_plans;
DROP POLICY IF EXISTS "Users can delete their own date plans" ON date_plans;

-- 2. Drop the foreign key constraint if it exists (it forces UUID)
ALTER TABLE date_plans DROP CONSTRAINT IF EXISTS date_plans_user_id_fkey;

-- 3. Change user_id to TEXT to support Firebase UIDs
ALTER TABLE date_plans ALTER COLUMN user_id TYPE text;

-- 4. Enable RLS (if not already enabled)
ALTER TABLE date_plans ENABLE ROW LEVEL SECURITY;

-- 5. Create a generic access policy (since we handle auth in the compiled app)
-- This matches the pattern in firebase_migration.sql for other tables
CREATE POLICY "Enable generic access" ON date_plans FOR ALL USING (true);

-- 6. Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'date_plans' AND column_name = 'user_id';
