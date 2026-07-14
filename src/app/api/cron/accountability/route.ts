import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { format, startOfMonth } from 'date-fns'
import { dayByWeekday, totalExercises } from '@/lib/workout'
import { sydneyNow } from '@/lib/dates'
import { sendPush } from '@/lib/push'

export const runtime = 'nodejs'

// Rule-based accountability nudges. Runs on a schedule (Vercel Cron) or can be
// pinged by an external scheduler for more frequent checks. Dedupes per day so
// it never spams the same nudge twice.
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  const ok =
    req.headers.get('x-cron-secret') === expected ||
    auth === `Bearer ${expected}` ||
    req.nextUrl.searchParams.get('secret') === expected
  if (!ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createServiceClient()
  const now = sydneyNow()
  const today = format(now, 'yyyy-MM-dd')
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')

  // Hour in the owner's timezone (Sydney). Derive it from the *real* clock
  // (new Date()), NOT sydneyNow() — that one already bakes in the Sydney offset,
  // and formatting it with a Sydney timeZone would double-count +10h.
  const sydHour = Number(new Intl.DateTimeFormat('en-AU', {
    hour: 'numeric', hour12: false, timeZone: 'Australia/Sydney',
  }).format(new Date()))

  const { data: profiles } = await supabase.from('profiles').select('id, currency')
  let created = 0

  for (const profile of profiles ?? []) {
    const uid = profile.id
    const currency = (profile as { currency?: string }).currency ?? 'AUD'

    const [
      { data: checkIns }, { data: workoutToday }, { data: weightToday },
      { data: budgets }, { data: monthTx }, { data: overdueGoals }, { data: todayNotifs },
    ] = await Promise.all([
      supabase.from('check_ins').select('slot').eq('user_id', uid).eq('check_in_date', today),
      supabase.from('workout_logs').select('id').eq('user_id', uid).eq('logged_on', today),
      supabase.from('weight_logs').select('id').eq('user_id', uid).eq('logged_on', today),
      supabase.from('budgets').select('category, monthly_limit').eq('user_id', uid),
      supabase.from('transactions').select('amount, category, direction').eq('user_id', uid).gte('occurred_on', monthStart),
      supabase.from('goals').select('id, title, target_date').eq('user_id', uid).eq('status', 'active').lt('target_date', today),
      supabase.from('notifications').select('type, related_id').eq('user_id', uid).gte('created_at', `${today}T00:00:00`),
    ])

    const sentTypes = new Set((todayNotifs ?? []).map(n => n.type))
    const sentPairs = new Set((todayNotifs ?? []).map(n => `${n.type}:${n.related_id ?? ''}`))
    const nudges: { type: string; title: string; body: string; related_id?: string }[] = []

    const slots = new Set((checkIns ?? []).map(c => (c as { slot: string }).slot))
    const workout = dayByWeekday(now.getDay())
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5

    // Weekday-morning movement reminder: gym + 10k steps
    if (isWeekday && sydHour >= 6 && sydHour <= 8)
      nudges.push({ type: 'nudge_move_am', title: '🏋️ Gym + 10k steps', body: 'Weekday morning — hit the gym and get your 10,000 steps in today.' })

    // Check-ins
    if (sydHour >= 7 && !slots.has('morning'))
      nudges.push({ type: 'nudge_morning', title: 'Morning check-in', body: 'Set your intentions and log mood + energy for today.' })
    if (sydHour >= 18 && !slots.has('evening'))
      nudges.push({ type: 'nudge_evening', title: 'Evening reckoning', body: 'How did today go? Log your evening check-in.' })

    // Workout
    if (workout && (workoutToday ?? []).length === 0 && sydHour >= 12)
      nudges.push({ type: 'nudge_workout', title: `Today’s workout: ${workout.title}`, body: `${totalExercises(workout)} exercises waiting — get it done.` })

    // Weight — Monday morning only (weekly weigh-in)
    if (now.getDay() === 1 && sydHour >= 7 && sydHour <= 10 && (weightToday ?? []).length === 0)
      nudges.push({ type: 'nudge_weight', title: 'Weekly weigh-in', body: 'It’s Monday — log your weight to track your weekly trend.' })

    // Budgets over limit
    const spentByCat: Record<string, number> = {}
    for (const t of monthTx ?? []) {
      if ((t as { direction: string }).direction !== 'expense') continue
      const c = (t as { category: string | null }).category ?? 'other'
      spentByCat[c] = (spentByCat[c] ?? 0) + (t as { amount: number }).amount
    }
    for (const b of budgets ?? []) {
      const cat = (b as { category: string }).category
      const limit = (b as { monthly_limit: number }).monthly_limit
      const spent = spentByCat[cat] ?? 0
      if (spent > limit)
        nudges.push({ type: 'alert_budget', related_id: cat, title: `Over budget: ${cat}`, body: `You’ve spent ${currency} ${Math.round(spent)} of ${currency} ${Math.round(limit)}.` })
    }

    // Overdue goals
    for (const g of overdueGoals ?? []) {
      const goal = g as { id: string; title: string; target_date: string }
      nudges.push({ type: 'alert_goal_overdue', related_id: goal.id, title: `Goal overdue: ${goal.title}`, body: `The date has passed. Reset it or push to finish.` })
    }

    // Insert, deduped for today
    for (const n of nudges) {
      const key = n.related_id ? `${n.type}:${n.related_id}` : null
      if (n.related_id ? sentPairs.has(key!) : sentTypes.has(n.type)) continue
      await supabase.from('notifications').insert({
        user_id: uid, type: n.type, title: n.title, body: n.body, related_id: n.related_id ?? null,
      })
      await sendPush(uid, { title: n.title, body: n.body, url: '/', tag: n.type })
      created++
    }
  }

  return NextResponse.json({ created })
}
