import { createClient, getCachedUser } from '@/lib/supabase/server'
import { format, startOfMonth, startOfWeek, addDays, subDays } from 'date-fns'
import CheckInForm from '@/components/home/CheckInForm'
import WeightTrendCard from '@/components/home/WeightTrendCard'
import GoalFocusCard from '@/components/home/GoalFocusCard'
import TodayHero, { type HeroRow } from '@/components/home/TodayHero'
import StepsCard from '@/components/home/StepsCard'
import CoachCard from '@/components/home/CoachCard'
import WeeklyReviewCard from '@/components/home/WeeklyReviewCard'
import CravingTracker from '@/components/body/CravingTracker'
import GoalsBlock from '@/components/goals/GoalsBlock'
import { weeklySummary } from '@/lib/summary'
import { sydneyNow } from '@/lib/dates'
import { dayByWeekday, totalExercises } from '@/lib/workout'
import { quoteOfTheDay } from '@/lib/quotes'
import type { Goal } from '@/types/goal'

export default async function DashboardHome() {
  const user = await getCachedUser()
  if (!user) return null
  const supabase = await createClient()

  const now = sydneyNow()
  const today = format(now, 'yyyy-MM-dd')
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const weekStartDate = startOfWeek(now, { weekStartsOn: 1 })
  const weekStart = format(weekStartDate, 'yyyy-MM-dd')
  const since = format(subDays(now, 60), 'yyyy-MM-dd')

  // Start the weekly work in parallel with the page queries
  const weekP = weeklySummary(supabase, user.id)

  const [
    { data: checkIns }, { data: profile }, { data: goalsData },
    { data: weightLogs },
    { data: workoutLogs }, { data: recentCheckins }, { data: cravings },
    { data: stepsRow },
  ] = await Promise.all([
    supabase.from('check_ins').select('*').eq('check_in_date', today),
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('goals')
      .select('id, title, detail, category, target_value, target_unit, target_date, status, created_at')
      .eq('status', 'active').order('target_date', { ascending: true, nullsFirst: false }).limit(5),
    supabase.from('weight_logs').select('weight,logged_on').gte('logged_on', since).order('logged_on'),
    supabase.from('workout_logs').select('logged_on,exercise').gte('logged_on', weekStart),
    supabase.from('check_ins').select('check_in_date').gte('check_in_date', format(subDays(now, 40), 'yyyy-MM-dd')),
    supabase.from('cravings').select('feeling,rode_out').gte('created_at', `${monthStart}T00:00:00`),
    supabase.from('daily_steps').select('steps,day').order('day', { ascending: false }).limit(1).maybeSingle(),
  ])

  // Time-of-day ambient glow palette (Sydney wall-clock)
  const hour = Number(format(now, 'H'))
  const timeGlow =
    hour >= 5 && hour < 8 ? { a: 'rgba(255,190,120,0.34)', b: 'rgba(255,150,150,0.24)' }   // dawn
      : hour >= 8 && hour < 12 ? { a: 'rgba(255,200,110,0.30)', b: 'rgba(210,225,140,0.24)' } // morning
      : hour >= 12 && hour < 17 ? { a: 'rgba(200,224,132,0.30)', b: 'rgba(255,214,130,0.22)' } // day
      : hour >= 17 && hour < 20 ? { a: 'rgba(255,140,80,0.34)', b: 'rgba(255,110,150,0.26)' }  // sunset
      : { a: 'rgba(72,108,205,0.30)', b: 'rgba(38,54,120,0.26)' }                              // night

  const stepsInfo = stepsRow as { steps: number; day: string } | null
  const todaySteps = stepsInfo?.steps ?? 0
  const stepsAsOf = stepsInfo && stepsInfo.day !== today ? stepsInfo.day : null

  const goals = (goalsData ?? []) as Goal[]
  const weights = (weightLogs ?? []) as { weight: number; logged_on: string }[]
  const prof = (profile ?? {}) as { weight_unit?: string; weight_goal?: number | null; display_name?: string | null }
  const unit = prof.weight_unit ?? 'kg'

  type CI = { id: string; slot: 'morning' | 'evening'; mood: number | null; energy: number | null; note: string | null; reflection_text: string | null }
  const rows = (checkIns ?? []) as CI[]
  const bySlot: Partial<Record<'morning' | 'evening', CI>> = {}
  for (const r of rows) bySlot[r.slot] = r
  const reflection = rows.filter(r => r.reflection_text).slice(-1)[0]?.reflection_text ?? null

  const wLogs = (workoutLogs ?? []) as { logged_on: string; exercise: string }[]
  const todayWorkout = dayByWeekday(now.getDay())
  const todayDone = wLogs.filter(l => l.logged_on === today).length
  const weekDots = Array.from({ length: 7 }).map((_, i) =>
    wLogs.some(l => l.logged_on === format(addDays(weekStartDate, i), 'yyyy-MM-dd')))
  const latestWeight = weights.length ? weights[weights.length - 1].weight : null
  const week = await weekP

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

  // The four things that make the day count — one place, no repetition
  const MOOD = ['', 'Rough', 'Low', 'Okay', 'Good', 'Great']
  const moodText = (c?: { mood: number | null; energy: number | null }) =>
    c?.mood ? `${MOOD[c.mood]}${c.energy ? ` · ⚡${c.energy}` : ''}` : 'Not yet'
  const heroRows: HeroRow[] = [
    { key: 'morning', label: 'Morning check-in', value: moodText(bySlot.morning), done: amDone, href: '/personal' },
    { key: 'evening', label: 'Evening check-in', value: moodText(bySlot.evening), done: pmDone, href: '/personal' },
    { key: 'workout', label: todayWorkout?.title ?? 'Rest day',
      value: todayWorkout ? `${todayDone}/${totalExercises(todayWorkout)}` : 'Rest day',
      done: todayWorkout ? todayDone > 0 : true, href: '/body' },
    { key: 'weight', label: 'Weight', value: latestWeight ? `${latestWeight} ${unit}` : '—', done: weightToday, href: '/body' },
  ]

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
    <div className="relative px-4 py-6 lg:px-8 space-y-8 [&_section>*]:min-w-0">
      {/* Live ambient glow — warm by day, deep blue by night */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <span className="kk-bgglow a" style={{ left: '12%', top: '-6%', width: '58vw', height: '58vw', background: `radial-gradient(circle, ${timeGlow.a}, transparent 68%)` }} />
        <span className="kk-bgglow b" style={{ left: '92%', top: '24%', width: '46vw', height: '46vw', background: `radial-gradient(circle, ${timeGlow.b}, transparent 70%)` }} />
      </div>

      {/* Big greeting headline + quick craving prompt on the same line */}
      <div className="kk-rise flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{format(now, 'EEEE, d MMMM')}</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[0.95]">
            {`Hey${prof.display_name ? `, ${prof.display_name.split(' ')[0]}` : ''}`}<span className="text-primary">.</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground italic">“{quoteOfTheDay(now)}”</p>
        </div>
        <div className="lg:w-80 shrink-0">
          <CravingTracker userId={user.id} cravings={(cravings ?? []) as { feeling: string | null; rode_out: boolean }[]} />
        </div>
      </div>

      {/* ── TODAY — one status card + the check-in action ── */}
      {/* Score + check-in */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <TodayHero score={score} streak={streak} rows={heroRows} weekDots={weekDots} />
        <CheckInForm userId={user.id} today={today} bySlot={bySlot} />
      </section>

      {/* Weight + steps on one line */}
      <section className="grid grid-cols-2 gap-4 items-stretch">
        <WeightTrendCard logs={weights} unit={unit} goal={prof.weight_goal ?? null} className="h-full" />
        <StepsCard steps={todaySteps} asOf={stepsAsOf} className="h-full" />
      </section>

      {/* ── MORE — coach note, quieter ── */}
      {reflection ? (
        <section className="grid grid-cols-1 gap-4">
          <CoachCard text={reflection} />
        </section>
      ) : null}

      {/* ── PLANS — goals & the week, at the bottom ── */}
      <section className="space-y-4">
        <SectionLabel>Goals & progress</SectionLabel>
        <div className="grid grid-cols-1 gap-4">
          <GoalFocusCard goals={goals} />
          <WeeklyReviewCard summary={week} />
        </div>
        <GoalsBlock userId={user.id} categories={['Personal', 'Travel', 'Learning']} title="Life goals" />
      </section>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</h2>
}
