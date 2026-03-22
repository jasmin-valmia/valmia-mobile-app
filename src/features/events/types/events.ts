import type { Database } from '@/types/database';

export type EventRow = Database['public']['Tables']['events']['Row'];
export type EventParticipantRow = Database['public']['Tables']['event_participants']['Row'];

export type EventFeedItem = EventRow & {
  goingCount: number;
  maybeCount: number;
  currentUserRsvpStatus: EventParticipantRow['rsvp_status'] | null;
};
