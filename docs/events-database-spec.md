# Events Data Layer Specification for Supabase

## 1. Purpose

This document defines the database architecture, migration strategy, type-safety approach, security model, and implementation workflow for the Events feature in a React Native application backed by Supabase.

It is written so a coding agent can implement the data layer once the Supabase project URL, anon key, and service role key have been added to the project environment.

This specification assumes:
- Supabase provides Postgres, Auth, Storage, and Row Level Security (RLS).
- The mobile app is built with React Native and TypeScript.
- Events is the first major product surface, but the schema must support future expansion without destructive redesign.
- The application will eventually grow into a broader destination/community platform with user profiles, moderation, analytics, messaging, and additional domain entities.

---

## 2. Design Principles

### 2.1 Type-safe by default
The full data layer must be designed so TypeScript types are generated from the database schema and consumed directly by the app and backend helpers.

Required principles:
- source of truth is the Postgres schema,
- SQL migrations are committed to version control,
- generated database types are checked into the repository or regenerated deterministically,
- app queries use typed Supabase clients,
- inserts, updates, and selects rely on generated `Database` types,
- no duplicated hand-maintained TypeScript interfaces for persisted tables unless they are derived view models.

### 2.2 Security first
All permissions must be enforced in the database with RLS and not only in the React Native UI.

### 2.3 Extensible but MVP-focused
The schema must solve the current Events MVP cleanly while leaving room for:
- destinations/locations,
- richer user profiles,
- saved events,
- moderation/reporting,
- event chat,
- notifications,
- media galleries,
- recurring events,
- localization,
- analytics exports.

### 2.4 Auditability
Use timestamps, explicit statuses, and soft-delete/cancel patterns where business history matters.

---

## 3. Recommended Supabase Project Setup

## 3.1 Required products
Enable or prepare the following Supabase features:
- Postgres database,
- Auth,
- Storage,
- SQL migrations via Supabase CLI,
- generated TypeScript types,
- RLS on all application tables.

