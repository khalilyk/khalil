import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { dayByWeekday, totalExercises } from '@/lib/workout'

export default async function SignalCards({ userId, today, profile }: {
  userId: string; today: string; profile: { weight_goal: number | null; currency: string } | null
}) {
  const supabase = await createClient()
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd')

  const [
    { data: latestWeight },
    { data: todaySpend },
    { data: workoutLogs },
    { data: nextEvent },
    { data: personalAccount },
  ] = await Promise.all([
    supabase.from('weight_logs').select('weight').order('logged_on', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('transactions').select('amount').eq('direction', 'expense').gte('occurred_on', monthStart).lte('occurred_on', today),
    supabase.from('workout_logs').select('exercise').eq('logged_on', today),
    supabase.from('calendar_events').select('title,starts_at').gte('starts_at', new Date().toISOString()).order('starts_at').limit(1).maybeSingle(),
    supabase.from('accounts').select('id,name').eq('type', 'personal').maybeSingle(),
  ])

  const totalSpend = (todaySpend ?? []).reduce((s, t) => s + t.amount, 0)
  const currency = profile?.currency ?? 'AUD'
  const weightDiff = latestWeight && profile?.weight_goal
    ? (latestWeight.weight - profile.weight_goal).toFixed(1) : null

  const todayWorkout = dayByWeekday(new Date().getDay())
  const workoutDone = (workoutLogs ?? []).length
  const workoutValue = todayWorkout
    ? `${workoutDone}/${totalExercises(todayWorkout)}`
    : 'Rest day'

  return (
    <div className="grid grid-cols-2 gap-3">
      <Signal label="Weight" value={latestWeight ? `${latestWeight.weight} kg` : '—'}
        sub={weightDiff ? `${parseFloat(weightDiff) > 0 ? '+' : ''}${weightDiff} from goal` : undefined} />
      <Signal label="Month spend" value={`${currency} ${totalSpend.toFixed(0)}`} />
      <Signal label="Workout" value={workoutValue}
        sub={todayWorkout ? todayWorkout.title : undefined} />
      <Signal label="Next event" value={nextEvent?.title ?? '—'}
        sub={nextEvent ? format(new Date(nextEvent.starts_at), 'EEE h:mm a') : undefined} />
    </div>
  )
}

function Signal({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}
