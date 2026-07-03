import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { format, addDays } from 'date-fns'

const anthropic = new Anthropic()

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { weekStart } = await req.json()
  const weekEnd = format(addDays(new Date(weekStart), 6), 'yyyy-MM-dd')

  const [{ data: checkIns }, { data: weightLogs }, { data: workoutLogs }, { data: transactions }, { data: cravings }] = await Promise.all([
    supabase.from('check_ins').select('*').gte('check_in_date', weekStart).lte('check_in_date', weekEnd).eq('user_id', user.id),
    supabase.from('weight_logs').select('*').gte('logged_on', weekStart).lte('logged_on', weekEnd).eq('user_id', user.id),
    supabase.from('workout_logs').select('logged_on').gte('logged_on', weekStart).lte('logged_on', weekEnd).eq('user_id', user.id),
    supabase.from('transactions').select('direction,amount,category').gte('occurred_on', weekStart).lte('occurred_on', weekEnd).eq('user_id', user.id),
    supabase.from('cravings').select('rode_out').gte('created_at', `${weekStart}T00:00:00`).eq('user_id', user.id),
  ])

  const avgMood = checkIns?.length ? (checkIns.reduce((s, c) => s + (c.mood ?? 0), 0) / checkIns.length).toFixed(1) : 'N/A'
  const totalSpend = (transactions ?? []).filter(t => t.direction === 'expense').reduce((s, t) => s + t.amount, 0)
  const workoutDays = new Set((workoutLogs ?? []).map(l => l.logged_on)).size
  const cravingsBeaten = (cravings ?? []).filter(c => c.rode_out).length
  const cravingsTotal = (cravings ?? []).length

  const context = `Week: ${weekStart} to ${weekEnd}
Check-ins: ${checkIns?.length ?? 0}/7, avg mood ${avgMood}/5
Weight entries: ${weightLogs?.length ?? 0}
Workout days: ${workoutDays}/5 (Mon–Fri program)
Cravings resisted: ${cravingsBeaten}/${cravingsTotal}
Total spend: AUD ${totalSpend.toFixed(0)}`

  const msg = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 512,
    system: 'You are a personal coach writing a weekly review. 3-5 sentences: what went well, what needs attention, one actionable focus for next week. Warm, honest, direct. No generic advice.',
    messages: [{ role: 'user', content: context }]
  })

  const summary = (msg.content[0] as { text: string }).text
  await supabase.from('coach_reviews').insert({
    user_id: user.id, period_start: weekStart, period_end: weekEnd, summary
  })

  await supabase.from('notifications').insert({
    user_id: user.id, type: 'coach', title: 'Weekly review ready', body: summary.slice(0, 100) + '…'
  })

  return NextResponse.json({ summary })
}