## 3.2 Required environment variables
The app and local tooling should eventually receive at least:
- `EXPO_PUBLIC_SUPABASE_URL` or equivalent app-safe URL variable,
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`,
- `SUPABASE_SERVICE_ROLE_KEY` for trusted server/admin scripts only,
- optional project reference for CLI automation.

Never expose the service role key in the client bundle.

## 3.3 Required folder expectations
A clean implementation should eventually contain at least:
- `supabase/migrations/` for SQL migrations,
- `supabase/seed.sql` or equivalent seed workflow,
- `src/lib/supabase.ts` or equivalent typed client bootstrap,
- `src/types/database.ts` or equivalent generated database types,
- `src/features/events/` for query and domain logic.

---

## 4. Domain Model Overview

The MVP should use a unified events domain rather than splitting community events and activities into separate core tables.

Primary entities:
- `profiles`: application user profile/role metadata linked to Supabase Auth,
- `destinations`: optional but strongly recommended scope container for future multi-destination support,
- `events`: canonical table for both community events and activities,
- `event_participants`: RSVP relationship between users and events,
- `event_images`: optional normalized media table if multiple images may be supported later,
- `moderation_actions`: optional but recommended for admin traceability.

MVP-critical tables are:
- `profiles`,
- `events`,
- `event_participants`.

Recommended now, even if lightly used:
- `destinations`.

Optional for MVP but easy to add now:
- `moderation_actions`.

---

## 5. Schema Strategy

## 5.1 Schema naming
Use the default `public` schema for application tables unless the project already has a stronger convention.

## 5.2 Primary key strategy
Use `uuid` primary keys generated in Postgres for all core tables.

Recommended default:
- `id uuid primary key default gen_random_uuid()`

## 5.3 Timestamp strategy
Every mutable business table should include:
- `created_at timestamptz not null default now()`,
- `updated_at timestamptz not null default now()`.

Add a reusable trigger function to auto-update `updated_at`.

## 5.4 Enum strategy
Use Postgres enums for stable constrained business concepts that are central to permissions and filtering.

Recommended enums:
- `event_type`: `community_event`, `activity`,
- `event_status`: `draft`, `published`, `cancelled`, `completed`,
- `event_visibility`: `public`, `unlisted`, `private`,
- `event_rsvp_status`: `going`, `maybe`,
- `app_role`: `admin`, `host`, `user`.

If the team wants maximum flexibility, role can instead be a text column with a check constraint, but enum is preferable for type generation and safety.

---

## 6. Detailed Table Specifications

## 6.1 `profiles`

Purpose:
- store app-level user data not provided directly by `auth.users`,
- provide role information for RLS,
- support display names and moderation references.

Recommended columns:
- `id uuid primary key references auth.users(id) on delete cascade`,
- `role app_role not null default 'user'`,
- `display_name text`,
- `avatar_url text`,
- `home_destination_id uuid null references public.destinations(id)`,
- `is_active boolean not null default true`,
- `created_at timestamptz not null default now()`,
- `updated_at timestamptz not null default now()`.

Constraints and rules:
- `display_name` should be trimmed and length-checked,
- `role` can only be changed by admins or trusted backend paths,
- profile row should be created automatically on user signup via trigger or explicit onboarding flow.

Indexes:
- primary key is sufficient for MVP,
- optional index on `home_destination_id`.

## 6.2 `destinations`

Purpose:
- scope events to a town, region, resort, or product context,
- avoid future schema surgery if the app expands beyond a single location.

Recommended columns:
- `id uuid primary key default gen_random_uuid()`,
- `slug text not null unique`,
- `name text not null`,
- `country_code text`,
- `timezone text not null`,
- `is_active boolean not null default true`,
- `created_at timestamptz not null default now()`,
- `updated_at timestamptz not null default now()`.

Constraints:
- slug unique,
- timezone required because event rendering depends on correct local time.

MVP note:
- If the app truly launches with one destination only, seed one default destination and still keep the foreign key in `events`.

## 6.3 `events`

Purpose:
- store both formal community events and user-created activities.

Recommended columns:
- `id uuid primary key default gen_random_uuid()`,
- `destination_id uuid not null references public.destinations(id)`,
- `type event_type not null`,
- `status event_status not null default 'published'`,
- `visibility event_visibility not null default 'public'`,
- `title text not null`,
- `description text not null`,
- `location_name text not null`,
- `location_address text`,
- `latitude double precision`,
- `longitude double precision`,
- `starts_at timestamptz not null`,
- `ends_at timestamptz`,
- `timezone text not null`,
- `max_participants integer`,
- `cover_image_path text`,
- `organizer_user_id uuid null references public.profiles(id) on delete set null`,
- `organizer_name text`,
- `created_by_user_id uuid not null references public.profiles(id) on delete restrict`,
- `updated_by_user_id uuid null references public.profiles(id) on delete set null`,
- `published_at timestamptz null default now()`,
- `cancelled_at timestamptz`,
- `completed_at timestamptz`,
- `deleted_at timestamptz`,
- `created_at timestamptz not null default now()`,
- `updated_at timestamptz not null default now()`.

Validation constraints:
- title length between 3 and 100,
- description length between 10 and 2000,
- location_name required and non-blank,
- `ends_at` must be null or greater than `starts_at`,
- `max_participants` must be null or greater than 0,
- latitude and longitude must either both be null or both be present,
- if status is `cancelled`, `cancelled_at` may be set,
- if status is `completed`, `completed_at` may be set.

Business notes:
- `timezone` is stored explicitly to preserve intended local display behavior,
- `organizer_name` allows branded or external organizers while preserving profile ownership,
- `created_by_user_id` is the permission anchor,
- `organizer_user_id` may match `created_by_user_id` but should remain separate for flexibility.

Indexes:
- composite index on `(destination_id, status, starts_at)`,
- index on `(created_by_user_id, starts_at desc)`,
- partial index for public feed on upcoming published rows,
- optional GiST index for geo queries if map discovery is added.

## 6.4 `event_participants`

Purpose:
- store one RSVP per user per event.

Recommended columns:
- `id uuid primary key default gen_random_uuid()`,
- `event_id uuid not null references public.events(id) on delete cascade`,
- `user_id uuid not null references public.profiles(id) on delete cascade`,
- `rsvp_status event_rsvp_status not null`,
- `joined_at timestamptz not null default now()`,
- `created_at timestamptz not null default now()`,
- `updated_at timestamptz not null default now()`.

Constraints:
- unique `(event_id, user_id)`,
- disallow duplicate RSVP rows,
- updates replace status instead of inserting another row.

Indexes:
- unique index on `(event_id, user_id)`,
- index on `(user_id, created_at desc)`,
- index on `(event_id, rsvp_status)`.

## 6.5 `event_images` (optional but recommended only if multiple assets are planned)

Purpose:
- support future multi-image events without reshaping `events` later.

Recommended columns:
- `id uuid primary key default gen_random_uuid()`,
- `event_id uuid not null references public.events(id) on delete cascade`,
- `storage_path text not null`,
- `sort_order integer not null default 0`,
- `created_at timestamptz not null default now()`.

MVP simplification:
- if only one image is supported now, keep `cover_image_path` on `events` and defer this table.

## 6.6 `moderation_actions` (recommended)

Purpose:
- preserve an audit trail for admin actions.

Recommended columns:
- `id uuid primary key default gen_random_uuid()`,
- `event_id uuid not null references public.events(id) on delete cascade`,
- `admin_user_id uuid not null references public.profiles(id) on delete restrict`,
- `action text not null`,
- `reason text`,
- `metadata jsonb not null default '{}'::jsonb`,
- `created_at timestamptz not null default now()`.

Supported actions can include:
- `edited`,
- `cancelled`,
- `deleted`,
- `restored`.

---

## 7. Derived Data and Read Models

Do not store redundant participant counts in the main `events` table during MVP unless performance proves it necessary.

Preferred approach:
- compute counts from `event_participants`,
- expose them through SQL views or RPC functions,
- optionally materialize later if feed scale requires it.

Recommended read view:
- `public.event_feed_view`

Suggested columns for the view:
- core event fields,
- `going_count`,
- `maybe_count`,
- `is_full`,
- organizer display value,
- optional current-user-specific RSVP to be joined client-side or fetched via RPC.

Recommended “my events” view or query pattern:
- created events query filtered by `created_by_user_id = auth.uid()`,
- joined events query from `event_participants` joined to `events`.

If performance concerns arise later, add:
- cached counters through triggers,
- materialized views refreshed by job,
- edge function aggregation.

---

## 8. Row Level Security Model

Enable RLS on every application table.

## 8.1 General rules
- public feed can be readable by authenticated and anonymous users only for visible published upcoming events,
- authenticated users can create rows allowed by their role,
- users can only modify their own participation rows,
- admins have broad control,
- hosts can manage their own created events,
- standard users can create only activities.

## 8.2 Helper SQL functions
Create stable helper functions such as:
- `public.current_app_role()` returns current user role,
- `public.is_admin()` returns boolean,
- `public.is_host_or_admin()` returns boolean.

These should read from `profiles` using `auth.uid()`.

## 8.3 `profiles` policies
Recommended:
- users can read limited public profile fields if required by app UX,
- user can select and update own profile,
- admin can update any profile,
- insert handled by trigger or trusted path.

## 8.4 `destinations` policies
Recommended:
- all users including anonymous can read active destinations,
- only admins or service role can modify destinations.

## 8.5 `events` policies
Recommended select policy:
- anonymous and authenticated users can read events where:
  - `deleted_at is null`,
  - `visibility = 'public'`,
  - `status in ('published', 'completed')` for detail/history access, and feed layer separately filters upcoming,
  - destination is active.

Recommended insert policy:
- authenticated users only,
- `created_by_user_id = auth.uid()`,
- `updated_by_user_id = auth.uid()` or null,
- `type = 'activity'` allowed for `user`, `host`, `admin`,
- `type = 'community_event'` allowed only for `host`, `admin`.

Recommended update policy:
- admins can update any non-deleted event,
- creators can update their own events if allowed by business rules,
- user-created community events should never exist if insert policy is correct.

Recommended delete approach:
- prefer update to `deleted_at` or `status = 'cancelled'` instead of hard delete from client paths,
- reserve true delete for service role/admin maintenance.

## 8.6 `event_participants` policies
Recommended select policy:
- authenticated users can read participant rows for public events,
- anonymous users may be blocked from raw participant rows if privacy matters; expose counts instead.

Recommended insert policy:
- authenticated users only,
- `user_id = auth.uid()`,
- event must be published, not cancelled, not deleted, not completed,
- if `max_participants` exists, only allow `going` when capacity is available.

Recommended update policy:
- authenticated user can update own RSVP row only.

Recommended delete policy:
- authenticated user can remove own RSVP row,
- admins can remove abusive participation rows if needed.

---

## 9. Capacity and Integrity Rules

Capacity must be enforced server-side, not only in the app.

Recommended strategies:
1. use a Postgres function for RSVP writes,
2. inside the function lock the event row or otherwise ensure safe concurrent capacity checks,
3. count only `going` RSVPs against `max_participants`,
4. allow `maybe` even when event is full unless product decides otherwise,
5. return explicit errors for full events and invalid statuses.

Important integrity rules:
- one RSVP row per user per event,
- cannot RSVP to cancelled/completed/deleted events,
- cannot create events in the past unless admin workflow explicitly allows it,
- organizer may optionally receive an automatic `going` RSVP row at creation time.

---

## 10. Recommended Database Functions

To keep the client thin and rules centralized, the data layer should expose SQL functions or RPC endpoints for important mutations.

Recommended functions:

### 10.1 `create_event(...)`
Responsibilities:
- validate role,
- validate fields,
- normalize text,
- create the event row,
- optionally create organizer RSVP,
- return created event.

### 10.2 `update_event(...)`
Responsibilities:
- verify actor permission,
- apply safe updates,
- update `updated_at` and `updated_by_user_id`,
- protect immutable fields if needed.

### 10.3 `set_event_rsvp(p_event_id uuid, p_rsvp_status event_rsvp_status)`
Responsibilities:
- verify event availability,
- enforce capacity for `going`,
- upsert participant row,
- return updated participation state and counts.

### 10.4 `remove_event_rsvp(p_event_id uuid)`
Responsibilities:
- delete current user RSVP row,
- return updated counts.

### 10.5 `cancel_event(p_event_id uuid, p_reason text)`
Responsibilities:
- admin or owner moderation path,
- set status and timestamps,
- optionally record moderation action.

### 10.6 `get_event_feed(...)`
Optional but recommended if feed filtering becomes complex.
Responsibilities:
- encapsulate upcoming filter,
- sort by `starts_at`,
- return participant counts,
- support destination/type pagination parameters.

---

## 11. Storage Strategy for Images

For event images, use Supabase Storage.

Recommended bucket:
- `event-images`

Recommended path pattern:
- `events/{event_id}/cover-{timestamp}.jpg`

Security guidance:
- authenticated uploads only,
- enforce file size and MIME type restrictions,
- store only storage path in the database, not full signed URLs,
- generate public or signed URLs in app/service layer as needed.

Database relationship:
- MVP can store `cover_image_path` on `events`,
- future multi-image support can move to `event_images` without breaking the client model too much.

---

## 12. Migration Plan

Use Supabase CLI migrations as the only schema change mechanism.

Recommended migration order:
1. enable required extensions such as `pgcrypto` if missing,
2. create enums,
3. create shared trigger function for `updated_at`,
4. create `profiles`,
5. create `destinations`,
6. create `events`,
7. create `event_participants`,
8. create optional `moderation_actions`,
9. add indexes,
10. enable RLS,
11. add RLS policies,
12. create SQL functions/RPC helpers,
13. add seed data for one destination and sample roles/events.

Migration discipline:
- one concern per migration where practical,
- never edit an old applied migration in shared workflows,
- prefer follow-up corrective migrations,
- keep seed data deterministic for local development.

---

## 13. Type Generation Strategy

The app must consume generated Supabase database types.

Required workflow:
- run migrations locally or against linked project,
- generate TypeScript database types from the schema,
- commit the generated type file if the repo uses committed generated artifacts,
- import those types into the Supabase client factory.

Recommended generated type usage pattern:
- `Database['public']['Tables']['events']['Row']`
- `Database['public']['Tables']['events']['Insert']`
- `Database['public']['Tables']['events']['Update']`

Recommended app-layer derived types:
- `EventFeedItem` for UI composition,
- `EventDetail` for joined/read-model responses,
- `MyEventListItem` for combined created/joined views.

These derived types should be composed from generated database types rather than rewritten independently.

---

## 14. Query Layer Recommendations for React Native

Structure query code so the UI does not embed raw SQL assumptions everywhere.

Recommended modules:
- `events.queries.ts` for reads,
- `events.mutations.ts` for writes,
- `events.types.ts` for derived view models,
- `events.mapper.ts` for transforming raw rows into UI-safe objects.

Recommended read operations:
- list upcoming events by destination,
- get event detail by id,
- get current user RSVP for event,
- list created events,
- list joined events.

Recommended write operations:
- create event,
- update event,
- cancel event,
- set RSVP,
- remove RSVP.

Preferred client behavior:
- call RPC/functions for stateful writes,
- use typed `.select()` queries for simple reads,
- centralize error mapping from Postgres/Supabase errors to user-friendly messages.

---

## 15. Validation Rules

Validation must exist in three layers:
- client-side for fast feedback,
- database constraints for correctness,
- RPC/function checks for business logic.

Required MVP validation:
- title required, trimmed, minimum 3 characters,
- description required, minimum 10 characters,
- location required,
- `starts_at` required and in the future for user-facing create flow,
- `ends_at` after `starts_at` if present,
- type required,
- destination required,
- `max_participants` positive if provided.

Recommended normalization:
- trim repeated whitespace,
- lowercase slugs,
- standardize timezone source to IANA timezone strings,
- reject malformed coordinates.

---

## 16. Seed Data Requirements

Local development should include realistic seed data so the first screen of the app is immediately testable.

Recommended seed set:
- one active destination,
- one admin profile,
- one host profile,
- two standard user profiles,
- at least two `community_event` rows,
- at least three `activity` rows,
- participant rows covering `going` and `maybe`,
- one cancelled event,
- one completed event.

Seed goals:
- validate role restrictions,
- validate feed ordering,
- validate my-events queries,
- validate detail rendering with and without images.

---

## 17. Future-Proofing Decisions

These choices should be made now because they are cheap early and expensive later:

### 17.1 Keep `destination_id`
Even if there is one destination now, keep the foreign key.

### 17.2 Separate creator from organizer
This supports branded institutions and staff-created events.

### 17.3 Keep explicit statuses
Avoid boolean flags like `is_cancelled` when lifecycle complexity will grow.

### 17.4 Store timezone explicitly
Do not assume the device timezone equals the event timezone.

### 17.5 Prefer soft lifecycle state over hard deletes
This supports analytics and moderation.

### 17.6 Reserve room for private/unlisted events
A small `visibility` enum now avoids painful redesign later.

---

## 18. Implementation Checklist for Coding Agents

A coding agent implementing this data layer should complete the work in the following order:

1. Inspect the existing app structure, env handling, and Supabase setup.
2. Add Supabase CLI configuration if missing.
3. Create SQL migrations for enums, tables, constraints, indexes, triggers, and RLS.
4. Create helper SQL functions for role lookup and typed mutation RPCs.
5. Add seed data for development.
6. Generate TypeScript database types.
7. Create or update the typed Supabase client bootstrap.
8. Build event query and mutation modules using generated types.
9. Add tests for migration assumptions, permissions, and RSVP capacity logic.
10. Document any manual Supabase dashboard steps that cannot be expressed in migrations.

---

## 19. Agent Prompt to Implement the Data Layer

Use the following prompt when assigning implementation to a coding agent.

```text
Implement the Supabase-backed data layer for the Events feature in this React Native TypeScript project.

