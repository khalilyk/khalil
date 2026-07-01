import { format, startOfMonth, startOfWeek, subDays, addDays, parseISO, differenceInCalendarDays } from 'date-fns'
import { dayByWeekday, totalExercises } from './workout'

/* eslint-disable @typescript-eslint/no-explicit-any */
type DB = any

const money = (n: number, ccy = 'AUD') => `${ccy} ${Math.round(n).toLocaleString()}`

// ── Morning briefing: what matters today ──────────────────
export async function morningBriefing(supabase: DB, userId: string) {
  const now = new Date()
  const today = format(now, 'yyyy-MM-dd')
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')

  const [{ data: checkIns }, { data: profile }, { data: weightLogs }, { data: monthTx }, { data: budgets }, { data: workoutToday }, { data: goals }] =
    await Promise.all([
      supabase.from('check_ins').select('slot').eq('user_id', userId).eq('check_in_date', today),
      supabase.from('profiles').select('currency, weight_goal, weight_unit').eq('id', userId).maybeSingle(),
      supabase.from('weight_logs').select('weight,logged_on').order('logged_on', { ascending: false }).limit(1),
      supabase.from('transactions').select('amount,category,direction').eq('direction', 'expense').gte('occurred_on', monthStart),
      supabase.from('budgets').select('category,monthly_limit'),
      supabase.from('workout_logs').select('exercise').eq('logged_on', today),
      supabase.from('goals').select('title,target_date,status').eq('status', 'active').not('target_date', 'is', null).order('target_date').limit(1),
    ])

  const ccy = profile?.currency ?? 'AUD'
  const unit = profile?.weight_unit ?? 'kg'
  const slots = new Set((checkIns ?? []).map((c: any) => c.slot))
  const lines: string[] = []

  // Workout
  const w = dayByWeekday(now.getDay())
  if (w) {
    const done = (workoutToday ?? []).length
    lines.push(done > 0 ? `🏋️ ${w.title}: ${done}/${totalExercises(w)} done` : `🏋️ Today’s workout: ${w.title} (${totalExercises(w)} exercises)`)
  } else {
    lines.push('🧘 Recovery day — steps, stretch, mobility.')
  }

  // Weight
  const latest = (weightLogs ?? [])[0]
  if (latest && profile?.weight_goal) {
    const diff = +(latest.weight - profile.weight_goal).toFixed(1)
    if (Math.abs(diff) < 0.1) lines.push(`⚖️ At goal weight (${latest.weight} ${unit}).`)
    else lines.push(`⚖️ ${latest.weight} ${unit} — ${Math.abs(diff)} ${unit} to ${diff > 0 ? 'lose' : 'gain'}.`)
  } else if (latest) {
    lines.push(`⚖️ Last weigh-in: ${latest.weight} ${unit}.`)
  }

  // Money
  const spent = (monthTx ?? []).reduce((s: number, t: any) => s + Number(t.amount), 0)
  const byCat: Record<string, number> = {}
  for (const t of monthTx ?? []) byCat[t.category ?? 'other'] = (byCat[t.category ?? 'other'] ?? 0) + Number(t.amount)
  const over = (budgets ?? []).filter((b: any) => (byCat[b.category] ?? 0) > b.monthly_limit)
  lines.push(`💸 ${money(spent, ccy)} spent this month${over.length ? ` — over budget on ${over.map((b: any) => b.category).join(', ')}` : ''}.`)

  // Goal
  const g = (goals ?? [])[0]
  if (g) {
    const days = differenceInCalendarDays(parseISO(g.target_date), now)
    lines.push(`🎯 ${g.title} — ${days < 0 ? 'overdue' : days === 0 ? 'due today' : `${days} days left`}.`)
  }

  // Check-in prompts
  if (!slots.has('morning')) lines.push('☀️ Morning check-in still open.')

  return { greeting: greetingFor(now), lines }
}

