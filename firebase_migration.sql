-- BRUTE FORCE MIGRATION
-- Explicitly dropping the known problem constraint first.

-- 1. Explicitly drop the persistent constraint causing the error
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Drop other common FKs explicitly (just in case)
ALTER TABLE user_places DROP CONSTRAINT IF EXISTS user_places_user_id_fkey;
ALTER TABLE local_events DROP CONSTRAINT IF EXISTS local_events_creator_id_fkey;
ALTER TABLE classified_ads DROP CONSTRAINT IF EXISTS classified_ads_user_id_fkey;
ALTER TABLE date_plans DROP CONSTRAINT IF EXISTS date_plans_user_id_fkey; -- Explicitly dropping date_plans FK
ALTER TABLE stores DROP CONSTRAINT IF EXISTS stores_user_id_fkey;
ALTER TABLE store_comments DROP CONSTRAINT IF EXISTS store_comments_user_id_fkey;
ALTER TABLE store_ratings DROP CONSTRAINT IF EXISTS store_ratings_user_id_fkey;

-- 3. Run the dynamic cleanup for any others remaining
DO $$
DECLARE
    r RECORD;
BEGIN
    -- DROP ALL POLICIES (Again, ensuring clean state)
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE tablename IN (
            'profiles', 
            'local_events', 'event_participants', 'event_messages',
            'stores', 'store_comments', 'store_ratings',
            'classified_ads',
            'chats', 'messages',
            'date_plans',
            'user_places'
        )
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', r.policyname, r.schemaname, r.tablename);
    END LOOP;

    -- DROP RELATED FOREIGN KEYS (Both on the tables AND referencing the tables)
    -- Using pg_constraint directly to be more reliable/robust than information_schema
    FOR r IN (
        SELECT 
            con.conname AS constraint_name, 
            nsp.nspname AS table_schema, 
            rel.relname AS table_name
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE con.contype = 'f' 
        AND (
            rel.relname IN (
                'profiles', 
                'local_events', 'event_participants', 'event_messages',
                'stores', 'store_comments', 'store_ratings',
                'classified_ads',
                'chats', 'messages',
                'date_plans',
                'user_places'
            )
            OR
            con.confrelid::regclass::text IN (
                'public.profiles', 'public.local_events', 'public.event_participants', 'public.event_messages',
                'public.stores', 'public.store_comments', 'public.store_ratings',
                'public.classified_ads',
                'public.chats', 'public.messages',
                'public.date_plans',
                'public.user_places',
                'profiles', 'local_events', 'event_participants', 'event_messages',
                'stores', 'store_comments', 'store_ratings',
                'classified_ads',
                'chats', 'messages',
                'date_plans',
                'user_places'
            )
        )
    ) LOOP
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I;', r.table_schema, r.table_name, r.constraint_name);
    END LOOP;
END $$;

-- 4. NOW alter the columns (Should be safe now)
ALTER TABLE profiles ALTER COLUMN id TYPE text;

ALTER TABLE local_events ALTER COLUMN creator_id TYPE text;
ALTER TABLE event_participants ALTER COLUMN user_id TYPE text;
ALTER TABLE event_messages ALTER COLUMN user_id TYPE text;

ALTER TABLE stores ALTER COLUMN user_id TYPE text;
ALTER TABLE store_comments ALTER COLUMN user_id TYPE text;
ALTER TABLE store_ratings ALTER COLUMN user_id TYPE text;

ALTER TABLE classified_ads ALTER COLUMN user_id TYPE text;

ALTER TABLE chats ALTER COLUMN buyer_id TYPE text;
ALTER TABLE chats ALTER COLUMN seller_id TYPE text;
ALTER TABLE messages ALTER COLUMN sender_id TYPE text;

ALTER TABLE date_plans ALTER COLUMN user_id TYPE text;

-- ALTER TABLE user_places ALTER COLUMN user_id TYPE text; -- Column does not exist, skipping

-- 5. Re-enable generic access
CREATE POLICY "Enable generic access" ON profiles FOR ALL USING (true);
CREATE POLICY "Enable generic access" ON local_events FOR ALL USING (true);
CREATE POLICY "Enable generic access" ON event_participants FOR ALL USING (true);
CREATE POLICY "Enable generic access" ON event_messages FOR ALL USING (true);
CREATE POLICY "Enable generic access" ON stores FOR ALL USING (true);
CREATE POLICY "Enable generic access" ON store_comments FOR ALL USING (true);
CREATE POLICY "Enable generic access" ON store_ratings FOR ALL USING (true);
CREATE POLICY "Enable generic access" ON classified_ads FOR ALL USING (true);
CREATE POLICY "Enable generic access" ON chats FOR ALL USING (true);
CREATE POLICY "Enable generic access" ON messages FOR ALL USING (true);
CREATE POLICY "Enable generic access" ON date_plans FOR ALL USING (true);
CREATE POLICY "Enable generic access" ON user_places FOR ALL USING (true);