Goals:
- Build the Events schema in a type-safe way using Supabase Postgres migrations.
- Use generated TypeScript database types as the source of truth for persisted data shapes.
- Secure all writes and sensitive reads with Row Level Security.
- Support the Events MVP and leave room for future expansion.

Business rules:
- There are two event types: `community_event` and `activity`.
- Admins and Hosts can create community events.
- Admins, Hosts, and Users can create activities.
- Visitors can browse public events but cannot RSVP.
- Authenticated users can RSVP with `going` or `maybe` and can remove their RSVP.
- Community events and activities live in one `events` table.
- Each user can have at most one RSVP row per event.
- Capacity, event status, and permissions must be enforced in the database layer.

Required database objects:
- `profiles`
- `destinations`
- `events`
- `event_participants`
- optional `moderation_actions` if practical
- enums for role, event type, event status, visibility, and RSVP status
- timestamp update trigger
- RLS policies on all application tables
- helper SQL functions for current role checks
- RPC functions for creating events and setting/removing RSVP

Schema requirements:
- UUID primary keys
- `created_at` and `updated_at` on mutable tables
- `destination_id` on events even if only one destination exists today
- explicit `timezone` on events
- `created_by_user_id` separated from `organizer_user_id`
- unique `(event_id, user_id)` constraint on `event_participants`
- safe constraints for max participants and event time ranges

