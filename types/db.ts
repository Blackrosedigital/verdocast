// ============================================================
// Supabase database types.
//
// In normal operation this file is GENERATED — run `pnpm gen-types`
// (which runs `supabase gen types typescript --local`) against a local
// Supabase instance with migrations applied. It is hand-maintained here
// to mirror supabase/migrations/0001_initial.sql so the app and tests are
// typed before a local DB exists. Keep it in sync with the migrations.
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          owner_email: string;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_email: string;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_email?: string;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      licenses: {
        Row: {
          id: string;
          organization_id: string;
          tier: Database["public"]["Enums"]["license_tier"];
          max_members: number;
          amount_paid_pence: number;
          currency: string;
          stripe_session_id: string | null;
          stripe_payment_intent: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          tier: Database["public"]["Enums"]["license_tier"];
          max_members: number;
          amount_paid_pence: number;
          currency?: string;
          stripe_session_id?: string | null;
          stripe_payment_intent?: string | null;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          tier?: Database["public"]["Enums"]["license_tier"];
          max_members?: number;
          amount_paid_pence?: number;
          currency?: string;
          stripe_session_id?: string | null;
          stripe_payment_intent?: string | null;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "licenses_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      leagues: {
        Row: {
          id: string;
          organization_id: string;
          license_id: string;
          name: string;
          slug: string;
          join_code: string;
          created_by_email: string;
          brand_color: string | null;
          brand_logo_url: string | null;
          scoring_rules: Json;
          prize: string | null;
          qualify_count: number;
          is_demo: boolean;
          deleted_at: string | null;
          season_id: string | null;
          start_matchday: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          license_id: string;
          name: string;
          slug: string;
          join_code: string;
          created_by_email: string;
          brand_color?: string | null;
          brand_logo_url?: string | null;
          scoring_rules?: Json;
          prize?: string | null;
          qualify_count?: number;
          is_demo?: boolean;
          deleted_at?: string | null;
          season_id?: string | null;
          start_matchday?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          license_id?: string;
          name?: string;
          slug?: string;
          join_code?: string;
          created_by_email?: string;
          brand_color?: string | null;
          brand_logo_url?: string | null;
          scoring_rules?: Json;
          prize?: string | null;
          qualify_count?: number;
          is_demo?: boolean;
          deleted_at?: string | null;
          season_id?: string | null;
          start_matchday?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leagues_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leagues_license_id_fkey";
            columns: ["license_id"];
            isOneToOne: false;
            referencedRelation: "licenses";
            referencedColumns: ["id"];
          },
        ];
      };
      members: {
        Row: {
          id: string;
          league_id: string;
          email: string;
          display_name: string;
          is_admin: boolean;
          referral_source: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          email: string;
          display_name: string;
          is_admin?: boolean;
          referral_source?: string | null;
          joined_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          email?: string;
          display_name?: string;
          is_admin?: boolean;
          referral_source?: string | null;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "members_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
        ];
      };
      matches: {
        Row: {
          id: string;
          match_code: string;
          kickoff_utc: string;
          stage: Database["public"]["Enums"]["match_stage"];
          group_letter: string | null;
          home_team: string | null;
          away_team: string | null;
          venue: string;
          venue_city: string;
          status: Database["public"]["Enums"]["match_status"];
          home_score: number | null;
          away_score: number | null;
          result: string | null;
          external_id: string | null;
          finalised_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          match_code: string;
          kickoff_utc: string;
          stage: Database["public"]["Enums"]["match_stage"];
          group_letter?: string | null;
          home_team?: string | null;
          away_team?: string | null;
          venue: string;
          venue_city: string;
          status?: Database["public"]["Enums"]["match_status"];
          home_score?: number | null;
          away_score?: number | null;
          result?: string | null;
          external_id?: string | null;
          finalised_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          match_code?: string;
          kickoff_utc?: string;
          stage?: Database["public"]["Enums"]["match_stage"];
          group_letter?: string | null;
          home_team?: string | null;
          away_team?: string | null;
          venue?: string;
          venue_city?: string;
          status?: Database["public"]["Enums"]["match_status"];
          home_score?: number | null;
          away_score?: number | null;
          result?: string | null;
          external_id?: string | null;
          finalised_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      predictions: {
        Row: {
          id: string;
          member_id: string;
          match_id: string;
          home_score: number;
          away_score: number;
          points_earned: number | null;
          submitted_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          match_id: string;
          home_score: number;
          away_score: number;
          points_earned?: number | null;
          submitted_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          match_id?: string;
          home_score?: number;
          away_score?: number;
          points_earned?: number | null;
          submitted_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "predictions_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            // Named for the column, which kept its name through 0007; the
            // constraint now points at `fixtures` (matches is a view over it).
            foreignKeyName: "predictions_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "fixtures";
            referencedColumns: ["id"];
          },
        ];
      };
      competitions: {
        Row: {
          id: string;
          sport: string;
          name: string;
          short_name: string | null;
          slug: string;
          kind: string;
          country: string | null;
          logo_url: string | null;
          provider: string;
          provider_competition_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sport?: string;
          name: string;
          short_name?: string | null;
          slug: string;
          kind: string;
          country?: string | null;
          logo_url?: string | null;
          provider?: string;
          provider_competition_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sport?: string;
          name?: string;
          short_name?: string | null;
          slug?: string;
          kind?: string;
          country?: string | null;
          logo_url?: string | null;
          provider?: string;
          provider_competition_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      seasons: {
        Row: {
          id: string;
          competition_id: string;
          label: string;
          starts_on: string | null;
          ends_on: string | null;
          status: string;
          total_matchdays: number | null;
          provider_season_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          competition_id: string;
          label: string;
          starts_on?: string | null;
          ends_on?: string | null;
          status?: string;
          total_matchdays?: number | null;
          provider_season_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          competition_id?: string;
          label?: string;
          starts_on?: string | null;
          ends_on?: string | null;
          status?: string;
          total_matchdays?: number | null;
          provider_season_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "seasons_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
        ];
      };
      teams: {
        Row: {
          id: string;
          sport: string;
          name: string;
          short_code: string | null;
          slug: string;
          country: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          crest_url: string | null;
          flag_emoji: string | null;
          provider: string;
          provider_team_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sport?: string;
          name: string;
          short_code?: string | null;
          slug: string;
          country?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          crest_url?: string | null;
          flag_emoji?: string | null;
          provider?: string;
          provider_team_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sport?: string;
          name?: string;
          short_code?: string | null;
          slug?: string;
          country?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          crest_url?: string | null;
          flag_emoji?: string | null;
          provider?: string;
          provider_team_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      matchday_reminders: {
        Row: {
          id: string;
          league_id: string;
          member_id: string;
          matchday: number;
          outstanding: number;
          sent_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          member_id: string;
          matchday: number;
          outstanding?: number;
          sent_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          member_id?: string;
          matchday?: number;
          outstanding?: number;
          sent_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "matchday_reminders_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matchday_reminders_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
        ];
      };
      fixtures: {
        Row: {
          id: string;
          season_id: string;
          stage: string;
          matchday: number | null;
          group_label: string | null;
          home_team_id: string | null;
          away_team_id: string | null;
          matchup: string | null;
          home_source_fixture_id: string | null;
          away_source_fixture_id: string | null;
          kickoff_utc: string;
          venue: string | null;
          venue_city: string | null;
          status: Database["public"]["Enums"]["match_status"];
          home_score: number | null;
          away_score: number | null;
          result: string | null;
          provider_fixture_id: string | null;
          code: string | null;
          finalised_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          stage: string;
          matchday?: number | null;
          group_label?: string | null;
          home_team_id?: string | null;
          away_team_id?: string | null;
          matchup?: string | null;
          home_source_fixture_id?: string | null;
          away_source_fixture_id?: string | null;
          kickoff_utc: string;
          venue?: string | null;
          venue_city?: string | null;
          status?: Database["public"]["Enums"]["match_status"];
          home_score?: number | null;
          away_score?: number | null;
          result?: string | null;
          provider_fixture_id?: string | null;
          code?: string | null;
          finalised_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          season_id?: string;
          stage?: string;
          matchday?: number | null;
          group_label?: string | null;
          home_team_id?: string | null;
          away_team_id?: string | null;
          matchup?: string | null;
          home_source_fixture_id?: string | null;
          away_source_fixture_id?: string | null;
          kickoff_utc?: string;
          venue?: string | null;
          venue_city?: string | null;
          status?: Database["public"]["Enums"]["match_status"];
          home_score?: number | null;
          away_score?: number | null;
          result?: string | null;
          provider_fixture_id?: string | null;
          code?: string | null;
          finalised_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fixtures_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      leaderboard: {
        Row: {
          league_id: string | null;
          member_id: string | null;
          display_name: string | null;
          email: string | null;
          total_points: number | null;
          matches_scored: number | null;
          exact_scores: number | null;
          total_predictions: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "members_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
        ];
      };
      matchday_points: {
        Row: {
          league_id: string | null;
          member_id: string | null;
          display_name: string | null;
          season_id: string | null;
          matchday: number | null;
          points: number | null;
          scored: number | null;
          exact_scores: number | null;
          predictions: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      license_tier: "starter" | "pro" | "team" | "enterprise";
      match_stage: "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final";
      match_status: "scheduled" | "live" | "finished" | "postponed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ---- Convenience helpers (mirrors the tail of supabase gen types) ----

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];

export type Views<T extends keyof PublicSchema["Views"]> =
  PublicSchema["Views"][T]["Row"];

export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T];
