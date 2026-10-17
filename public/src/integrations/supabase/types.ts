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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      api_key_usage: {
        Row: {
          count: number
          day: string
          key_id: string
        }
        Insert: {
          count?: number
          day: string
          key_id: string
        }
        Update: {
          count?: number
          day?: string
          key_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_key_usage_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          key: string
          project_name: string
          rate_limit: number
          revoked: boolean
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          project_name: string
          rate_limit?: number
          revoked?: boolean
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          project_name?: string
          rate_limit?: number
          revoked?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          adzuna_cache_minutes: number
          adzuna_enabled: boolean
          bacheca_enabled: boolean
          business_area_enabled: boolean
          cv_enabled: boolean
          id: number
          job_offers_enabled: boolean
          offer_auto_expire: boolean
          offer_auto_publish: boolean
          offer_days: number
          offer_premium_price_cents: number
          offer_price_cents: number
          offer_price_mode: string
          offer_publish_mode: string
          offers_free: boolean
          reviews_deletable: boolean
          reviews_require_login: boolean
          survey_ai_enabled: boolean
          updated_at: string
        }
        Insert: {
          adzuna_cache_minutes?: number
          adzuna_enabled?: boolean
          bacheca_enabled?: boolean
          business_area_enabled?: boolean
          cv_enabled?: boolean
          id?: number
          job_offers_enabled?: boolean
          offer_auto_expire?: boolean
          offer_auto_publish?: boolean
          offer_days?: number
          offer_premium_price_cents?: number
          offer_price_cents?: number
          offer_price_mode?: string
          offer_publish_mode?: string
          offers_free?: boolean
          reviews_deletable?: boolean
          reviews_require_login?: boolean
          survey_ai_enabled?: boolean
          updated_at?: string
        }
        Update: {
          adzuna_cache_minutes?: number
          adzuna_enabled?: boolean
          bacheca_enabled?: boolean
          business_area_enabled?: boolean
          cv_enabled?: boolean
          id?: number
          job_offers_enabled?: boolean
          offer_auto_expire?: boolean
          offer_auto_publish?: boolean
          offer_days?: number
          offer_premium_price_cents?: number
          offer_price_cents?: number
          offer_price_mode?: string
          offer_publish_mode?: string
          offers_free?: boolean
          reviews_deletable?: boolean
          reviews_require_login?: boolean
          survey_ai_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      availability_contact_requests: {
        Row: {
          created_at: string
          id: string
          ip: string | null
          listing_id: string
          message: string | null
          owner_id: string | null
          requester_id: string
          requester_phone: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip?: string | null
          listing_id: string
          message?: string | null
          owner_id?: string | null
          requester_id: string
          requester_phone: string
        }
        Update: {
          created_at?: string
          id?: string
          ip?: string | null
          listing_id?: string
          message?: string | null
          owner_id?: string | null
          requester_id?: string
          requester_phone?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          avg_score: number
          city: string | null
          country: string
          created_at: string
          external_id: string | null
          full_address: string | null
          has_meal: boolean
          has_welfare: boolean
          id: string
          is_auto_created: boolean
          is_headquarter: boolean
          lat: number | null
          legal_name: string | null
          lng: number | null
          meal_override: boolean | null
          meal_provider_override: string | null
          meal_value_override: string | null
          name: string
          parent_brand: string | null
          place_id: string | null
          province: string | null
          region: string | null
          review_count: number
          sector: string | null
          source: string
          store_code: string | null
          trend: number
          vat: string | null
          verified_count: number
          website_domain: string | null
          welfare_items_override: string[] | null
          welfare_override: boolean | null
        }
        Insert: {
          address?: string | null
          avg_score?: number
          city?: string | null
          country?: string
          created_at?: string
          external_id?: string | null
          full_address?: string | null
          has_meal?: boolean
          has_welfare?: boolean
          id?: string
          is_auto_created?: boolean
          is_headquarter?: boolean
          lat?: number | null
          legal_name?: string | null
          lng?: number | null
          meal_override?: boolean | null
          meal_provider_override?: string | null
          meal_value_override?: string | null
          name: string
          parent_brand?: string | null
          place_id?: string | null
          province?: string | null
          region?: string | null
          review_count?: number
          sector?: string | null
          source?: string
          store_code?: string | null
          trend?: number
          vat?: string | null
          verified_count?: number
          website_domain?: string | null
          welfare_items_override?: string[] | null
          welfare_override?: boolean | null
        }
        Update: {
          address?: string | null
          avg_score?: number
          city?: string | null
          country?: string
          created_at?: string
          external_id?: string | null
          full_address?: string | null
          has_meal?: boolean
          has_welfare?: boolean
          id?: string
          is_auto_created?: boolean
          is_headquarter?: boolean
          lat?: number | null
          legal_name?: string | null
          lng?: number | null
          meal_override?: boolean | null
          meal_provider_override?: string | null
          meal_value_override?: string | null
          name?: string
          parent_brand?: string | null
          place_id?: string | null
          province?: string | null
          region?: string | null
          review_count?: number
          sector?: string | null
          source?: string
          store_code?: string | null
          trend?: number
          vat?: string | null
          verified_count?: number
          website_domain?: string | null
          welfare_items_override?: string[] | null
          welfare_override?: boolean | null
        }
        Relationships: []
      }
      company_accounts: {
        Row: {
          company_id: string | null
          company_name: string
          created_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          company_name: string
          created_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          company_name?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_replies: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_verified: boolean
          reply_text: string
          review_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_verified?: boolean
          reply_text: string
          review_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_verified?: boolean
          reply_text?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_replies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_replies_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_email: string
          sender_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_email: string
          sender_name: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_email?: string
          sender_name?: string
        }
        Relationships: []
      }
      disponibilita: {
        Row: {
          created_at: string
          cv_path: string | null
          descrizione: string
          email_contatto: string | null
          expires_at: string
          id: string
          is_active: boolean
          mansione: string
          nome_visualizzato: string
          telefono: string | null
          user_id: string
          zona: string
        }
        Insert: {
          created_at?: string
          cv_path?: string | null
          descrizione?: string
          email_contatto?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean
          mansione: string
          nome_visualizzato: string
          telefono?: string | null
          user_id?: string
          zona: string
        }
        Update: {
          created_at?: string
          cv_path?: string | null
          descrizione?: string
          email_contatto?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean
          mansione?: string
          nome_visualizzato?: string
          telefono?: string | null
          user_id?: string
          zona?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          email: string
          id: string
          province: string | null
          sent_at: string
          template: string
          user_id: string
        }
        Insert: {
          email: string
          id?: string
          province?: string | null
          sent_at?: string
          template: string
          user_id: string
        }
        Update: {
          email?: string
          id?: string
          province?: string | null
          sent_at?: string
          template?: string
          user_id?: string
        }
        Relationships: []
      }
      email_unsubscribes: {
        Row: {
          created_at: string
          id: string
          province: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          province: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          province?: string
          user_id?: string
        }
        Relationships: []
      }
      job_offer_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          offer_id: string
          sender_email: string
          sender_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          offer_id: string
          sender_email: string
          sender_name: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          offer_id?: string
          sender_email?: string
          sender_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_offer_messages_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "job_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      job_offers: {
        Row: {
          address: string | null
          agency_auth_code: string | null
          agency_name: string | null
          amount_cents: number | null
          apply_link: string | null
          city: string | null
          client_anonymous: boolean
          company_id: string | null
          contract_type: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_premium: boolean
          meal_vouchers: boolean
          moderation_status: string
          paid_until: string | null
          payment_status: string
          positions: number
          poster_company: string | null
          poster_email: string | null
          poster_phone: string | null
          poster_type: string
          refunded_at: string | null
          salary_max: number | null
          salary_min: number | null
          salary_range: string | null
          salary_visible: boolean
          source: string
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          agency_auth_code?: string | null
          agency_name?: string | null
          amount_cents?: number | null
          apply_link?: string | null
          city?: string | null
          client_anonymous?: boolean
          company_id?: string | null
          contract_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_premium?: boolean
          meal_vouchers?: boolean
          moderation_status?: string
          paid_until?: string | null
          payment_status?: string
          positions?: number
          poster_company?: string | null
          poster_email?: string | null
          poster_phone?: string | null
          poster_type?: string
          refunded_at?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_range?: string | null
          salary_visible?: boolean
          source?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          agency_auth_code?: string | null
          agency_name?: string | null
          amount_cents?: number | null
          apply_link?: string | null
          city?: string | null
          client_anonymous?: boolean
          company_id?: string | null
          contract_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_premium?: boolean
          meal_vouchers?: boolean
          moderation_status?: string
          paid_until?: string | null
          payment_status?: string
          positions?: number
          poster_company?: string | null
          poster_email?: string | null
          poster_phone?: string | null
          poster_type?: string
          refunded_at?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_range?: string | null
          salary_visible?: boolean
          source?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_offers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          marketing_consent: boolean
          notify_job_offers: boolean
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          marketing_consent?: boolean
          notify_job_offers?: boolean
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          marketing_consent?: boolean
          notify_job_offers?: boolean
        }
        Relationships: []
      }
      reply_requests: {
        Row: {
          company_id: string
          created_at: string
          id: string
          reply_text: string
          review_id: string
          sender_email: string
          sender_name: string
          sender_phone: string | null
          sender_role: string | null
          status: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          reply_text: string
          review_id: string
          sender_email: string
          sender_name: string
          sender_phone?: string | null
          sender_role?: string | null
          status?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          reply_text?: string
          review_id?: string
          sender_email?: string
          sender_name?: string
          sender_phone?: string | null
          sender_role?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reply_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reply_requests_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_otps: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          email_hash: string
          expires_at: string
          id: string
          used: boolean
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          email_hash: string
          expires_at: string
          id?: string
          used?: boolean
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          email_hash?: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Relationships: []
      }
      reviews: {
        Row: {
          advice: string | null
          company_id: string
          cons: string | null
          contract_type: string | null
          created_at: string
          device_hash: string | null
          email_hash: string | null
          helpful_count: number
          id: string
          is_anonymous: boolean
          is_verified: boolean
          lang: string
          meal_frequency: string | null
          meal_provider: string | null
          meal_value: string | null
          meal_vouchers: boolean | null
          period_from: string | null
          period_to: string | null
          pro: string | null
          role: string | null
          score_environment: number
          score_growth: number
          score_management: number
          score_meal_lodging: number | null
          score_notice: number | null
          score_overtime: number | null
          score_safety: number
          score_salary: number
          score_shifts: number
          score_tips: number | null
          sector: string | null
          status: string
          user_id: string | null
          verified_via: string | null
          welfare: boolean | null
          welfare_answer: string | null
          welfare_items: string[]
        }
        Insert: {
          advice?: string | null
          company_id: string
          cons?: string | null
          contract_type?: string | null
          created_at?: string
          device_hash?: string | null
          email_hash?: string | null
          helpful_count?: number
          id?: string
          is_anonymous?: boolean
          is_verified?: boolean
          lang?: string
          meal_frequency?: string | null
          meal_provider?: string | null
          meal_value?: string | null
          meal_vouchers?: boolean | null
          period_from?: string | null
          period_to?: string | null
          pro?: string | null
          role?: string | null
          score_environment: number
          score_growth: number
          score_management: number
          score_meal_lodging?: number | null
          score_notice?: number | null
          score_overtime?: number | null
          score_safety: number
          score_salary: number
          score_shifts: number
          score_tips?: number | null
          sector?: string | null
          status?: string
          user_id?: string | null
          verified_via?: string | null
          welfare?: boolean | null
          welfare_answer?: string | null
          welfare_items?: string[]
        }
        Update: {
          advice?: string | null
          company_id?: string
          cons?: string | null
          contract_type?: string | null
          created_at?: string
          device_hash?: string | null
          email_hash?: string | null
          helpful_count?: number
          id?: string
          is_anonymous?: boolean
          is_verified?: boolean
          lang?: string
          meal_frequency?: string | null
          meal_provider?: string | null
          meal_value?: string | null
          meal_vouchers?: boolean | null
          period_from?: string | null
          period_to?: string | null
          pro?: string | null
          role?: string | null
          score_environment?: number
          score_growth?: number
          score_management?: number
          score_meal_lodging?: number | null
          score_notice?: number | null
          score_overtime?: number | null
          score_safety?: number
          score_salary?: number
          score_shifts?: number
          score_tips?: number | null
          sector?: string | null
          status?: string
          user_id?: string | null
          verified_via?: string | null
          welfare?: boolean | null
          welfare_answer?: string | null
          welfare_items?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_answers: {
        Row: {
          option_index: number
          question_id: string
          response_id: string
          text_answer: string | null
        }
        Insert: {
          option_index: number
          question_id: string
          response_id: string
          text_answer?: string | null
        }
        Update: {
          option_index?: number
          question_id?: string
          response_id?: string
          text_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "survey_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          id: string
          kind: string
          options: string[]
          position: number
          survey_id: string
          text: string
        }
        Insert: {
          id?: string
          kind?: string
          options: string[]
          position?: number
          survey_id: string
          text: string
        }
        Update: {
          id?: string
          kind?: string
          options?: string[]
          position?: number
          survey_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          created_at: string
          device_hash: string
          id: string
          is_complete: boolean
          respondent_birth: string | null
          respondent_name: string | null
          survey_id: string
        }
        Insert: {
          created_at?: string
          device_hash: string
          id?: string
          is_complete?: boolean
          respondent_birth?: string | null
          respondent_name?: string | null
          survey_id: string
        }
        Update: {
          created_at?: string
          device_hash?: string
          id?: string
          is_complete?: boolean
          respondent_birth?: string | null
          respondent_name?: string | null
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          is_active: boolean
          mode: string
          owner_id: string
          started_at: string | null
          status: string
          title: string
          token: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          mode?: string
          owner_id?: string
          started_at?: string | null
          status?: string
          title: string
          token?: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          mode?: string
          owner_id?: string
          started_at?: string | null
          status?: string
          title?: string
          token?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          email_hash: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          email_hash?: string | null
          id?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          email_hash?: string | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      api_key_hit: { Args: { _key_id: string }; Returns: number }
      close_my_offer: { Args: { p_id: string }; Returns: boolean }
      delete_my_review: { Args: { p_id: string }; Returns: boolean }
      end_company_survey: { Args: { p_survey_id: string }; Returns: boolean }
      get_my_offers: {
        Args: never
        Returns: {
          amount_cents: number
          city: string
          created_at: string
          id: string
          is_active: boolean
          paid_until: string
          payment_status: string
          poster_company: string
          title: string
        }[]
      }
      get_my_reviews: {
        Args: never
        Returns: {
          advice: string
          company_city: string
          company_id: string
          company_name: string
          cons: string
          contract_type: string
          created_at: string
          helpful_count: number
          id: string
          is_verified: boolean
          period_from: string
          period_to: string
          pro: string
          role: string
          status: string
        }[]
      }
      get_public_survey: { Args: { p_token: string }; Returns: Json }
      purge_expired_free_listings: { Args: never; Returns: undefined }
      refresh_company_stats: { Args: { _cid: string }; Returns: undefined }
      renew_availability: {
        Args: { p_id: string }
        Returns: {
          expires_at: string
        }[]
      }
      save_survey_progress: {
        Args: {
          p_answers: Json
          p_birth?: string
          p_complete?: boolean
          p_device: string
          p_name?: string
          p_token: string
        }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      submit_survey:
        | {
            Args: { p_answers: Json; p_device: string; p_token: string }
            Returns: string
          }
        | {
            Args: {
              p_answers: Json
              p_birth?: string
              p_device: string
              p_name?: string
              p_token: string
            }
            Returns: string
          }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
