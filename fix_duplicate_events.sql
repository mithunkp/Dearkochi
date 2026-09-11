-- Defence in depth for the duplicate-event bug.
--
-- On 28 March 2026 the same "Morning Run" was inserted five times inside
-- 243 milliseconds, each with its own participant row. The cause was in the
-- client: the create form only set `loading` after awaiting a profile lookup,
-- so every click landing before that resolved got its own insert. That is
-- fixed in CreateEventModal.tsx with a synchronous ref guard.
--
-- This constraint is the second line of defence, for the cases the client
-- cannot cover: a retried request, a flaky connection, a future caller.
--
-- Run this in the Supabase SQL editor.

-- 1. Clear any existing duplicates first, keeping the earliest of each set.
--    Review what this would delete before running it:
--
--    SELECT creator_id, title, start_time, count(*)
--    FROM local_events
--    GROUP BY creator_id, title, start_time
--    HAVING count(*) > 1;

DELETE FROM local_events a
USING local_events b
WHERE a.creator_id = b.creator_id
  AND a.title = b.title
  AND a.start_time = b.start_time
  AND a.created_at > b.created_at;

-- 2. Refuse the duplicate at the database, whatever the client does.
ALTER TABLE local_events
    DROP CONSTRAINT IF EXISTS local_events_no_duplicates;

ALTER TABLE local_events
    ADD CONSTRAINT local_events_no_duplicates
    UNIQUE (creator_id, title, start_time);

-- 3. The events list filters on end_time and orders by start_time on every
--    load, and the detail view looks participants up by event. Neither column
--    is indexed today.
CREATE INDEX IF NOT EXISTS local_events_end_time_idx
    ON local_events (end_time);

CREATE INDEX IF NOT EXISTS event_participants_event_id_idx
    ON event_participants (event_id, status);
