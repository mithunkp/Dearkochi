-- Clean up orphaned data before restoring foreign keys

-- 1. Clean event_participants
DELETE FROM event_participants
WHERE event_id NOT IN (SELECT id FROM local_events);

-- 2. Clean event_messages
DELETE FROM event_messages
WHERE event_id NOT IN (SELECT id FROM local_events);

-- 3. Clean event_join_requests (Table does not exist, requests are likely handled via participants status)
-- DELETE FROM event_join_requests WHERE event_id NOT IN (SELECT id FROM local_events);

-- 4. Clean store_comments (just in case)
DELETE FROM store_comments
WHERE store_id NOT IN (SELECT id FROM stores);

-- 5. Clean classified_answers (Table does not exist)
-- DELETE FROM classified_answers WHERE classified_id NOT IN (SELECT id FROM classifieds);

-- 6. Clean store_reviews if it exists (handling potentially missing table gracefully is hard in raw SQL per statement, 
-- but we can assume standard schema. If it fails, user can ignore if they don't use it, but let's stick to known tables).

-- Now that data is clean, you can re-run restore_relationships.sql
