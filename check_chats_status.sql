-- Check columns
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('chats', 'messages') AND column_name LIKE '%id%';

-- Check Policies
SELECT tablename, policyname, cmd, roles, qual 
FROM pg_policies 
WHERE tablename IN ('chats', 'messages');

-- Check Data (look for NULLs or UUID vs Text format)
SELECT id, buyer_id, seller_id FROM chats LIMIT 5;
SELECT id, sender_id, chat_id FROM messages LIMIT 5;
