create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'host', 'user');
create type public.event_type as enum ('community_event', 'activity');
create type public.event_status as enum ('draft', 'published', 'cancelled', 'completed');
create type public.event_visibility as enum ('public', 'unlisted', 'private');
create type public.event_rsvp_status as enum ('going', 'maybe');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.destinations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country_code text,
  timezone text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key,
  role public.app_role not null default 'user',
  display_name text,
  avatar_url text,
  home_destination_id uuid references public.destinations(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (
    display_name is null or char_length(trim(display_name)) between 2 and 100
  )
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations(id),
  type public.event_type not null,
  status public.event_status not null default 'published',
  visibility public.event_visibility not null default 'public',
  title text not null,
  description text not null,
  location_name text not null,
  location_address text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text not null,
  max_participants integer,
  organizer_name text,
  cover_image_path text,
  created_by_user_id uuid not null references public.profiles(id),
  organizer_user_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  completed_at timestamptz,
  deleted_at timestamptz,
  constraint events_title_length check (char_length(trim(title)) between 3 and 100),
  constraint events_description_length check (char_length(trim(description)) between 10 and 2000),
  constraint events_location_name_not_blank check (char_length(trim(location_name)) > 0),
  constraint events_ends_after_start check (ends_at is null or ends_at > starts_at),
  constraint events_max_participants_positive check (max_participants is null or max_participants > 0)
);

create table public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rsvp_status public.event_rsvp_status not null,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index events_destination_status_starts_at_idx on public.events (destination_id, status, starts_at);
create index events_created_by_starts_at_idx on public.events (created_by_user_id, starts_at desc);
create index event_participants_event_id_idx on public.event_participants (event_id);
create index event_participants_user_id_idx on public.event_participants (user_id);

create trigger set_destinations_updated_at
before update on public.destinations
for each row execute function public.set_updated_at();

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create trigger set_event_participants_updated_at
before update on public.event_participants
for each row execute function public.set_updated_at();

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'user'::public.app_role);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.current_app_role() = 'admin'::public.app_role;
$$;

create or replace function public.is_host_or_admin()
returns boolean
language sql
stable
as $$
  select public.current_app_role() in ('host'::public.app_role, 'admin'::public.app_role);
$$;

alter table public.destinations enable row level security;
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_participants enable row level security;

create policy "destinations are publicly readable"
on public.destinations
for select
using (is_active = true);

create policy "profiles can read themselves"
on public.profiles
for select
using (auth.uid() = id or public.is_admin());

create policy "profiles can update themselves"
on public.profiles
for update
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

create policy "events are publicly readable"
on public.events
for select
using (deleted_at is null and visibility = 'public');

create policy "users can create allowed events"
on public.events
for insert
to authenticated
with check (
  auth.uid() = created_by_user_id
  and (
    (type = 'activity')
    or (type = 'community_event' and public.is_host_or_admin())
  )
);

create policy "owners and admins can update events"
on public.events
for update
to authenticated
using (auth.uid() = created_by_user_id or public.is_admin())
with check (auth.uid() = created_by_user_id or public.is_admin());

create policy "participants readable to authenticated users"
on public.event_participants
for select
to authenticated
using (true);

create policy "users manage their own rsvps"
on public.event_participants
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users update their own rsvps"
on public.event_participants
for update
to authenticated
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

create policy "users delete their own rsvps"
on public.event_participants
for delete
to authenticated
using (auth.uid() = user_id or public.is_admin());

insert into public.destinations (id, slug, name, country_code, timezone)
values ('11111111-1111-1111-1111-111111111111', 'default-destination', 'Default Destination', 'CH', 'Europe/Zurich');
