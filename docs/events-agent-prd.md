# Events MVP PRD and Execution Instructions for Coding Agents

## 1. Purpose

This document translates the Events feature request into an implementation-ready specification that a coding agent can execute independently. It defines the product intent, user flows, data model, permissions, UX expectations, backend behavior, analytics, moderation rules, edge cases, acceptance criteria, and a reusable build prompt.

For the concrete implementation sequence and repository bootstrap plan for the separate Expo app, also follow `docs/events-execution-plan.md`.

The MVP focuses on one core domain: **Events**, with two event subtypes:

- **Community Events**: planned gatherings run by institutions, organizations, or hosts.
- **Activities**: smaller, informal, user-initiated meetups that may be spontaneous.

The implementation should present both within one unified system while preserving the behavioral differences between formal events and lightweight activities.

---

## 2. Product Goals

### Primary goal
Enable visitors and signed-in users to discover, join, create, and manage destination-based events and activities with minimal friction.

### MVP outcome
Users should be able to:
- browse an event feed sorted by date/time,
- open an event detail page,
- join or leave an event,
- create new community events or activities based on role,
- view events they created or joined,
- allow admins to moderate content.

### Success metrics
Track these metrics from the initial release:
- number of community events created,
- number of activities created,
- join rate per event,
- leave rate per event,
- repeat participation by the same user,
- percentage of events with at least one participant beyond the organizer.

---

## 3. Core Concepts

### 3.1 Event types
The system stores both categories in a single `event` domain model with a required `type` field.

#### `community_event`
Use for organized, planned, hosted experiences.
Examples:
- village festival,
- guided hike,
- yoga class,
- cultural evening.

#### `activity`
Use for lightweight, social, user-originated activities.
Examples:
- evening walk,
- coffee meetup,
- tennis partner wanted,
- ski tour tomorrow.

### 3.2 Status model
Each event should support at least the following states:
- `draft` (optional, only if drafts already fit the platform),
- `published`,
- `cancelled`,
- `completed`.

If the existing application does not support drafts, start with `published`, `cancelled`, and `completed`.

### 3.3 Participation model
A user can express attendance using one of these RSVP states:
- `going`,
- `maybe`.

If the existing system should stay simpler for MVP, `going` can be required first and `maybe` can be supported only if effort is low. However, because the provided mockup shows both counts and buttons, the preferred implementation includes both RSVP states.

---

## 4. Roles and Permissions

Implement the following permissions matrix.

| Role  | Create community event | Create activity | Join/leave | Edit own | Edit any | Delete any | Moderate |
|------|-------------------------|-----------------|------------|----------|----------|------------|----------|
| Admin | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Host  | Yes | Yes | Yes | Yes | No | No | No |
| User  | No  | Yes | Yes | Yes, only for own activities if editing is supported | No | No | No |
| Visitor/Guest | No | No | View only unless authentication gate is intentionally skipped | No | No | No | No |

### Permission rules
1. **Admins** can create, edit, delete, and moderate both event types.
2. **Hosts** can create both community events and activities.
3. **Users** can create activities only.
4. **Visitors** can browse the feed and detail pages, but joining should require login unless the existing product already supports guest participation.
5. The creator of an event becomes its default organizer unless an organizer name override is entered.

---

## 5. User Stories and Expected Behaviors

### Discover events
**As a visitor**, I want to see upcoming events in the destination so that I can participate in local activities.

Implementation expectations:
- Feed loads upcoming items only by default.
- Items are sorted chronologically ascending.
- Past events are excluded from the main feed unless a dedicated past-events filter exists.
- Feed clearly labels whether an item is an event or activity.
- Feed shows attendance counts and primary metadata at a glance.

### Join event
**As a user**, I want to join an event easily so that the organizer knows I am attending.

Implementation expectations:
- Signed-in users can switch RSVP state from not attending to `going` or `maybe`.
- Users can leave an event, returning to no RSVP.
- Participant counts update immediately in UI and persist in backend.
- If capacity is reached, joining should be blocked or converted into a waitlist only if waitlist support already exists; otherwise, disable join and show a capacity message.

### Create event
**As a host**, I want to create an event so that others can discover and join it.

Implementation expectations:
- Hosts and admins can create `community_event` items.
- Form validation prevents incomplete or invalid submissions.
- Newly created items appear in the feed after publication.

### Create activity
**As a user**, I want to post a spontaneous activity so that others can join me.

Implementation expectations:
- Standard users can create `activity` items.
- Activity creation flow should be lightweight and mobile-friendly.
- Users must not be allowed to create `community_event` items unless they have Host or Admin role.

### My events
**As a signed-in user**, I want to see events I joined and created so that I can manage my participation.

