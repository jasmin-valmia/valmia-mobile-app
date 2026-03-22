export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      destinations: {
        Row: {
          id: string;
          slug: string;
          name: string;
          country_code: string | null;
          timezone: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          country_code?: string | null;
          timezone: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['destinations']['Insert']>;
      };
      events: {
        Row: {
          id: string;
          destination_id: string;
          type: 'community_event' | 'activity';
          status: 'draft' | 'published' | 'cancelled' | 'completed';
          visibility: 'public' | 'unlisted' | 'private';
          title: string;
          description: string;
          location_name: string;
          location_address: string | null;
          starts_at: string;
          ends_at: string | null;
          timezone: string;
          max_participants: number | null;
          organizer_name: string | null;
          cover_image_path: string | null;
          created_by_user_id: string;
          organizer_user_id: string | null;
          created_at: string;
          updated_at: string;
          cancelled_at: string | null;
          completed_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          destination_id: string;
          type: 'community_event' | 'activity';
          status?: 'draft' | 'published' | 'cancelled' | 'completed';
          visibility?: 'public' | 'unlisted' | 'private';
          title: string;
          description: string;
          location_name: string;
          location_address?: string | null;
          starts_at: string;
          ends_at?: string | null;
          timezone: string;
          max_participants?: number | null;
          organizer_name?: string | null;
          cover_image_path?: string | null;
          created_by_user_id: string;
          organizer_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
          cancelled_at?: string | null;
          completed_at?: string | null;
          deleted_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
      event_participants: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          rsvp_status: 'going' | 'maybe';
          joined_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          rsvp_status: 'going' | 'maybe';
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['event_participants']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          role: 'admin' | 'host' | 'user';
          display_name: string | null;
          avatar_url: string | null;
          home_destination_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: 'admin' | 'host' | 'user';
          display_name?: string | null;
          avatar_url?: string | null;
          home_destination_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: 'admin' | 'host' | 'user';
      event_rsvp_status: 'going' | 'maybe';
      event_status: 'draft' | 'published' | 'cancelled' | 'completed';
      event_type: 'community_event' | 'activity';
      event_visibility: 'public' | 'unlisted' | 'private';
    };
  };
};
