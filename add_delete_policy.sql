-- Allow creators to delete their own events
CREATE POLICY "Creators can delete their events" ON local_events
  FOR DELETE USING (auth.uid() = creator_id);
