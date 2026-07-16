export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          weight_goal: number | null
          weight_unit: string
          currency: string
          timezone: string
          full_name: string | null
          phone: string | null
          contact_email: string | null
          emergency_contact: string | null
          weight_rate: number | null
          weight_start: number | null
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      accounts: {
        Row: { id: string; user_id: string; type: 'personal' | 'business'; name: string; purpose: string | null; goal_id: string | null; business_key: string | null; created_at: string }
        Insert: Omit<Database['public']['Tables']['accounts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['accounts']['Insert']>
      }
      transactions: {
        Row: {
          id: string; user_id: string; account_id: string
          direction: 'income' | 'expense'; amount: number; currency: string
          category: string | null; merchant: string | null; occurred_on: string
          note: string | null; receipt_id: string | null
          source: 'manual' | 'receipt' | 'stripe' | 'shopify' | 'assistant'; created_at: string
        }
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
      }
      receipts: {
        Row: {
          id: string; user_id: string; image_path: string
          status: 'pending' | 'parsed' | 'failed'; raw_extraction: Json | null; created_at: string
        }
        Insert: Omit<Database['public']['Tables']['receipts']['Row'], 'id' | 'created_at' | 'raw_extraction'> & { raw_extraction?: Json }
        Update: Partial<Database['public']['Tables']['receipts']['Insert']>
      }
      balance_snapshots: {
        Row: { id: string; user_id: string; account_id: string; balance: number; as_of: string; note: string | null; created_at: string }
        Insert: Omit<Database['public']['Tables']['balance_snapshots']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['balance_snapshots']['Insert']>
      }
      weight_logs: {
        Row: { id: string; user_id: string; weight: number; unit: string; logged_on: string; note: string | null; created_at: string }
        Insert: Omit<Database['public']['Tables']['weight_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['weight_logs']['Insert']>
      }
      anchors: {
        Row: { id: string; user_id: string; name: string; type: string | null; target: number | null; active: boolean; created_at: string }
        Insert: Omit<Database['public']['Tables']['anchors']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['anchors']['Insert']>
      }
      anchor_logs: {
        Row: { id: string; user_id: string; anchor_id: string; logged_on: string; value: number | null; created_at: string }
        Insert: Omit<Database['public']['Tables']['anchor_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['anchor_logs']['Insert']>
      }
      check_ins: {
        Row: { id: string; user_id: string; check_in_date: string; slot: 'morning' | 'evening'; mood: number | null; energy: number | null; note: string | null; reflection_text: string | null; created_at: string }
        Insert: Omit<Database['public']['Tables']['check_ins']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['check_ins']['Insert']>
      }
      workout_logs: {
        Row: { id: string; user_id: string; logged_on: string; exercise: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['workout_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['workout_logs']['Insert']>
      }
      cravings: {
        Row: { id: string; user_id: string; feeling: string | null; rode_out: boolean; note: string | null; created_at: string }
        Insert: Omit<Database['public']['Tables']['cravings']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['cravings']['Insert']>
      }
      work_items: {
        Row: { id: string; user_id: string; business: string; kind: string; title: string; amount: number | null; status: string; due_date: string | null; created_at: string }
        Insert: Omit<Database['public']['Tables']['work_items']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['work_items']['Insert']>
      }
      budgets: {
        Row: { id: string; user_id: string; category: string; monthly_limit: number; created_at: string }
        Insert: Omit<Database['public']['Tables']['budgets']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['budgets']['Insert']>
      }
      milestones: {
        Row: { id: string; user_id: string; goal_id: string; title: string; done: boolean; sort: number; created_at: string }
        Insert: Omit<Database['public']['Tables']['milestones']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['milestones']['Insert']>
      }
      goals: {
        Row: {
          id: string; user_id: string; title: string; detail: string | null
          category: string; target_value: number | null; target_unit: string | null
          target_date: string | null; status: 'active' | 'done' | 'archived'
          sort: number; completed_at: string | null; created_at: string
        }
        Insert: Omit<Database['public']['Tables']['goals']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['goals']['Insert']>
      }
      calendar_events: {
        Row: { id: string; user_id: string; title: string; starts_at: string; ends_at: string | null; all_day: boolean; source: 'native' | 'gcal'; external_id: string | null; created_at: string }
        Insert: Omit<Database['public']['Tables']['calendar_events']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['calendar_events']['Insert']>
      }
      coach_reviews: {
        Row: { id: string; user_id: string; period_start: string; period_end: string; summary: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['coach_reviews']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['coach_reviews']['Insert']>
      }
      conversations: {
        Row: { id: string; user_id: string; title: string | null; updated_at: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>
      }
      messages: {
        Row: { id: string; user_id: string; conversation_id: string; role: 'user' | 'assistant'; content: string | null; tool_calls: Json | null; created_at: string }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      reminders: {
        Row: { id: string; user_id: string; title: string; due_at: string; recurrence: string | null; status: 'pending' | 'done' | 'cancelled'; source: 'manual' | 'assistant'; created_at: string }
        Insert: Omit<Database['public']['Tables']['reminders']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reminders']['Insert']>
      }
      notifications: {
        Row: { id: string; user_id: string; type: string | null; title: string; body: string | null; read: boolean; related_id: string | null; created_at: string }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
    }
  }
}
