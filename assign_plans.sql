-- Assign all existing date plans to your current user ID
UPDATE date_plans
SET user_id = 'nAxVkP5UWEZtz6S0M7hPOWtduVB3';

-- Verify the update
SELECT id, user_id, title FROM date_plans;
