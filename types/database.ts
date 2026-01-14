export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'owner' | 'member'
export type PlanStatus = 'draft' | 'active' | 'completed' | 'cancelled'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'rescheduled'
export type TaskCategory = 'order' | 'dust' | 'surfaces' | 'floor' | 'trash' | 'laundry' | 'kitchen' | 'bathroom' | 'general'
export type DetailLevel = 'brief' | 'normal' | 'detailed'
export type CleaningStandard = 'quick' | 'deep'
export type SubscriptionTier = 'free' | 'premium'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'incomplete'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          subscription_tier: SubscriptionTier
          subscription_status: SubscriptionStatus | null
          stripe_customer_id: string | null
          trial_ends_at: string | null
          scans_this_month: number
          last_scan_reset: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: SubscriptionTier
          subscription_status?: SubscriptionStatus | null
          stripe_customer_id?: string | null
          trial_ends_at?: string | null
          scans_this_month?: number
          last_scan_reset?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: SubscriptionTier
          subscription_status?: SubscriptionStatus | null
          stripe_customer_id?: string | null
          trial_ends_at?: string | null
          scans_this_month?: number
          last_scan_reset?: string
          created_at?: string
          updated_at?: string
        }
      }
      homes: {
        Row: {
          id: string
          name: string
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      home_members: {
        Row: {
          id: string
          home_id: string
          user_id: string
          role: UserRole
          invited_email: string | null
          invite_token: string | null
          joined_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          home_id: string
          user_id?: string
          role?: UserRole
          invited_email?: string | null
          invite_token?: string | null
          joined_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          home_id?: string
          user_id?: string
          role?: UserRole
          invited_email?: string | null
          invite_token?: string | null
          joined_at?: string | null
          created_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          home_id: string
          name: string
          type: string
          icon: string | null
          size_hint: string | null
          sensitivity_tags: string[]
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          home_id: string
          name: string
          type: string
          icon?: string | null
          size_hint?: string | null
          sensitivity_tags?: string[]
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          home_id?: string
          name?: string
          type?: string
          icon?: string | null
          size_hint?: string | null
          sensitivity_tags?: string[]
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      room_zones: {
        Row: {
          id: string
          room_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          name?: string
          created_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          home_id: string
          detail_level: DetailLevel
          cleaning_standard: CleaningStandard
          restrictions: string[]
          minutes_per_day: number
          days_per_week: number[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          home_id: string
          detail_level?: DetailLevel
          cleaning_standard?: CleaningStandard
          restrictions?: string[]
          minutes_per_day?: number
          days_per_week?: number[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          home_id?: string
          detail_level?: DetailLevel
          cleaning_standard?: CleaningStandard
          restrictions?: string[]
          minutes_per_day?: number
          days_per_week?: number[]
          created_at?: string
          updated_at?: string
        }
      }
      scans: {
        Row: {
          id: string
          room_id: string
          user_id: string
          image_url: string | null
          thumbnail_url: string | null
          ai_model: string
          ai_raw_json: Json
          score_before: number | null
          score_after: number | null
          keep_image: boolean
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          image_url?: string | null
          thumbnail_url?: string | null
          ai_model?: string
          ai_raw_json?: Json
          score_before?: number | null
          score_after?: number | null
          keep_image?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          image_url?: string | null
          thumbnail_url?: string | null
          ai_model?: string
          ai_raw_json?: Json
          score_before?: number | null
          score_after?: number | null
          keep_image?: boolean
          created_at?: string
        }
      }
      plans: {
        Row: {
          id: string
          scan_id: string | null
          room_id: string
          home_id: string
          user_id: string
          name: string
          status: PlanStatus
          is_template: boolean
          total_estimated_minutes: number
          total_actual_minutes: number | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          scan_id?: string | null
          room_id: string
          home_id: string
          user_id: string
          name?: string
          status?: PlanStatus
          is_template?: boolean
          total_estimated_minutes?: number
          total_actual_minutes?: number | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          scan_id?: string | null
          room_id?: string
          home_id?: string
          user_id?: string
          name?: string
          status?: PlanStatus
          is_template?: boolean
          total_estimated_minutes?: number
          total_actual_minutes?: number | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          plan_id: string
          room_id: string
          title: string
          description_steps: string[]
          category: TaskCategory
          priority: number
          estimated_minutes: number
          actual_minutes: number | null
          difficulty: number
          supplies: string[]
          safety_notes: string[]
          status: TaskStatus
          assignee_id: string | null
          sort_order: number
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plan_id: string
          room_id: string
          title: string
          description_steps?: string[]
          category?: TaskCategory
          priority?: number
          estimated_minutes?: number
          actual_minutes?: number | null
          difficulty?: number
          supplies?: string[]
          safety_notes?: string[]
          status?: TaskStatus
          assignee_id?: string | null
          sort_order?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plan_id?: string
          room_id?: string
          title?: string
          description_steps?: string[]
          category?: TaskCategory
          priority?: number
          estimated_minutes?: number
          actual_minutes?: number | null
          difficulty?: number
          supplies?: string[]
          safety_notes?: string[]
          status?: TaskStatus
          assignee_id?: string | null
          sort_order?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      task_events: {
        Row: {
          id: string
          task_id: string
          user_id: string
          event_type: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          event_type: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          event_type?: string
          metadata?: Json
          created_at?: string
        }
      }
      recurrences: {
        Row: {
          id: string
          home_id: string
          room_id: string | null
          task_template: Json
          rule: string
          next_due_at: string
          last_triggered_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          home_id: string
          room_id?: string | null
          task_template: Json
          rule: string
          next_due_at: string
          last_triggered_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          home_id?: string
          room_id?: string | null
          task_template?: Json
          rule?: string
          next_due_at?: string
          last_triggered_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      badges: {
        Row: {
          id: string
          name: string
          description: string
          icon: string
          category: string
          requirement_type: string
          requirement_value: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon: string
          category: string
          requirement_type: string
          requirement_value: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string
          category?: string
          requirement_type?: string
          requirement_value?: number
          created_at?: string
        }
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_id: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_id?: string
          earned_at?: string
        }
      }
      notification_prefs: {
        Row: {
          id: string
          user_id: string
          daily_reminder: boolean
          daily_reminder_time: string
          due_reminders: boolean
          achievement_notifications: boolean
          quiet_hours_start: string | null
          quiet_hours_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          daily_reminder?: boolean
          daily_reminder_time?: string
          due_reminders?: boolean
          achievement_notifications?: boolean
          quiet_hours_start?: string | null
          quiet_hours_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          daily_reminder?: boolean
          daily_reminder_time?: string
          due_reminders?: boolean
          achievement_notifications?: boolean
          quiet_hours_start?: string | null
          quiet_hours_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          created_at?: string
        }
      }
      user_stats: {
        Row: {
          id: string
          user_id: string
          home_id: string
          total_tasks_completed: number
          total_minutes_cleaned: number
          current_streak: number
          longest_streak: number
          last_activity_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          home_id: string
          total_tasks_completed?: number
          total_minutes_cleaned?: number
          current_streak?: number
          longest_streak?: number
          last_activity_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          home_id?: string
          total_tasks_completed?: number
          total_minutes_cleaned?: number
          current_streak?: number
          longest_streak?: number
          last_activity_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      task_feedback: {
        Row: {
          id: string
          user_id: string
          task_title: string
          category: TaskCategory
          feedback_type: 'skip_always' | 'adjust_time' | 'lower_priority'
          adjustment_value: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_title: string
          category: TaskCategory
          feedback_type: 'skip_always' | 'adjust_time' | 'lower_priority'
          adjustment_value?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_title?: string
          category?: TaskCategory
          feedback_type?: 'skip_always' | 'adjust_time' | 'lower_priority'
          adjustment_value?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      plan_status: PlanStatus
      task_status: TaskStatus
      task_category: TaskCategory
      detail_level: DetailLevel
      cleaning_standard: CleaningStandard
      subscription_tier: SubscriptionTier
      subscription_status: SubscriptionStatus
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
