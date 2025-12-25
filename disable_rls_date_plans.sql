-- Disable RLS completely for date_plans
-- This means NO policies are checked, and everyone can read/write everything.
-- This is just for debugging to prove the data is there.
ALTER TABLE date_plans DISABLE ROW LEVEL SECURITY;

-- Verify it's off
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'date_plans';
