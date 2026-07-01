import { createClient } from '@/lib/supabase/server'
import { format, subDays, startOfWeek } from 'date-fns'
import WeightSection from '@/components/body/WeightSection'
import WorkoutSection from '@/components/body/WorkoutSection'
import RemindersSection from '@/components/body/RemindersSection'
import GoalsBlock from '@/components/goals/GoalsBlock'

export default async function BodyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const since = format(subDays(new Date(), 60), 'yyyy-MM-dd')
  const today = format(new Date(), 'yyyy-MM-dd')
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

  type Profile = { weight_goal: number | null; weight_unit: string; weight_rate: number | null; remind_water: boolean | null; remind_snack: boolean | null }
  const [{ data: weightLogs }, { data: profileRaw }, { data: workoutLogs }] = await Promise.all([
    supabase.from('weight_logs').select('*').gte('logged_on', since).order('logged_on'),
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('workout_logs').select('logged_on,exercise').gte('logged_on', weekStart),
  ])
  const profile = profileRaw as Profile | null

  return (
    <div className="w-full px-4 lg:px-8 py-6 space-y-6">
      <h1 className="text-xl font-semibold">Body</h1>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start [&>*]:min-w-0">
        <WeightSection
          userId={user.id}
          logs={weightLogs ?? []}
          weightGoal={profile?.weight_goal ?? null}
          weightRate={profile?.weight_rate ?? null}
          unit={profile?.weight_unit ?? 'kg'}
          today={today}
        />
        <WorkoutSection
          userId={user.id}
          weekLogs={workoutLogs ?? []}
        />
      </div>
      <RemindersSection userId={user.id} remindWater={!!profile?.remind_water} remindSnack={!!profile?.remind_snack} />
      <GoalsBlock userId={user.id} categories={['Body']} title="Body goals" />
    </div>
  )
}
