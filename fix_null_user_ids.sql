-- Assign all "orphan" plans (where user_id is NULL) to your current user
UPDATE date_plans
SET user_id = 'nAxVkP5UWEZtz6S0M7hPOWtduVB3'
WHERE user_id IS NULL;

-- Verify the update
SELECT id, user_id, title FROM date_plans;
