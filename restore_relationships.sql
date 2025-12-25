-- RESTORE RELATIONSHIPS
-- Re-establish foreign keys to profiles(id) now that both sides are TEXT.

-- 1. Ensure profiles.id is the Primary Key (it likely still is, but good to be safe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_pkey') THEN
        ALTER TABLE profiles ADD PRIMARY KEY (id);
    END IF;
END $$;

-- 2. Clean invalid references (Optional but recommended before adding FKs)
-- This deletes rows pointing to non-existent users to prevent FK creation failure.
-- Uncomment if you want to auto-clean data.
-- DELETE FROM local_events WHERE creator_id NOT IN (SELECT id FROM profiles);
-- DELETE FROM event_participants WHERE user_id NOT IN (SELECT id FROM profiles);
-- ... etc

-- 3. Re-create Foreign Keys
-- core relationships
ALTER TABLE local_events DROP CONSTRAINT IF EXISTS local_events_creator_id_fkey;
ALTER TABLE local_events 
    ADD CONSTRAINT local_events_creator_id_fkey 
    FOREIGN KEY (creator_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE event_participants DROP CONSTRAINT IF EXISTS event_participants_user_id_fkey;
ALTER TABLE event_participants 
    ADD CONSTRAINT event_participants_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE event_messages DROP CONSTRAINT IF EXISTS event_messages_user_id_fkey;
ALTER TABLE event_messages 
    ADD CONSTRAINT event_messages_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- marketplace / stores
ALTER TABLE stores DROP CONSTRAINT IF EXISTS stores_user_id_fkey;
ALTER TABLE stores 
    ADD CONSTRAINT stores_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE stores DROP CONSTRAINT IF EXISTS stores_category_id_fkey;
ALTER TABLE stores 
    ADD CONSTRAINT stores_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

ALTER TABLE store_comments DROP CONSTRAINT IF EXISTS store_comments_user_id_fkey;
ALTER TABLE store_comments 
    ADD CONSTRAINT store_comments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE store_ratings DROP CONSTRAINT IF EXISTS store_ratings_user_id_fkey;
ALTER TABLE store_ratings 
    ADD CONSTRAINT store_ratings_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE classified_ads DROP CONSTRAINT IF EXISTS classified_ads_user_id_fkey;
ALTER TABLE classified_ads 
    ADD CONSTRAINT classified_ads_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE classified_ads DROP CONSTRAINT IF EXISTS classified_ads_category_id_fkey;
ALTER TABLE classified_ads 
    ADD CONSTRAINT classified_ads_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES classified_categories(id) ON DELETE SET NULL;

-- social
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_buyer_id_fkey;
ALTER TABLE chats 
    ADD CONSTRAINT chats_buyer_id_fkey 
    FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_seller_id_fkey;
ALTER TABLE chats 
    ADD CONSTRAINT chats_seller_id_fkey 
    FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_ad_id_fkey;
ALTER TABLE chats 
    ADD CONSTRAINT chats_ad_id_fkey 
    FOREIGN KEY (ad_id) REFERENCES classified_ads(id) ON DELETE SET NULL;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages 
    ADD CONSTRAINT messages_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- structural relationships (Table -> Table)
ALTER TABLE event_participants DROP CONSTRAINT IF EXISTS event_participants_event_id_fkey;
ALTER TABLE event_participants 
    ADD CONSTRAINT event_participants_event_id_fkey 
    FOREIGN KEY (event_id) REFERENCES local_events(id) ON DELETE CASCADE;

ALTER TABLE event_messages DROP CONSTRAINT IF EXISTS event_messages_event_id_fkey;
ALTER TABLE event_messages 
    ADD CONSTRAINT event_messages_event_id_fkey 
    FOREIGN KEY (event_id) REFERENCES local_events(id) ON DELETE CASCADE;

ALTER TABLE store_comments DROP CONSTRAINT IF EXISTS store_comments_store_id_fkey;
ALTER TABLE store_comments 
    ADD CONSTRAINT store_comments_store_id_fkey 
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

ALTER TABLE store_ratings DROP CONSTRAINT IF EXISTS store_ratings_store_id_fkey;
ALTER TABLE store_ratings 
    ADD CONSTRAINT store_ratings_store_id_fkey 
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_chat_id_fkey;
ALTER TABLE messages 
    ADD CONSTRAINT messages_chat_id_fkey 
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;

-- planner
ALTER TABLE date_plans DROP CONSTRAINT IF EXISTS date_plans_user_id_fkey;
ALTER TABLE date_plans 
    ADD CONSTRAINT date_plans_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- NOT restoring user_places as it has no user_id column
