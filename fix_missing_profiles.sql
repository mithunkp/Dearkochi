-- 1. Backfill missing profiles from auth.users
-- This ensures that every user who has signed up (and might have made comments) has a profile
insert into public.profiles (id, email, full_name, avatar_url)
select 
  id, 
  email, 
  raw_user_meta_data->>'full_name', 
  raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;

-- 2. Now that profiles exist, we can safely fix the relationships

-- Fix relationship between store_comments and profiles
alter table store_comments drop constraint if exists store_comments_user_id_fkey;

alter table store_comments
  add constraint store_comments_user_id_fkey
  foreign key (user_id)
  references profiles(id)
  on delete cascade;

-- Fix relationship between store_ratings and profiles
alter table store_ratings drop constraint if exists store_ratings_user_id_fkey;

alter table store_ratings
  add constraint store_ratings_user_id_fkey
  foreign key (user_id)
  references profiles(id)
  on delete cascade;
