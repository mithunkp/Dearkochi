-- Check column type
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'date_plans' AND column_name = 'user_id';

-- Check Policies
SELECT policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'date_plans';

-- Check Record Count (to see if any exist at all)
SELECT count(*) FROM date_plans;
