-- Relax constraints on user_places to avoid "value too long" errors
ALTER TABLE user_places 
    ALTER COLUMN best_time TYPE TEXT,
    ALTER COLUMN entry_fee TYPE TEXT,
    ALTER COLUMN timings TYPE TEXT,
    ALTER COLUMN type TYPE TEXT,
    ALTER COLUMN name TYPE TEXT,
    ALTER COLUMN description TYPE TEXT;

-- Just in case they are missing or have other issues, ensure other content tables are flexible
-- Checking 'classifieds' (often has strict limits too)
ALTER TABLE classifieds
    ALTER COLUMN title TYPE TEXT,
    ALTER COLUMN description TYPE TEXT,
    ALTER COLUMN category TYPE TEXT,
    ALTER COLUMN price TYPE TEXT; -- In case price is stored as formatted text

-- Checking 'local_events' (renamed from events)
ALTER TABLE local_events
    ALTER COLUMN title TYPE TEXT,
    ALTER COLUMN description TYPE TEXT,
    ALTER COLUMN location TYPE TEXT;

-- Checking 'store_comments' - FIXED: column is 'content', not 'comment'
ALTER TABLE store_comments
    ALTER COLUMN content TYPE TEXT;

-- Checking 'event_messages'
ALTER TABLE event_messages
    ALTER COLUMN content TYPE TEXT;

-- Checking 'profiles'
ALTER TABLE profiles
    ALTER COLUMN nickname TYPE TEXT,
    ALTER COLUMN bio TYPE TEXT,
    ALTER COLUMN flair TYPE TEXT,
    ALTER COLUMN full_name TYPE TEXT;
