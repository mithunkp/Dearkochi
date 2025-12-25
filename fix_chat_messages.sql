-- Fix NULL sender_ids in messages (assign to you)
UPDATE messages
SET sender_id = 'nAxVkP5UWEZtz6S0M7hPOWtduVB3'
WHERE sender_id IS NULL;

-- Also check chats for any NULL buyer_id or seller_id
UPDATE chats
SET buyer_id = 'nAxVkP5UWEZtz6S0M7hPOWtduVB3'
WHERE buyer_id IS NULL;

UPDATE chats
SET seller_id = 'nAxVkP5UWEZtz6S0M7hPOWtduVB3'
WHERE seller_id IS NULL;

-- Verify
SELECT * FROM messages WHERE sender_id = 'nAxVkP5UWEZtz6S0M7hPOWtduVB3';
