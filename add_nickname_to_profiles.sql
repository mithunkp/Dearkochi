-- Add nickname column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Policy to allow users to update their own nickname
CREATE POLICY "Users can update their own nickname" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
