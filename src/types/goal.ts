export type Goal = {
  id: string
  title: string
  detail: string | null
  category: string
  target_value: number | null
  target_unit: string | null
  target_date: string | null
  status: 'active' | 'done' | 'archived'
  created_at: string
}

export type Milestone = { id: string; goal_id: string; title: string; done: boolean }

// Category → the page it lives on, and the label shown in pickers
export const GOAL_CATEGORIES = ['Money', 'Body', 'Career', 'Personal', 'Travel', 'Learning'] as const

// The columns we select for a Goal row everywhere
export const GOAL_COLUMNS = 'id, title, detail, category, target_value, target_unit, target_date, status, created_at'
