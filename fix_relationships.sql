-- Fix relationship between store_comments and profiles
-- We need an explicit foreign key to profiles to allow embedding in queries

-- First, drop the existing constraint if it exists (referencing auth.users)
alter table store_comments drop constraint if exists store_comments_user_id_fkey;

-- Add new constraint referencing profiles
-- Since profiles.id is the same as auth.users.id, this maintains data integrity
alter table store_comments
  add constraint store_comments_user_id_fkey
  foreign key (user_id)
  references profiles(id)
  on delete cascade;

-- Also do the same for store_ratings if we want to fetch profile data there later
alter table store_ratings drop constraint if exists store_ratings_user_id_fkey;

alter table store_ratings
  add constraint store_ratings_user_id_fkey
  foreign key (user_id)
  references profiles(id)
  on delete cascade;
