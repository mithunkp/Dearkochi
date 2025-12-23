-- Add missing columns to user_places table for better details & analytics

ALTER TABLE user_places
ADD COLUMN IF NOT EXISTS highlights TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS timings TEXT,
ADD COLUMN IF NOT EXISTS ticket_price TEXT,
ADD COLUMN IF NOT EXISTS best_time_to_visit TEXT,
ADD COLUMN IF NOT EXISTS visited_count INTEGER DEFAULT 0;

-- Function to increment visited count
CREATE OR REPLACE FUNCTION increment_place_visit(place_id INT)
RETURNS VOID AS $$
BEGIN
  UPDATE user_places
  SET visited_count = visited_count + 1
  WHERE id = place_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