Implementation expectations:
- Show at least two sections or tabs: `Attending` and `Created`.
- Empty states should explain what to do next.
- Cancelled events should remain visible with a status indicator if the user already joined or created them.

---

## 6. Information Architecture

At minimum, implement or specify these screens/routes.

### 6.1 Event feed
Purpose: central discovery surface for upcoming events and activities.

Required content per card:
- title,
- organizer/host name,
- date,
- time,
- location,
- type badge (`Event` or `Activity`),
- participant count (`going`, and optionally `maybe`),
- attendance state for current user if available.

Recommended controls:
- CTA to open detail page,
- floating or header action to create an event/activity,
- optional filters for type/date.

### 6.2 Event detail page
Purpose: full detail and participation management.

Required content:
- title,
- description,
- organizer,
- date,
- time,
- location,
- event type,
- attendee counts,
- participant list or participant summary,
- join/leave actions.

Recommended controls:
- `Going` and `Maybe` actions,
- leave/cancel RSVP action,
- edit/delete actions when permitted,
- share action if already available elsewhere in product.

### 6.3 Create/edit event form
Required inputs:
- title,
- description,
- date,
- time,
- location,
- type selector.

Optional inputs:
- image,
- maximum participants,
- organizer display name.

Behavior:
- Role-aware form options.
- If user cannot create community events, hide or disable that option.
- Prevent date/time in the past.
- Validate title/description length.
- Allow editing only where permitted.

### 6.4 My events
Required sections:
- events/activities created by the user,
- events/activities the user joined or marked maybe.

Recommended metadata:
- status chip,
- RSVP state chip,
- date/time,
- quick action to open detail.

---

## 7. Functional Requirements

### 7.1 Feed behavior
1. Show all upcoming `published` events and activities for the active destination/context.
2. Sort by event start datetime ascending.
3. Display a mixed feed, not separate pages, unless design requires tabs.
4. Show a clear badge or icon for event type.
5. Exclude cancelled events from public discovery by default.
6. Handle empty state with messaging such as “No upcoming events yet.”
7. Support pagination, cursor loading, or lazy loading if event volumes may grow.

### 7.2 Event detail behavior
1. Open from feed card tap/click.
2. Show full event description.
3. Show organizer identity.
4. Show location text in readable form.
5. Show exact date and time in locale-aware format.
6. Show participant counts.
7. Show RSVP controls for authenticated users.
8. Prevent RSVP changes for cancelled or completed events.
9. Show moderation/admin actions only to authorized roles.

### 7.3 RSVP behavior
1. A user can have only one RSVP state per event at a time.
2. Updating RSVP replaces any previous RSVP for that event.
3. Leaving removes the RSVP entry.
4. Counts update transactionally to avoid duplication.
5. Organizer is counted as `going` by default if product logic supports that cleanly; otherwise leave organizer separate but ensure consistency.
6. Maximum participant limit applies to `going`, not `maybe`, unless product chooses stricter enforcement.
7. If an event is full, block additional `going` RSVPs and explain why.

### 7.4 Create event/activity behavior
1. Validate all required fields before submission.
2. Enforce role restrictions server-side and not only in UI.
3. Persist event type.
4. Store combined date/time as a timezone-aware timestamp if backend supports it.
5. Save optional image and capacity only when provided.
6. Default status to `published` for MVP unless moderation approval is required elsewhere in the platform.
7. Redirect to detail page or show success state after creation.

### 7.5 Edit/delete/moderate behavior
1. Admins can edit or delete any event.
2. Creators can edit their own permitted records if edit is included in MVP.
3. Deleting should be soft delete where possible, or a `cancelled` state if historical analytics matter.
4. Moderation actions should be logged if the platform already has audit logging.
5. If hard delete is used, remove related RSVP records safely.

### 7.6 My events behavior
1. Query based on current user.
2. Include future events first; optionally group past items separately.
3. Show whether the user is organizer, `going`, or `maybe`.
4. Include cancelled status when applicable.

---

## 8. Data Model Guidance

Implement using existing architecture, but the resulting schema should represent at least the following concepts.

### 8.1 `events`
Suggested fields:
- `id`
- `destination_id` or equivalent scope field
- `type` (`community_event` | `activity`)
- `status` (`published` | `cancelled` | `completed`)
- `title`
- `description`
- `location_name`
- `starts_at`
- `ends_at` (optional)
- `timezone` (optional but recommended)
- `image_url` (optional)
- `max_participants` (optional)
- `organizer_user_id` (nullable if external organizer)
- `organizer_name` (display override)
- `created_by_user_id`
- `created_at`
- `updated_at`
- `deleted_at` (optional)

### 8.2 `event_participants`
Suggested fields:
- `id`
- `event_id`
- `user_id`
- `rsvp_status` (`going` | `maybe`)
- `created_at`
- `updated_at`

