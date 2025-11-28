-- Migration script to fix classified_ads profile relationship
-- Run this in Supabase SQL Editor

-- Step 1: Ensure all users have profile entries
-- This backfills any missing profiles from auth.users
insert into public.profiles (id, email, full_name, avatar_url)
select 
  id, 
  email, 
  raw_user_meta_data->>'full_name', 
  raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;

-- Step 2: Update the foreign key constraint for classified_ads
-- Drop the existing constraint
alter table classified_ads drop constraint if exists classified_ads_user_id_fkey;

-- Add new constraint referencing profiles instead of auth.users
alter table classified_ads
  add constraint classified_ads_user_id_fkey
  foreign key (user_id)
  references profiles(id)
  on delete cascade;

-- Step 3: Do the same for chats table
alter table chats drop constraint if exists chats_buyer_id_fkey;
alter table chats drop constraint if exists chats_seller_id_fkey;

alter table chats
  add constraint chats_buyer_id_fkey
  foreign key (buyer_id)
  references profiles(id)
  on delete cascade;

alter table chats
  add constraint chats_seller_id_fkey
  foreign key (seller_id)
  references profiles(id)
  on delete cascade;

-- Step 4: Do the same for messages table
alter table messages drop constraint if exists messages_sender_id_fkey;

alter table messages
  add constraint messages_sender_id_fkey
  foreign key (sender_id)
  references profiles(id)
  on delete cascade;

-- Verification: Check if the relationships are set correctly
select 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name
from information_schema.table_constraints as tc 
join information_schema.key_column_usage as kcu
  on tc.constraint_name = kcu.constraint_name
join information_schema.constraint_column_usage as ccu
  on ccu.constraint_name = tc.constraint_name
where tc.constraint_type = 'FOREIGN KEY' 
  and tc.table_name in ('classified_ads', 'chats', 'messages')
order by tc.table_name;
