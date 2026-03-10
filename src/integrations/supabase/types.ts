export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      article_tags: {
        Row: {
          article_id: string
          created_at: string
          id: string
          tag: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          tag: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_tags_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          created_at: string
          duplicate_group_id: string | null
          editor_notes: string | null
          freshness_bucket: Database["public"]["Enums"]["freshness_bucket"]
          id: string
          image_url: string | null
          imported_at: string
          is_duplicate: boolean
          neighborhood_guess: string | null
          published_at: string | null
          raw_location_text: string | null
          relevance_score: number
          source_id: string | null
          source_name: string | null
          status: Database["public"]["Enums"]["article_status"]
          summary: string | null
          title: string
          topic_guess: string | null
          url: string | null
          use_for_newsletter: boolean
          use_for_social: boolean
          why_it_matters: string | null
        }
        Insert: {
          created_at?: string
          duplicate_group_id?: string | null
          editor_notes?: string | null
          freshness_bucket?: Database["public"]["Enums"]["freshness_bucket"]
          id?: string
          image_url?: string | null
          imported_at?: string
          is_duplicate?: boolean
          neighborhood_guess?: string | null
          published_at?: string | null
          raw_location_text?: string | null
          relevance_score?: number
          source_id?: string | null
          source_name?: string | null
          status?: Database["public"]["Enums"]["article_status"]
          summary?: string | null
          title: string
          topic_guess?: string | null
          url?: string | null
          use_for_newsletter?: boolean
          use_for_social?: boolean
          why_it_matters?: string | null
        }
        Update: {
          created_at?: string
          duplicate_group_id?: string | null
          editor_notes?: string | null
          freshness_bucket?: Database["public"]["Enums"]["freshness_bucket"]
          id?: string
          image_url?: string | null
          imported_at?: string
          is_duplicate?: boolean
          neighborhood_guess?: string | null
          published_at?: string | null
          raw_location_text?: string | null
          relevance_score?: number
          source_id?: string | null
          source_name?: string | null
          status?: Database["public"]["Enums"]["article_status"]
          summary?: string | null
          title?: string
          topic_guess?: string | null
          url?: string | null
          use_for_newsletter?: boolean
          use_for_social?: boolean
          why_it_matters?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      neighborhoods: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      scan_runs: {
        Row: {
          articles_found: number
          completed_at: string | null
          created_at: string
          duplicates_found: number
          id: string
          started_at: string
        }
        Insert: {
          articles_found?: number
          completed_at?: string | null
          created_at?: string
          duplicates_found?: number
          id?: string
          started_at?: string
        }
        Update: {
          articles_found?: number
          completed_at?: string | null
          created_at?: string
          duplicates_found?: number
          id?: string
          started_at?: string
        }
        Relationships: []
      }
      shortlists: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      sources: {
        Row: {
          active: boolean
          base_url: string | null
          category: Database["public"]["Enums"]["source_category"]
          coverage_area: string | null
          created_at: string
          feed_url: string | null
          id: string
          last_checked_at: string | null
          name: string
          notes: string | null
          priority: number
          source_type: Database["public"]["Enums"]["source_type"]
        }
        Insert: {
          active?: boolean
          base_url?: string | null
          category?: Database["public"]["Enums"]["source_category"]
          coverage_area?: string | null
          created_at?: string
          feed_url?: string | null
          id?: string
          last_checked_at?: string | null
          name: string
          notes?: string | null
          priority?: number
          source_type?: Database["public"]["Enums"]["source_type"]
        }
        Update: {
          active?: boolean
          base_url?: string | null
          category?: Database["public"]["Enums"]["source_category"]
          coverage_area?: string | null
          created_at?: string
          feed_url?: string | null
          id?: string
          last_checked_at?: string | null
          name?: string
          notes?: string | null
          priority?: number
          source_type?: Database["public"]["Enums"]["source_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      article_status: "new" | "reviewed" | "saved" | "dismissed" | "shortlisted"
      freshness_bucket: "breaking" | "today" | "recent" | "older"
      source_category:
        | "major_news"
        | "hyperlocal_publisher"
        | "government"
        | "public_safety"
        | "transportation"
        | "schools"
        | "events"
        | "civic_planning"
        | "community_organizations"
      source_type: "rss" | "watchlist" | "manual"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      article_status: ["new", "reviewed", "saved", "dismissed", "shortlisted"],
      freshness_bucket: ["breaking", "today", "recent", "older"],
      source_category: [
        "major_news",
        "hyperlocal_publisher",
        "government",
        "public_safety",
        "transportation",
        "schools",
        "events",
        "civic_planning",
        "community_organizations",
      ],
      source_type: ["rss", "watchlist", "manual"],
    },
  },
} as const
