-- check what is actually in the table now
SELECT id, user_id, title, is_public, created_at FROM date_plans;

-- check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'date_plans';