Type-safety requirements:
- generate TypeScript types from Supabase schema
- wire the generated `Database` type into the Supabase client
- base insert/update/select types on generated table types
- only create derived app-level view models when they compose generated types

Implementation steps:
1. Add migrations for extensions, enums, tables, constraints, indexes, triggers, RLS policies, and RPC functions.
2. Add seed data for local development with representative roles and events.
3. Generate the database TypeScript types and commit them if that is the project convention.
4. Add typed query and mutation modules for:
   - list upcoming events
   - get event detail
   - list my created events
   - list my joined events
   - create event
   - update/cancel event
   - set RSVP
   - remove RSVP
5. Add automated tests for:
   - role-based event creation permissions,
   - unique RSVP enforcement,
   - chronological feed sorting,
   - capacity enforcement,
   - cancelled/completed event RSVP rejection,
   - user-only ownership restrictions,
   - admin override paths.

Constraints:
- do not rely on client-only permission checks
- do not hardcode hand-written table interfaces that drift from the schema
- do not split community events and activities into separate core tables
- do not expose service role credentials to the React Native client

Deliverables:
- SQL migrations
- typed Supabase client/database types integration
- typed query/mutation modules
- development seed data
- concise implementation notes describing any manual setup still required once API keys are added
```

---

## 20. Definition of Done

The database/data-layer work is complete when:
- migrations can create the full schema from scratch,
- RLS is enabled and verified for all application tables,
- role restrictions are enforced in Postgres policies or RPC functions,
- RSVP uniqueness and capacity rules are enforced server-side,
- database types are generated and consumed by the app code,
- the app can load an upcoming events feed from Supabase,
- the app can create events and RSVP through typed query/mutation helpers,
- local seed data makes the Events screen usable for development immediately,
- all required implementation instructions are committed to the repository.

---

## 21. Recommended Non-MVP Follow-Ups

After the first release, the next data-layer enhancements should likely be:
- event reporting tables,
- saved/bookmarked events,
- notifications and reminders,
- recurring event rules,
- chat/thread relations,
- richer geospatial search,
- analytics event export tables,
- localization tables for translatable event content.
