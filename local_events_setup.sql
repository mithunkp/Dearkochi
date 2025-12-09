-- Create local_events table
CREATE TABLE IF NOT EXISTS local_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  creator_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('scheduled', 'live')),
  location TEXT,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  max_participants INTEGER,
  is_private BOOLEAN DEFAULT FALSE,
  is_closed BOOLEAN DEFAULT FALSE,
  area TEXT -- For filtering by area if needed
);

-- Create event_participants table
CREATE TABLE IF NOT EXISTS event_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  event_id UUID REFERENCES local_events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT DEFAULT 'joined' CHECK (status IN ('joined', 'removed')),
  UNIQUE(event_id, user_id)
);

-- Create event_messages table
CREATE TABLE IF NOT EXISTS event_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  event_id UUID REFERENCES local_events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE local_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_messages ENABLE ROW LEVEL SECURITY;

-- Policies for local_events

-- Everyone can view public events that are not expired (logic for expiration handled in query usually, but RLS can enforce basic visibility)
-- For simplicity, we allow reading all events, frontend filters by privacy/expiration. 
-- BUT for privacy: if is_private = true, only participants or creator can see details? 
-- The requirement says "private that will allow only joined people can see the chats". It doesn't explicitly say the event card itself is hidden. 
-- Usually private events might be hidden from the main feed or require a code. 
-- Let's assume for now: Public feed shows all non-private events. Private events might need a direct link or invite (not specified).
-- OR: Private events are visible in feed but you can't see chats until you join? 
-- "close events 9to prevents any one other from getting in also he can make it private that will allow only joined people can see the chats"
-- This implies the EVENT itself might be visible, but CHATS are protected.

-- Policy: Everyone can read events (to see them in the list)
CREATE POLICY "Events are viewable by everyone" ON local_events
  FOR SELECT USING (true);

-- Policy: Only authenticated users can create events
CREATE POLICY "Authenticated users can create events" ON local_events
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Policy: Creator can update their events (e.g. close them)
CREATE POLICY "Creators can update their events" ON local_events
  FOR UPDATE USING (auth.uid() = creator_id);

-- Policies for event_participants

-- Policy: Everyone can view participants (to see who is attending)
CREATE POLICY "Participants are viewable by everyone" ON event_participants
  FOR SELECT USING (true);

-- Policy: Authenticated users can join (insert)
-- Check if event is closed or full is done in application logic or trigger, but RLS can also restrict.
-- For now, allow insert if auth.uid() matches user_id.
CREATE POLICY "Users can join events" ON event_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Creator can update participant status (to remove them)
-- Also user can probably leave (update status to left? or delete row?)
-- Let's allow creator to update any participant in their event.
CREATE POLICY "Creators can moderate participants" ON event_participants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM local_events
      WHERE id = event_participants.event_id
      AND creator_id = auth.uid()
    )
  );

-- Policies for event_messages

-- Policy: Visibility depends on privacy.
-- If event is public: Everyone can see? Or only joined? "group chat evry on can see the chats" -> implies public access?
-- "make it private that will allow only joined people can see the chats"
-- So:
-- If event.is_private = FALSE -> Everyone can see messages? Or only participants? 
-- "this chat section should be group chat evry on can see the chats" -> Sounds like public read access for public events.
-- If event.is_private = TRUE -> Only participants (status='joined') + Creator can see.

CREATE POLICY "View messages based on privacy" ON event_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM local_events
      WHERE id = event_messages.event_id
      AND (
        -- Public event: everyone can see
        is_private = FALSE
        OR
        -- Private event: Creator can see
        creator_id = auth.uid()
        OR
        -- Private event: Active participants can see
        EXISTS (
          SELECT 1 FROM event_participants
          WHERE event_id = local_events.id
          AND user_id = auth.uid()
          AND status = 'joined'
        )
      )
    )
  );

-- Policy: Only joined participants (and creator?) can send messages
-- And they must not be removed.
CREATE POLICY "Participants can send messages" ON event_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_participants
      WHERE event_id = event_messages.event_id
      AND user_id = auth.uid()
      AND status = 'joined'
    )
    OR
    EXISTS (
      SELECT 1 FROM local_events
      WHERE id = event_messages.event_id
      AND creator_id = auth.uid()
    )
  );

-- Realtime
alter publication supabase_realtime add table local_events;
alter publication supabase_realtime add table event_participants;
alter publication supabase_realtime add table event_messages;
