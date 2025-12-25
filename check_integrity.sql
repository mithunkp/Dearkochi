-- DATA INTEGRITY CHECK (UNIFIED)
-- Run this to find rows that will fail foreign key constraints.
-- This script returns a SINGLE table of errors.
-- If this query returns ANY rows, your data has issues that must be fixed before migration.

SELECT * FROM (
    -- 1. Check for Duplicate Profile IDs
    SELECT 
        'profiles'::text as table_name, 
        'id'::text as column_name, 
        id::text as invalid_value, 
        COUNT(*) as issue_count 
    FROM profiles 
    GROUP BY id HAVING COUNT(*) > 1

    UNION ALL

    -- 2. local_events -> profiles
    SELECT 'local_events', 'creator_id', creator_id::text, COUNT(*)
    FROM local_events 
    WHERE creator_id IS NOT NULL AND creator_id NOT IN (SELECT id FROM profiles)
    GROUP BY creator_id

    UNION ALL

    -- 3. event_participants -> profiles
    SELECT 'event_participants', 'user_id', user_id::text, COUNT(*)
    FROM event_participants 
    WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM profiles)
    GROUP BY user_id

    UNION ALL

    -- 4. event_messages -> profiles
    SELECT 'event_messages', 'user_id', user_id::text, COUNT(*)
    FROM event_messages 
    WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM profiles)
    GROUP BY user_id

    UNION ALL

    -- 5. stores -> profiles
    SELECT 'stores', 'user_id', user_id::text, COUNT(*)
    FROM stores 
    WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM profiles)
    GROUP BY user_id

    UNION ALL

    -- 6. store_comments -> profiles
    SELECT 'store_comments', 'user_id', user_id::text, COUNT(*)
    FROM store_comments 
    WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM profiles)
    GROUP BY user_id

    UNION ALL

    -- 7. store_ratings -> profiles
    SELECT 'store_ratings', 'user_id', user_id::text, COUNT(*)
    FROM store_ratings 
    WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM profiles)
    GROUP BY user_id

    UNION ALL

    -- 8. classified_ads -> profiles
    SELECT 'classified_ads', 'user_id', user_id::text, COUNT(*)
    FROM classified_ads 
    WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM profiles)
    GROUP BY user_id

    UNION ALL

    -- 9. chats -> profiles (buyer)
    SELECT 'chats', 'buyer_id', buyer_id::text, COUNT(*)
    FROM chats 
    WHERE buyer_id IS NOT NULL AND buyer_id NOT IN (SELECT id FROM profiles)
    GROUP BY buyer_id

    UNION ALL

    -- 10. chats -> profiles (seller)
    SELECT 'chats', 'seller_id', seller_id::text, COUNT(*)
    FROM chats 
    WHERE seller_id IS NOT NULL AND seller_id NOT IN (SELECT id FROM profiles)
    GROUP BY seller_id

    UNION ALL

    -- 11. messages -> profiles (sender)
    SELECT 'messages', 'sender_id', sender_id::text, COUNT(*)
    FROM messages 
    WHERE sender_id IS NOT NULL AND sender_id NOT IN (SELECT id FROM profiles)
    GROUP BY sender_id

    UNION ALL

    -- 12. date_plans -> profiles
    SELECT 'date_plans', 'user_id', user_id::text, COUNT(*)
    FROM date_plans 
    WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM profiles)
    GROUP BY user_id

    UNION ALL

    -- 13. stores -> categories
    SELECT 'stores', 'category_id', category_id::text, COUNT(*)
    FROM stores 
    WHERE category_id IS NOT NULL AND category_id NOT IN (SELECT id FROM categories)
    GROUP BY category_id

    UNION ALL

    -- 14. classified_ads -> classified_categories
    SELECT 'classified_ads', 'category_id', category_id::text, COUNT(*)
    FROM classified_ads 
    WHERE category_id IS NOT NULL AND category_id NOT IN (SELECT id FROM classified_categories)
    GROUP BY category_id

    UNION ALL

    -- 15. event_participants -> local_events
    SELECT 'event_participants', 'event_id', event_id::text, COUNT(*)
    FROM event_participants 
    WHERE event_id IS NOT NULL AND event_id NOT IN (SELECT id FROM local_events)
    GROUP BY event_id

    UNION ALL

    -- 16. event_messages -> local_events
    SELECT 'event_messages', 'event_id', event_id::text, COUNT(*)
    FROM event_messages 
    WHERE event_id IS NOT NULL AND event_id NOT IN (SELECT id FROM local_events)
    GROUP BY event_id

    UNION ALL

    -- 17. store_comments -> stores
    SELECT 'store_comments', 'store_id', store_id::text, COUNT(*)
    FROM store_comments 
    WHERE store_id IS NOT NULL AND store_id NOT IN (SELECT id FROM stores)
    GROUP BY store_id

    UNION ALL

    -- 18. store_ratings -> stores
    SELECT 'store_ratings', 'store_id', store_id::text, COUNT(*)
    FROM store_ratings 
    WHERE store_id IS NOT NULL AND store_id NOT IN (SELECT id FROM stores)
    GROUP BY store_id

    UNION ALL

    -- 19. messages -> chats
    SELECT 'messages', 'chat_id', chat_id::text, COUNT(*)
    FROM messages 
    WHERE chat_id IS NOT NULL AND chat_id NOT IN (SELECT id FROM chats)
    GROUP BY chat_id

    UNION ALL

    -- 20. chats -> classified_ads
    SELECT 'chats', 'ad_id', ad_id::text, COUNT(*)
    FROM chats 
    WHERE ad_id IS NOT NULL AND ad_id NOT IN (SELECT id FROM classified_ads)
    GROUP BY ad_id

) AS report
ORDER BY issue_count DESC;
