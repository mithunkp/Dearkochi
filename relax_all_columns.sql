-- RELAX ALL COLUMN LIMITS (ROBUST VERSION)
-- Run this to fix "value too long for type character varying(10)" errors.
-- This script uses dynamic SQL to attempt changes and ignore missing columns.

DO $$
DECLARE
    -- List of (table, column) pairs to relax to TEXT
    columns_to_relax text[][] := ARRAY[
        ['user_places', 'name'],
        ['user_places', 'description'],
        ['user_places', 'type'],
        ['user_places', 'icon'],
        ['user_places', 'best_time'],
        ['user_places', 'entry_fee'],
        ['user_places', 'timings'],
        ['user_places', 'google_maps_url'],
        ['user_places', 'image_url'], -- Verified exists

        ['profiles', 'nickname'],
        ['profiles', 'bio'],
        ['profiles', 'flair'],
        ['profiles', 'full_name'],
        ['profiles', 'avatar_url'],

        ['local_events', 'title'],
        ['local_events', 'description'],
        ['local_events', 'location'],
        -- ['local_events', 'image_url'], -- Removed: Does not exist

        ['classified_ads', 'title'],
        ['classified_ads', 'description'],
        ['classified_ads', 'price'],
        ['classified_ads', 'image_url'], -- Verified exists
        ['classified_ads', 'location']
    ];
    
    target_table text;
    target_column text;
    i int;
BEGIN
    FOR i IN array_lower(columns_to_relax, 1) .. array_upper(columns_to_relax, 1)
    LOOP
        target_table := columns_to_relax[i][1];
        target_column := columns_to_relax[i][2];

        -- Check if column exists before altering to avoid errors
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = target_table 
              AND column_name = target_column
        ) THEN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE text', target_table, target_column);
            RAISE NOTICE 'Relaxed limit for %.%', target_table, target_column;
        ELSE
            RAISE NOTICE 'Skipping %.% (Column does not exist)', target_table, target_column;
        END IF;
    END LOOP;
END $$;
