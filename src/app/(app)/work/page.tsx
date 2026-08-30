import { createClient, getCachedUser } from '@/lib/supabase/server'
import WorkDashboard from '@/components/work/WorkDashboard'
import GoalsBlock from '@/components/goals/GoalsBlock'
import { getBusinessStats } from '@/lib/businesses'
import type { WorkItem } from '@/lib/work'

export default async function WorkPage() {
  const user = await getCachedUser()
  const supabase = await createClient()

  const [{ data: items }, { data: profile }, live] = await Promise.all([
    supabase.from('work_items').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('currency').eq('id', user!.id).maybeSingle(),
    getBusinessStats(),
  ])
  const currency = (profile as { currency: string } | null)?.currency ?? 'AUD'

  return (
    <div className="w-full px-4 lg:px-8 py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Work</h1>
        <p className="text-sm text-muted-foreground">Your businesses — revenue, pipeline, and what needs doing.</p>
      </div>

      <WorkDashboard userId={user!.id} items={(items ?? []) as WorkItem[]} currency={currency} live={live} />

      <GoalsBlock userId={user!.id} categories={['Career']} title="Career goals" />
    </div>
  )
}