Constraints:
- unique composite index on (`event_id`, `user_id`)
- foreign keys to event and user tables

### 8.3 Derived/computed fields
Avoid storing denormalized counts unless necessary. Prefer computed counts or materialized counters only if performance demands it.

Potential computed values:
- `going_count`
- `maybe_count`
- `is_joined_by_current_user`
- `current_user_rsvp_status`
- `is_full`

---

## 9. API / Service Requirements

Adapt naming to the stack, but ensure the platform exposes capabilities equivalent to the following.

### Read endpoints/services
- list upcoming events
- get event by id
- list my created events
- list my joined events

### Mutation endpoints/services
- create event
- update event
- delete/cancel event
- RSVP to event (`going` or `maybe`)
- remove RSVP

### Backend rules
- Enforce permissions in backend authorization layer.
- Validate required fields and data types.
- Reject creation of `community_event` by unauthorized users.
- Reject RSVP for unpublished/cancelled/completed items.
- Reject duplicate participant records.

---

## 10. UX and Visual Guidance

Use the provided mockup as directional guidance rather than a pixel-perfect requirement unless a design system already exists.

### Feed card expectations
- soft, readable card layout,
- strong event title,
- secondary host line,
- icon + date/time row,
- icon + location row,
- subtle badge for RSVP state or event type,
- attendance summary at bottom.

### Detail screen expectations
- large event title,
- clear host attribution,
- section dividers,
- metadata stack for date/time/location,
- readable long description,
- attendee counts and RSVP controls anchored near bottom on mobile.

### Create flow expectations
- as few steps as possible,
- optimized for mobile first,
- event type selection near top,
- instant validation feedback,
- visible submission success state.

### Empty states
Provide thoughtful empty states for:
- no upcoming events,
- no joined events,
- no created events,
- no permission to create community events.

---

## 11. Validation Rules

### Required validation
- title is required,
- description is required,
- date is required,
- time is required,
- location is required,
- type is required.

### Recommended constraints
- title: 3 to 100 characters,
- description: 10 to 2000 characters,
- organizer name: 2 to 100 characters when provided,
- max participants: positive integer,
- start datetime must be in the future,
- if end time exists, it must be after start time.

### Safety/content validation
- trim whitespace,
- reject empty rich text content,
- sanitize image/file metadata if uploads are supported,
- apply any existing profanity/content rules to title and description.

---

## 12. Moderation Requirements

Admins must be able to:
- edit event details,
- delete or cancel inappropriate events,
- remove inappropriate user-created content.

Recommended moderation implementation order:
1. Admin edit and delete from detail screen or admin tools.
2. Optional reporting hook if reporting system already exists.
3. Audit trail if platform supports it.

If moderation tooling is minimal in MVP, admin-only edit/delete controls on the event detail page are sufficient.

---

## 13. Analytics and Tracking

Track the following product events if analytics infrastructure exists:
- `events_feed_viewed`
- `event_detail_viewed`
- `event_created`
- `activity_created`
- `event_rsvp_set`
- `event_rsvp_removed`
- `my_events_viewed`
- `event_deleted`
- `event_cancelled`

Suggested event properties:
- event id,
- event type,
- creator role,
- destination id,
- RSVP status,
- participant count at time of action.

---

## 14. Edge Cases to Handle

1. User tries to create a community event without Host/Admin role.
2. User tries to join a full event.
3. Event start time is already in the past.
4. Event is cancelled after users have joined.
5. Organizer name is provided but organizer user account also exists.
6. User changes RSVP from `maybe` to `going` when capacity is nearly full.
7. Deleted user or missing organizer reference should still render organizer text gracefully.
8. Multiple rapid RSVP taps should not create duplicate records.
9. Feed item with missing optional image should still render correctly.
10. Timezone differences between creator and destination must not shift the displayed event time incorrectly.

---

## 15. Non-Goals for MVP

Do **not** expand scope unless the existing platform already makes these nearly free:
- recurring events,
- ticketing or payments,
- waitlists,
- private/invite-only events,
- advanced chat/threading,
- calendar sync,
- external host management portals,
- recommendation algorithms.

The mockup displays an “Event Chat” affordance. Treat chat as **out of MVP scope** unless chat already exists and the integration is trivial.

---

## 16. Acceptance Criteria

The feature is MVP-complete when the following are true:

### Feed
- Users can open a feed of upcoming events and activities.
- The feed is sorted by chronological start time.
- Each feed item shows title, time, date, location, type, and participant counts.

### Detail
- Users can open a detail page with full event information.
- Authenticated users can RSVP as `going` or `maybe`, or remove RSVP.
- Counts update correctly after RSVP changes.

