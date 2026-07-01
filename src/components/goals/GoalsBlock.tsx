import { Target } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import GoalsSection from './GoalsSection'
import { GOAL_COLUMNS, type Goal, type Milestone } from '@/types/goal'

export default async function GoalsBlock({ userId, categories, title = 'Goals' }: {
  userId: string; categories: string[]; title?: string
}) {
  const supabase = await createClient()
  const isMoney = categories.map(c => c.toLowerCase()).includes('money')

  const [{ data: goals }, { data: ms }, snapsRes] = await Promise.all([
    supabase.from('goals').select(GOAL_COLUMNS).order('target_date', { ascending: true, nullsFirst: false }),
    supabase.from('milestones').select('id,goal_id,title,done').order('sort').order('created_at'),
    isMoney
      ? supabase.from('balance_snapshots').select('account_id,balance,as_of')
      : Promise.resolve({ data: null }),
  ])

  // Current savings = net worth (latest balance per account)
  let currentSavings: number | undefined
  if (isMoney) {
    const latest: Record<string, { balance: number; as_of: string }> = {}
    for (const s of (snapsRes.data ?? []) as { account_id: string; balance: number; as_of: string }[]) {
      if (!latest[s.account_id] || s.as_of > latest[s.account_id].as_of) latest[s.account_id] = s
    }
    currentSavings = Object.values(latest).reduce((t, s) => t + Number(s.balance), 0)
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2"><Target size={18} /> {title}</h2>
      <GoalsSection
        userId={userId}
        goals={(goals ?? []) as Goal[]}
        milestones={(ms ?? []) as Milestone[]}
        categories={categories}
        currentSavings={currentSavings}
      />
    </section>
  )
}
