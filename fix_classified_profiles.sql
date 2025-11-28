-- Fix relationship between classified_ads and profiles
-- This allows us to fetch profile data when querying ads

-- First, ensure all users who posted ads have profiles
insert into public.profiles (id, email, full_name, avatar_url)
select 
  id, 
  email, 
  raw_user_meta_data->>'full_name', 
  raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;

-- Now update the foreign key constraint to reference profiles instead of auth.users
alter table classified_ads drop constraint if exists classified_ads_user_id_fkey;

alter table classified_ads
  add constraint classified_ads_user_id_fkey
  foreign key (user_id)
  references profiles(id)
  on delete cascade;