### Create
- Hosts/Admins can create community events.
- Users/Hosts/Admins can create activities.
- Required fields are validated.
- Newly created records are visible in the feed and detail view.

### My Events
- Signed-in users can see events they created.
- Signed-in users can see events they joined or marked maybe.

### Permissions and moderation
- Unauthorized users cannot create restricted event types.
- Admins can edit/delete moderate content.
- Backend authorization enforces role rules.

---

## 17. Recommended Delivery Sequence for a Coding Agent

1. Inspect existing routing, auth, roles, and domain conventions.
2. Add or extend event data models and migrations.
3. Implement read services/endpoints for feed, detail, and my-events.
4. Implement create/update/delete services with permission checks.
5. Implement RSVP persistence and count logic.
6. Build event feed UI.
7. Build detail UI with RSVP actions.
8. Build create/edit form with role-aware type selection.
9. Build my-events screen.
10. Add analytics hooks.
11. Add tests for permissions, validation, sorting, and RSVP state transitions.
12. Run end-to-end smoke validation across all supported roles.

---

## 18. Execution Prompt for Coding Agents

Use the prompt below when assigning implementation to a coding agent.

### Agent prompt

```text
Implement the Events MVP end to end in this codebase.

Feature summary:
- Build a unified Events system with two event types: `community_event` and `activity`.
- Community events are formal/planned and may only be created by Admins and Hosts.
- Activities are informal/spontaneous and may be created by Admins, Hosts, and standard Users.
- Visitors can browse upcoming events, but authentication is required to RSVP unless the existing app already supports guest participation.

Required product functionality:
1. Event feed
   - Show upcoming published events and activities in one chronological feed.
   - Each item must display title, organizer, date, time, location, type, and participant counts.
   - Exclude cancelled events from public feed by default.
2. Event detail page
   - Show title, description, organizer, location, date/time, type, participant counts, and RSVP controls.
   - Authenticated users must be able to set RSVP to `going` or `maybe`, and remove their RSVP.
3. Create event/activity
   - Required fields: title, description, date, time, location, type.
   - Optional fields: image, max participants, organizer name.
   - Enforce permissions server-side: only Admin/Host can create `community_event`; Admin/Host/User can create `activity`.
4. My events
   - Show items the current user created.
   - Show items the current user joined or marked maybe.
5. Moderation
   - Admins can edit and delete/cancel any event.

Implementation requirements:
- Reuse existing architecture, styling system, auth, and role conventions.
- Add backend validation and authorization; do not rely only on UI restrictions.
- Use a single event domain model with a required `type` field.
- Store RSVP in a separate participant relation with one RSVP per user per event.
- Prevent duplicate RSVPs and invalid role-based creation.
- Sort feed by start datetime ascending.
- Prevent joining cancelled/completed events.
- Respect capacity if `max_participants` is set.
- Keep scope MVP-focused: do not add payments, recurring events, waitlists, or advanced chat unless already present and trivial.

Suggested schema shape:
- events: id, type, status, title, description, location_name, starts_at, image_url, max_participants, organizer_user_id, organizer_name, created_by_user_id, created_at, updated_at
- event_participants: id, event_id, user_id, rsvp_status, created_at, updated_at

Required tests:
- permission tests for event creation by role,
- validation tests for required fields,
- chronological sorting tests for the feed,
- RSVP transition tests (`none -> maybe`, `maybe -> going`, `going -> none`),
- capacity enforcement tests,
- admin moderation tests.

Deliverables:
- data model / migration changes,
- API/service changes,
- UI screens/components for feed, detail, create, and my-events,
- automated tests,
- concise implementation notes in the final response summarizing key decisions and any follow-up work.
```

---

## 19. Definition of Done Checklist

Use this checklist during QA or handoff.

- [ ] Event feed exists and is chronologically sorted.
- [ ] Feed cards display required metadata.
- [ ] Detail page displays full event information.
- [ ] Signed-in users can RSVP `going` and `maybe`.
- [ ] Users can remove RSVP.
- [ ] Hosts/Admins can create community events.
- [ ] Users can create activities only.
- [ ] Required fields are validated in UI and backend.
- [ ] My Events screen shows created and joined items.
- [ ] Admin can edit/delete moderate content.
- [ ] Cancelled/completed events cannot be joined.
- [ ] Analytics hooks are added if analytics infrastructure exists.
- [ ] Automated tests cover permissions, validation, sorting, RSVP, and moderation.

---

## 20. Notes for Future Iterations

Possible post-MVP enhancements:
- waitlist support,
- recurring events,
- host approval workflows,
- event chat,
- sharing and calendar export,
- map-based discovery,
- richer attendee list controls,
- reminders and notifications,
- reporting and moderation queue.
