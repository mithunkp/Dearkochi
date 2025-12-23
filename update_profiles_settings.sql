-- Update profiles table with settings fields
-- This adds flair, bio, and preferences fields to the profiles table

-- Add flair column (emoji or short text badge)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS flair TEXT;

-- Add bio column (short description)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add preferences column (JSON storage for additional settings)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Verify nickname column exists (should already exist from previous migration)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='nickname') THEN
        ALTER TABLE profiles ADD COLUMN nickname TEXT;
    END IF;
END $$;

-- Update RLS policies to allow users to update these fields
-- The existing "Users can update their own profile" policy should cover this
-- But let's add a specific one for nickname if it doesn't exist

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can update their own nickname'
    ) THEN
        CREATE POLICY "Users can update their own nickname" ON profiles
            FOR UPDATE USING (auth.uid() = id)
            WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN profiles.nickname IS 'Public display name visible to all users';
COMMENT ON COLUMN profiles.flair IS 'Custom emoji or text badge for user profile';
COMMENT ON COLUMN profiles.bio IS 'Short user biography or description';
COMMENT ON COLUMN profiles.preferences IS 'JSON field for storing user preferences and settings';
