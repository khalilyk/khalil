import { Target } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import GoalsSection from './GoalsSection'
import { GOAL_COLUMNS, type Goal, type Milestone } from '@/types/goal'

export default async function GoalsBlock({ userId, categories, title = 'Goals' }: {
  userId: string; categories: string[]; title?: string
}) {
  const supabase = await createClient()
  const [{ data: goals }, { data: ms }] = await Promise.all([
    supabase.from('goals').select(GOAL_COLUMNS).order('target_date', { ascending: true, nullsFirst: false }),
    supabase.from('milestones').select('id,goal_id,title,done').order('sort').order('created_at'),
  ])
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2"><Target size={18} /> {title}</h2>
      <GoalsSection
        userId={userId}
        goals={(goals ?? []) as Goal[]}
        milestones={(ms ?? []) as Milestone[]}
        categories={categories}
      />
    </section>
  )
}
