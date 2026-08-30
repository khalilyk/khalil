export type BusinessKey = 'not_normal' | 'bric' | 'print_paradise'

export const BUSINESSES: { key: BusinessKey; name: string; tagline: string }[] = [
  { key: 'bric', name: 'BRIC', tagline: '' },
  { key: 'print_paradise', name: 'Print Paradise', tagline: '' },
]

export type WorkItem = {
  id: string
  business: BusinessKey
  kind: 'revenue' | 'project' | 'order' | 'task'
  title: string
  amount: number | null
  status: 'pending' | 'in_progress' | 'done'
  due_date: string | null
  created_at: string
}
