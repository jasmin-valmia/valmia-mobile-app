# Events MVP Execution Plan for `valmia-mobile-app`

## 1. Purpose

This document turns the Events PRD and database spec into an execution-ready build plan for the separate Expo application repository.

It is intentionally practical. The goal is to define the order of work, concrete deliverables, required configuration, and the remaining external dependencies so implementation can move without ambiguity.

Primary references:
- `docs/events-agent-prd.md`
- `docs/events-database-spec.md`

---

## 2. Confirmed Decisions

These decisions are already made and should be treated as defaults unless product direction changes:

- the mobile app will live in a separate repository,
- the mobile app will be an Expo project,
- the app name is `valmia-mobile-app`,
- authentication will use Clerk,
- sign-in scope is Google account sign-in only,
- Google Drive access is explicitly out of scope,
- Supabase is the system of record for data,
- the Supabase project is new,
- database changes should be managed through Supabase migrations,
- the initial mobile identity values are:
  - iOS bundle identifier: `com.valmia.mobileapp`,
  - Android package name: `com.valmia.mobileapp`.

---

## 3. Workstreams

Implementation should be split into five workstreams that can be executed in sequence with limited overlap.

### 3.1 App bootstrap
Responsible for creating the Expo shell and shared app infrastructure.

Deliverables:
- Expo project scaffold,
- TypeScript configuration,
- Expo Router setup,
- environment loading and validation,
- shared providers,
- query client wiring,
- lint/typecheck/test scripts.

### 3.2 Authentication
Responsible for sign-in experience and session-aware routing.

Deliverables:
- Clerk provider bootstrap,
- signed-in / signed-out route guards,
- Google sign-in button and callback flow,
- sign-out flow,
- loading and failure states.

### 3.3 Data layer
Responsible for Supabase schema, RLS, and generated types.

Deliverables:
- `supabase/migrations/` initialized,
- Events schema migrations,
- RLS policies,
- RSVP and event mutation RPCs,
- seed data,
- generated `Database` TypeScript types.

### 3.4 Events feature UI
Responsible for the first user-facing product surfaces.

Deliverables:
- Events feed screen,
- Event detail screen,
- Create/Edit Event screen,
- My Events screen,
- feature-level components and hooks,
- empty/error/loading states.

### 3.5 Hardening
Responsible for correctness, reliability, and release readiness.

Deliverables:
- permission and RLS validation,
- RSVP capacity tests,
- analytics hooks if available,
- auth redirect verification on iOS and Android,
- release checklist for builds and secrets.

---

## 4. Phase-by-Phase Build Plan

## Phase 1 — Repository bootstrap

Goal: create a runnable Expo shell with the right technical foundation.

Tasks:
1. Create a new Expo app repository rooted at `valmia-mobile-app`.
2. Add Expo Router.
3. Add TypeScript and shared path aliases if the team wants them.
4. Add TanStack Query.
5. Add Zod for form and env validation.
6. Add environment parsing for:
   - `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
7. Configure Expo app identity:
   - name: `valmia-mobile-app`
   - slug aligned to repo/app naming
   - scheme for auth redirects
   - iOS bundle identifier: `com.valmia.mobileapp`
   - Android package: `com.valmia.mobileapp`
8. Add root providers for Clerk, Query Client, and app session state.

Definition of done:
- the app boots locally,
- env validation fails loudly when required variables are missing,
- navigation shell renders a signed-out placeholder route.

## Phase 2 — Clerk authentication scaffold

Goal: complete Expo-compatible authentication plumbing without blocking on the Events feature.

Tasks:
1. Add Clerk Expo SDK and token persistence.
2. Implement signed-out screen with Google CTA.
3. Implement signed-in shell route.
4. Add sign-out control.
5. Handle auth loading states cleanly.
6. Document the remaining Google configuration values still needed if iOS/Android client IDs are not yet available.

Definition of done:
- a user can complete the basic Clerk session flow once Google credentials are finished,
- the app route tree responds correctly to signed-in and signed-out state,
- no Google client secret is stored in Expo env or source.

## Phase 3 — Supabase foundations

Goal: establish the canonical backend contract before building feature screens.

Tasks:
1. Initialize Supabase CLI configuration in the mobile repo.
2. Create migrations for:
   - extensions,
   - enums,
   - timestamp trigger,
   - `destinations`,
   - `profiles`,
   - `events`,
   - `event_participants`,
   - optional `moderation_actions`.
3. Enable RLS on application tables.
4. Create helper SQL functions for role and authorization checks.
5. Create RPC functions for:
   - `create_event`,
   - `update_event`,
   - `cancel_event`,
   - `set_event_rsvp`,
   - `remove_event_rsvp`.
6. Add deterministic seed data for one destination and sample events.
7. Generate and commit database types.

Definition of done:
- a fresh Supabase project can be brought to the required schema with migrations only,
- generated DB types compile in the app,
- capacity and permission rules are enforced in SQL/RLS rather than only in the client.

## Phase 4 — Event read surfaces

Goal: make the app useful before write flows are fully polished.

Tasks:
1. Implement feed query for upcoming published events.
2. Implement event detail query by id.
3. Implement “My Created Events” query.
4. Implement “My Joined Events” query.
5. Build loading, empty, and error states for each surface.
6. Map database rows into stable UI models only where presentation requires it.

Definition of done:
- users can browse feed and detail views,
- signed-in users can open a personal events surface,
- the app displays event type, schedule, location, and RSVP counts consistently.

## Phase 5 — Event write surfaces

Goal: complete the MVP workflows promised in the PRD.

Tasks:
1. Build Create Event / Activity form.
2. Enforce role-aware type selection in UI.
3. Add client validation for required fields, time ordering, and capacity format.
4. Implement RSVP mutations (`going`, `maybe`, remove).
5. Implement edit flow where permitted.
6. Implement cancel flow for authorized actors.
7. Ensure optimistic updates do not mask backend permission failures.

Definition of done:
- standard users can create activities only,
- hosts/admins can create both event types,
- RSVP changes persist correctly and reflect backend truth,
- cancelled or completed items reject invalid participation changes.

## Phase 6 — Hardening and release prep

Goal: make the feature safe to demo and iterate on.

Tasks:
1. Add tests or scripted verification for:
   - role restrictions,
   - one RSVP row per user/event,
   - capacity enforcement,
   - cancelled/completed restrictions,
   - sorting by `starts_at`.
2. Verify Google login redirect behavior on iOS and Android.
3. Verify seed data loads correctly on a fresh project.
4. Document local setup and migration commands.
5. Prepare a release checklist for secrets and environment values.

Definition of done:
- the MVP works on a fresh environment,
- database setup is reproducible,
- the highest-risk auth and permission paths are tested.

---

## 5. Repository Structure Recommendation

Recommended project layout for the new repo:

- `app/`
- `src/features/auth/`
- `src/features/events/`
- `src/components/`
- `src/providers/`
- `src/lib/clerk/`
- `src/lib/supabase/`
- `src/lib/env/`
- `src/types/`
- `supabase/migrations/`
- `supabase/seed.sql`

Recommended Events feature layout:

- `src/features/events/components/`
- `src/features/events/screens/`
- `src/features/events/hooks/`
- `src/features/events/queries/`
- `src/features/events/mutations/`
- `src/features/events/mappers/`
- `src/features/events/validation/`
- `src/features/events/types/`

---

## 6. Required Environment Configuration

Minimum mobile-safe runtime variables:

```properties
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Expected later when native Google auth is finalized:

