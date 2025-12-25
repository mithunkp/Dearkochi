-- 1. Get all date plans
SELECT id, user_id, title, is_public FROM date_plans;

-- 2. Get all profiles (users) to compare IDs
SELECT id, email, display_name FROM profiles;

-- 3. Check for mismatches (plans where user_id is NOT in profiles)
SELECT dp.id, dp.title, dp.user_id 
FROM date_plans dp
LEFT JOIN profiles p ON dp.user_id = p.id
WHERE p.id IS NULL;