function greetingFor(d: Date) {
  const h = d.getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

// ── Weekly review: the last 7 days ────────────────────────
export type WeeklySummary = {
  rangeLabel: string
  checkinsDone: number
  workoutDays: number
  weightChange: number | null
  unit: string
  spend: number
  currency: string
  overBudget: string[]
  goalsDueSoon: { title: string; days: number }[]
  lines: string[]
}

export async function weeklySummary(supabase: DB, userId: string): Promise<WeeklySummary> {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekStartStr = format(weekStart, 'yyyy-MM-dd')
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')

  const [{ data: profile }, { data: checkIns }, { data: workouts }, { data: weights }, { data: monthTx }, { data: budgets }, { data: goals }] =
    await Promise.all([
      supabase.from('profiles').select('currency, weight_unit').eq('id', userId).maybeSingle(),
      supabase.from('check_ins').select('check_in_date').gte('check_in_date', weekStartStr),
      supabase.from('workout_logs').select('logged_on').gte('logged_on', weekStartStr),
      supabase.from('weight_logs').select('weight,logged_on').gte('logged_on', format(subDays(now, 10), 'yyyy-MM-dd')).order('logged_on'),
      supabase.from('transactions').select('amount,category,direction,occurred_on').eq('direction', 'expense').gte('occurred_on', monthStart),
      supabase.from('budgets').select('category,monthly_limit'),
      supabase.from('goals').select('title,target_date,status').eq('status', 'active').not('target_date', 'is', null),
    ])

  const ccy = profile?.currency ?? 'AUD'
  const unit = profile?.weight_unit ?? 'kg'

  const checkinsDone = new Set((checkIns ?? []).map((c: any) => c.check_in_date)).size
  const workoutDays = new Set((workouts ?? []).map((w: any) => w.logged_on)).size

  const ws = (weights ?? []) as { weight: number; logged_on: string }[]
  const weekWeights = ws.filter(w => w.logged_on >= weekStartStr)
  let weightChange: number | null = null
  if (weekWeights.length >= 2) weightChange = +(weekWeights[weekWeights.length - 1].weight - weekWeights[0].weight).toFixed(1)
  else if (ws.length >= 2) weightChange = +(ws[ws.length - 1].weight - ws[0].weight).toFixed(1)

  const weekTx = (monthTx ?? []).filter((t: any) => t.occurred_on >= weekStartStr)
  const spend = weekTx.reduce((s: number, t: any) => s + Number(t.amount), 0)
  const byCat: Record<string, number> = {}
  for (const t of monthTx ?? []) byCat[t.category ?? 'other'] = (byCat[t.category ?? 'other'] ?? 0) + Number(t.amount)
  const overBudget = (budgets ?? []).filter((b: any) => (byCat[b.category] ?? 0) > b.monthly_limit).map((b: any) => b.category)

  const goalsDueSoon = (goals ?? [])
    .map((g: any) => ({ title: g.title, days: differenceInCalendarDays(parseISO(g.target_date), now) }))
    .filter((g: any) => g.days <= 14)
    .sort((a: any, b: any) => a.days - b.days)
    .slice(0, 5)

  const lines = [
    `✅ Checked in ${checkinsDone}/7 days`,
    `🏋️ Trained ${workoutDays} days`,
    weightChange !== null ? `⚖️ Weight ${weightChange > 0 ? '+' : ''}${weightChange} ${unit}` : '⚖️ No weigh-ins logged',
    `💸 Spent ${money(spend, ccy)} this week${overBudget.length ? ` — over on ${overBudget.join(', ')}` : ''}`,
    goalsDueSoon.length ? `🎯 ${goalsDueSoon.length} goal(s) due within 2 weeks` : '🎯 No goals due soon',
  ]

  return {
    rangeLabel: `${format(weekStart, 'd MMM')} – ${format(addDays(weekStart, 6), 'd MMM')}`,
    checkinsDone, workoutDays, weightChange, unit, spend, currency: ccy, overBudget, goalsDueSoon, lines,
  }
}