```properties
EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_CLERK_GOOGLE_ANDROID_CLIENT_ID=
```

Rules:
- never put the Google OAuth client secret in Expo env,
- never put the Supabase service role key in Expo env,
- keep service-role usage limited to trusted tooling or backend automation only.

---

## 7. Remaining External Dependencies

The project can start now, but these items still need to be completed before production-ready auth works on all platforms.

### 7.1 Google / Clerk
Still needed or still worth verifying:
- Google Web Client ID,
- Google iOS Client ID,
- Google Android Client ID,
- redirect/scheme alignment for Expo auth callbacks,
- Android SHA-1 if Google requires it for the chosen flow.

### 7.2 Identity bridging decision
Before production write flows ship, the team must lock one approach for how Clerk-authenticated users map into Supabase-backed profile rows.

Accepted options include:
- native Supabase Auth instead of Clerk,
- Clerk token exchange into Supabase-compatible auth context,
- trusted backend mediation for write operations.

This choice affects:
- how `profiles.id` is created,
- how `auth.uid()`-style logic works in RLS,
- how secure write operations are implemented.

---

## 8. Suggested PR Breakdown

To keep reviewable change sets small, split implementation across multiple PRs.

### PR 1 — Expo foundation
Scope:
- Expo scaffold,
- Clerk provider wiring,
- Supabase client bootstrap,
- env handling,
- route shell.

### PR 2 — Supabase schema
Scope:
- migrations,
- seed data,
- RLS,
- SQL/RPC helpers,
- generated types.

### PR 3 — Read experiences
Scope:
- feed,
- detail,
- my events queries,
- loading/empty/error states.

### PR 4 — Write experiences
Scope:
- create flow,
- RSVP mutations,
- edit/cancel behavior,
- validation and mutation UX.

### PR 5 — Hardening
Scope:
- test coverage,
- auth redirect fixes,
- polish,
- analytics hooks if available.

---

## 9. Top Risks to Manage Early

1. **Auth mismatch risk**
   If Clerk identity is not mapped cleanly into Supabase authorization, RLS will block or misattribute writes.

2. **Expo redirect risk**
   Google login can fail late if the app scheme, bundle ID, package name, or callback configuration is inconsistent.

3. **Permission drift risk**
   UI-only role checks may appear correct while direct writes still bypass rules unless SQL/RLS is authoritative.

4. **Capacity race risk**
   Direct participant table writes can oversubscribe events unless RSVP changes are handled transactionally.

5. **Schema drift risk**
   Hand-maintained client interfaces will diverge from Postgres unless generated types are part of the workflow.

---

## 10. Immediate Next Action

If work starts right now, the next concrete task should be:

1. create the separate Expo repository,
2. add Clerk + Supabase env plumbing,
3. initialize Supabase migrations,
4. implement the baseline schema from `docs/events-database-spec.md`,
5. generate DB types,
6. then build the feed and detail read surfaces first.

That is the lowest-risk path to a usable MVP.
