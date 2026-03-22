-- Apply after creating auth users and matching public.profiles rows.
-- This file is intentionally minimal for the initial scaffold.

insert into public.events (
  destination_id,
  type,
  status,
  visibility,
  title,
  description,
  location_name,
  starts_at,
  timezone,
  created_by_user_id
)
select
  '11111111-1111-1111-1111-111111111111',
  'activity',
  'published',
  'public',
  'Sunrise Coffee Meetup',
  'Kick off the day with coffee and local recommendations.',
  'Village Square',
  now() + interval '2 day',
  'Europe/Zurich',
  id
from public.profiles
limit 1;
