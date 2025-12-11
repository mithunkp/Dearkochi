-- Fix relationship between event_messages and profiles
-- We need an explicit foreign key to profiles to allow embedding in queries
-- This follows the same pattern as fix_relationships.sql for store_comments

-- Fix event_messages table
-- Drop the existing constraint if it exists (referencing auth.users)
ALTER TABLE event_messages DROP CONSTRAINT IF EXISTS event_messages_user_id_fkey;

-- Add new constraint referencing profiles
-- Since profiles.id is the same as auth.users.id, this maintains data integrity
ALTER TABLE event_messages
  ADD CONSTRAINT event_messages_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Also fix event_participants table for consistency
ALTER TABLE event_participants DROP CONSTRAINT IF EXISTS event_participants_user_id_fkey;

ALTER TABLE event_participants
  ADD CONSTRAINT event_participants_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Note: local_events.creator_id can remain as auth.users(id) since we don't embed creator profile in queries
-- If needed in future, it can be updated with a similar pattern
