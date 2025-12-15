-- Add requires_approval to local_events
ALTER TABLE local_events 
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT FALSE;

-- Update event_participants status check to include 'pending' and 'rejected'
ALTER TABLE event_participants 
DROP CONSTRAINT IF EXISTS event_participants_status_check;

ALTER TABLE event_participants 
ADD CONSTRAINT event_participants_status_check 
CHECK (status IN ('joined', 'removed', 'pending', 'rejected'));

-- Add request_message to event_participants
ALTER TABLE event_participants 
ADD COLUMN IF NOT EXISTS request_message TEXT;

-- Update RLS policy for viewing messages
-- Drop existing policy first
DROP POLICY IF EXISTS "View messages based on privacy" ON event_messages;

CREATE POLICY "View messages based on privacy" ON event_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM local_events
      WHERE id = event_messages.event_id
      AND (
        -- Public and no approval required: everyone can see
        (is_private = FALSE AND requires_approval = FALSE)
        OR
        -- Creator can always see
        creator_id = auth.uid()
        OR
        -- Active participants can see
        EXISTS (
          SELECT 1 FROM event_participants
          WHERE event_id = local_events.id
          AND user_id = auth.uid()
          AND status = 'joined'
        )
      )
    )
  );
