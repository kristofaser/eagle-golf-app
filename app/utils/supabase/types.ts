export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      amateur_profiles: {
        Row: {
          budget_range: string | null;
          created_at: string | null;
          experience_level: string | null;
          handicap: number | null;
          preferred_game_duration: number | null;
          preferred_play_style: string[] | null;
          user_id: string;
        };
        Insert: {
          budget_range?: string | null;
          created_at?: string | null;
          experience_level?: string | null;
          handicap?: number | null;
          preferred_game_duration?: number | null;
          preferred_play_style?: string[] | null;
          user_id: string;
        };
        Update: {
          budget_range?: string | null;
          created_at?: string | null;
          experience_level?: string | null;
          handicap?: number | null;
          preferred_game_duration?: number | null;
          preferred_play_style?: string[] | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'amateur_profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      bookings: {
        Row: {
          amateur_id: string;
          availability_id: string;
          booking_date: string;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          completed_at: string | null;
          confirmed_at: string | null;
          created_at: string | null;
          estimated_duration: number | null;
          golf_course_id: string;
          id: string;
          number_of_players: number | null;
          platform_fee: number;
          pro_fee: number;
          pro_id: string;
          special_requests: string | null;
          start_time: string;
          status: string | null;
          total_amount: number;
        };
        Insert: {
          amateur_id: string;
          availability_id: string;
          booking_date: string;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          completed_at?: string | null;
          confirmed_at?: string | null;
          created_at?: string | null;
          estimated_duration?: number | null;
          golf_course_id: string;
          id?: string;
          number_of_players?: number | null;
          platform_fee: number;
          pro_fee: number;
          pro_id: string;
          special_requests?: string | null;
          start_time: string;
          status?: string | null;
          total_amount: number;
        };
        Update: {
          amateur_id?: string;
          availability_id?: string;
          booking_date?: string;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          completed_at?: string | null;
          confirmed_at?: string | null;
          created_at?: string | null;
          estimated_duration?: number | null;
          golf_course_id?: string;
          id?: string;
          number_of_players?: number | null;
          platform_fee?: number;
          pro_fee?: number;
          pro_id?: string;
          special_requests?: string | null;
          start_time?: string;
          status?: string | null;
          total_amount?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'bookings_amateur_id_fkey';
            columns: ['amateur_id'];
            isOneToOne: false;
            referencedRelation: 'amateur_profiles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'bookings_availability_id_fkey';
            columns: ['availability_id'];
            isOneToOne: false;
            referencedRelation: 'pro_availabilities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_golf_course_id_fkey';
            columns: ['golf_course_id'];
            isOneToOne: false;
            referencedRelation: 'golf_parcours';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_pro_id_fkey';
            columns: ['pro_id'];
            isOneToOne: false;
            referencedRelation: 'pro_profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      golf_courses: {
        Row: {
          active: boolean | null;
          address: string;
          amenities: string[] | null;
          booking_required: boolean | null;
          city: string;
          country: string | null;
          created_at: string | null;
          description: string | null;
          email: string | null;
          green_fee_weekday: number | null;
          green_fee_weekend: number | null;
          hole_count: number | null;
          id: string;
          images: string[] | null;
          location: unknown | null;
          name: string;
          par: number | null;
          phone: string | null;
          postal_code: string | null;
          website: string | null;
        };
        Insert: {
          active?: boolean | null;
          address: string;
          amenities?: string[] | null;
          booking_required?: boolean | null;
          city: string;
          country?: string | null;
          created_at?: string | null;
          description?: string | null;
          email?: string | null;
          green_fee_weekday?: number | null;
          green_fee_weekend?: number | null;
          hole_count?: number | null;
          id?: string;
          images?: string[] | null;
          location?: unknown | null;
          name: string;
          par?: number | null;
          phone?: string | null;
          postal_code?: string | null;
          website?: string | null;
        };
        Update: {
          active?: boolean | null;
          address?: string;
          amenities?: string[] | null;
          booking_required?: boolean | null;
          city?: string;
          country?: string | null;
          created_at?: string | null;
          description?: string | null;
          email?: string | null;
          green_fee_weekday?: number | null;
          green_fee_weekend?: number | null;
          hole_count?: number | null;
          id?: string;
          images?: string[] | null;
          location?: unknown | null;
          name?: string;
          par?: number | null;
          phone?: string | null;
          postal_code?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      golf_parcours: {
        Row: {
          city: string;
          created_at: string | null;
          department: string | null;
          description: string | null;
          email: string | null;
          holes_count: number | null;
          id: string;
          latitude: number | null;
          longitude: number | null;
          location: unknown | null;
          name: string;
          phone: string | null;
          postal_code: string | null;
          updated_at: string | null;
          website: string | null;
        };
        Insert: {
          city: string;
          created_at?: string | null;
          department?: string | null;
          description?: string | null;
          email?: string | null;
          holes_count?: number | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          location?: unknown | null;
          name: string;
          phone?: string | null;
          postal_code?: string | null;
          updated_at?: string | null;
          website?: string | null;
        };
        Update: {
          city?: string;
          created_at?: string | null;
          department?: string | null;
          description?: string | null;
          email?: string | null;
          holes_count?: number | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          location?: unknown | null;
          name?: string;
          phone?: string | null;
          postal_code?: string | null;
          updated_at?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount: number;
          booking_id: string;
          created_at: string | null;
          currency: string | null;
          id: string;
          payment_method: string | null;
          processed_at: string | null;
          refunded_at: string | null;
          status: string | null;
          stripe_payment_intent_id: string | null;
        };
        Insert: {
          amount: number;
          booking_id: string;
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          payment_method?: string | null;
          processed_at?: string | null;
          refunded_at?: string | null;
          status?: string | null;
          stripe_payment_intent_id?: string | null;
        };
        Update: {
          amount?: number;
          booking_id?: string;
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          payment_method?: string | null;
          processed_at?: string | null;
          refunded_at?: string | null;
          status?: string | null;
          stripe_payment_intent_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'payments_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
        ];
      };
      pro_availabilities: {
        Row: {
          created_at: string | null;
          current_bookings: number | null;
          date: string;
          end_time: string;
          golf_course_id: string;
          id: string;
          is_recurring: boolean | null;
          max_players: number | null;
          notes: string | null;
          pro_id: string;
          recurrence_pattern: string | null;
          special_rate: number | null;
          start_time: string;
        };
        Insert: {
          created_at?: string | null;
          current_bookings?: number | null;
          date: string;
          end_time: string;
          golf_course_id: string;
          id?: string;
          is_recurring?: boolean | null;
          max_players?: number | null;
          notes?: string | null;
          pro_id: string;
          recurrence_pattern?: string | null;
          special_rate?: number | null;
          start_time: string;
        };
        Update: {
          created_at?: string | null;
          current_bookings?: number | null;
          date?: string;
          end_time?: string;
          golf_course_id?: string;
          id?: string;
          is_recurring?: boolean | null;
          max_players?: number | null;
          notes?: string | null;
          pro_id?: string;
          recurrence_pattern?: string | null;
          special_rate?: number | null;
          start_time?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pro_availabilities_golf_course_id_fkey';
            columns: ['golf_course_id'];
            isOneToOne: false;
            referencedRelation: 'golf_parcours';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pro_availabilities_pro_id_fkey';
            columns: ['pro_id'];
            isOneToOne: false;
            referencedRelation: 'pro_profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      pro_profiles: {
        Row: {
          can_travel: boolean | null;
          created_at: string | null;
          date_of_birth: string | null;
          division: string;
          siret: string | null;
          company_status: string | null;
          golf_affiliations: string[] | null;
          experience: Json | null;
          world_ranking: number | null;
          is_globally_available: boolean | null;
          unavailable_reason: string | null;
          skill_chipping: number | null;
          skill_driving: number | null;
          skill_irons: number | null;
          skill_mental: number | null;
          skill_putting: number | null;
          skill_wedging: number | null;
          travel_radius_km: number | null;
          user_id: string;
        };
        Insert: {
          can_travel?: boolean | null;
          created_at?: string | null;
          date_of_birth?: string | null;
          division: string;
          siret?: string | null;
          company_status?: string | null;
          golf_affiliations?: string[] | null;
          experience?: Json | null;
          world_ranking?: number | null;
          is_globally_available?: boolean | null;
          unavailable_reason?: string | null;
          skill_chipping?: number | null;
          skill_driving?: number | null;
          skill_irons?: number | null;
          skill_mental?: number | null;
          skill_putting?: number | null;
          skill_wedging?: number | null;
          travel_radius_km?: number | null;
          user_id: string;
        };
        Update: {
          can_travel?: boolean | null;
          created_at?: string | null;
          date_of_birth?: string | null;
          division?: string;
          siret?: string | null;
          company_status?: string | null;
          golf_affiliations?: string[] | null;
          experience?: Json | null;
          world_ranking?: number | null;
          is_globally_available?: boolean | null;
          unavailable_reason?: string | null;
          skill_chipping?: number | null;
          skill_driving?: number | null;
          skill_irons?: number | null;
          skill_mental?: number | null;
          skill_putting?: number | null;
          skill_wedging?: number | null;
          travel_radius_km?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pro_profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          city: string | null;
          created_at: string | null;
          email: string | null;
          first_name: string;
          id: string;
          last_name: string;
          phone: string | null;
          updated_at: string | null;
          user_type: string;
        };
        Insert: {
          avatar_url?: string | null;
          city?: string | null;
          created_at?: string | null;
          email?: string | null;
          first_name: string;
          id: string;
          last_name: string;
          phone?: string | null;
          updated_at?: string | null;
          user_type: string;
        };
        Update: {
          avatar_url?: string | null;
          city?: string | null;
          created_at?: string | null;
          email?: string | null;
          first_name?: string;
          id?: string;
          last_name?: string;
          phone?: string | null;
          updated_at?: string | null;
          user_type?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          booking_id: string;
          comment: string | null;
          created_at: string | null;
          friendliness_rating: number | null;
          id: string;
          photos: string[] | null;
          punctuality_rating: number | null;
          rating: number;
          reviewee_id: string;
          reviewer_id: string;
          skill_rating: number | null;
          would_play_again: boolean | null;
        };
        Insert: {
          booking_id: string;
          comment?: string | null;
          created_at?: string | null;
          friendliness_rating?: number | null;
          id?: string;
          photos?: string[] | null;
          punctuality_rating?: number | null;
          rating: number;
          reviewee_id: string;
          reviewer_id: string;
          skill_rating?: number | null;
          would_play_again?: boolean | null;
        };
        Update: {
          booking_id?: string;
          comment?: string | null;
          created_at?: string | null;
          friendliness_rating?: number | null;
          id?: string;
          photos?: string[] | null;
          punctuality_rating?: number | null;
          rating?: number;
          reviewee_id?: string;
          reviewer_id?: string;
          skill_rating?: number | null;
          would_play_again?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reviews_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_reviewee_id_fkey';
            columns: ['reviewee_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_reviewer_id_fkey';
            columns: ['reviewer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
