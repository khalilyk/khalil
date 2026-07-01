import { createClient } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, addDays, subDays } from 'date-fns'
import CheckInForm from '@/components/home/CheckInForm'
import WeightTrendCard from '@/components/home/WeightTrendCard'
import GoalFocusCard from '@/components/home/GoalFocusCard'
import TodayCard from '@/components/home/TodayCard'
import MoneyCard from '@/components/home/MoneyCard'
import CoachCard from '@/components/home/CoachCard'
import DailyScoreBar from '@/components/home/DailyScoreBar'
import GoalsBlock from '@/components/goals/GoalsBlock'
import { dayByWeekday, totalExercises } from '@/lib/workout'
import { quoteOfTheDay } from '@/lib/quotes'
import type { Goal } from '@/types/goal'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const today = format(now, 'yyyy-MM-dd')
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const lastMonthStart = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')
  const lastMonthEnd = format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')
  const weekStartDate = startOfWeek(now, { weekStartsOn: 1 })
  const weekStart = format(weekStartDate, 'yyyy-MM-dd')
  const since = format(subDays(now, 60), 'yyyy-MM-dd')

  const [
    { data: checkIns }, { data: profile }, { data: goalsData },
    { data: weightLogs }, { data: monthTx }, { data: lastMonthTx },
    { data: workoutLogs }, { data: recentCheckins },
  ] = await Promise.all([
    supabase.from('check_ins').select('*').eq('check_in_date', today),
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('goals')
      .select('id, title, detail, category, target_value, target_unit, target_date, status, created_at')
      .eq('status', 'active').order('target_date', { ascending: true, nullsFirst: false }).limit(5),
    supabase.from('weight_logs').select('weight,logged_on').gte('logged_on', since).order('logged_on'),
    supabase.from('transactions').select('amount').eq('direction', 'expense').gte('occurred_on', monthStart).lte('occurred_on', today),
    supabase.from('transactions').select('amount').eq('direction', 'expense').gte('occurred_on', lastMonthStart).lte('occurred_on', lastMonthEnd),
    supabase.from('workout_logs').select('logged_on,exercise').gte('logged_on', weekStart),
    supabase.from('check_ins').select('check_in_date').gte('check_in_date', format(subDays(now, 40), 'yyyy-MM-dd')),
  ])

  const goals = (goalsData ?? []) as Goal[]
  const weights = (weightLogs ?? []) as { weight: number; logged_on: string }[]
  const prof = (profile ?? {}) as { currency?: string; weight_unit?: string; weight_goal?: number | null }
  const currency = prof.currency ?? 'AUD'
  const unit = prof.weight_unit ?? 'kg'

  type CI = { id: string; slot: 'morning' | 'evening'; mood: number | null; energy: number | null; note: string | null; reflection_text: string | null }
  const rows = (checkIns ?? []) as CI[]
  const bySlot: Partial<Record<'morning' | 'evening', CI>> = {}
  for (const r of rows) bySlot[r.slot] = r
  const reflection = rows.filter(r => r.reflection_text).slice(-1)[0]?.reflection_text ?? null

  const monthSpend = (monthTx ?? []).reduce((s, t) => s + t.amount, 0)
  const lastSpend = (lastMonthTx ?? []).reduce((s, t) => s + t.amount, 0)
  const spendTrend = lastSpend > 0 ? Math.round(((monthSpend - lastSpend) / lastSpend) * 100) : null

  const wLogs = (workoutLogs ?? []) as { logged_on: string; exercise: string }[]
  const todayWorkout = dayByWeekday(now.getDay())
  const todayDone = wLogs.filter(l => l.logged_on === today).length
  const weekDots = Array.from({ length: 7 }).map((_, i) =>
    wLogs.some(l => l.logged_on === format(addDays(weekStartDate, i), 'yyyy-MM-dd')))
  const latestWeight = weights.length ? weights[weights.length - 1].weight : null

  // ── Daily score (0–100) ──────────────────────────────
  const amDone = !!bySlot.morning?.mood
  const pmDone = !!bySlot.evening?.mood
  const weightToday = weights.some(w => w.logged_on === today)
  const workoutPts = todayWorkout
    ? Math.round((todayDone / Math.max(1, totalExercises(todayWorkout))) * 30)
    : 30 // rest day = full
  const scoreItems = [
    { label: 'Morning check-in', points: 25, got: amDone ? 25 : 0 },
    { label: 'Evening check-in', points: 25, got: pmDone ? 25 : 0 },
    { label: todayWorkout ? 'Workout' : 'Recovery', points: 30, got: workoutPts },
    { label: 'Weight logged', points: 20, got: weightToday ? 20 : 0 },
  ]
  const score = scoreItems.reduce((s, i) => s + i.got, 0)

  // Streak: consecutive days (up to today) with a check-in
  const ciDates = new Set(((recentCheckins ?? []) as { check_in_date: string }[]).map(r => r.check_in_date))
  let streak = 0
  for (let i = 0; i < 40; i++) {
    const ds = format(subDays(now, i), 'yyyy-MM-dd')
    if (ciDates.has(ds)) streak++
    else if (i === 0) continue // today not logged yet — don't break the streak
    else break
  }

  return (
    <div className="px-4 py-6 lg:px-8">
      <p className="text-xl text-muted-foreground italic mb-5">“{quoteOfTheDay(now)}”</p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 auto-rows-min [&>*]:min-w-0">
        <div className="lg:col-span-3">
          <DailyScoreBar score={score} items={scoreItems} streak={streak} />
        </div>
        <div className="lg:col-span-2">
          <CheckInForm userId={user.id} today={today} bySlot={bySlot} />
        </div>
        <GoalFocusCard goals={goals} />
        <WeightTrendCard logs={weights} unit={unit} goal={prof.weight_goal ?? null} />
        <TodayCard
          bySlot={bySlot}
          workoutTitle={todayWorkout?.title ?? 'Rest day'}
          workoutDone={todayDone}
          workoutTotal={todayWorkout ? totalExercises(todayWorkout) : 0}
          latestWeight={latestWeight}
          unit={unit}
          weekDots={weekDots}
        />
        <MoneyCard currency={currency} monthSpend={monthSpend} trend={spendTrend} />
        {reflection && <CoachCard text={reflection} className="lg:col-span-3" />}
      </div>
      <div className="mt-8">
        <GoalsBlock userId={user.id} categories={['Personal', 'Travel', 'Learning']} title="Life goals" />
      </div>
    </div>
  )
}
