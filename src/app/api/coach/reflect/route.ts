import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { sydneyNow } from '@/lib/dates'
import { format, subDays } from 'date-fns'

const anthropic = new Anthropic()

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date, slot } = await req.json()
  const today = date ?? format(sydneyNow(), 'yyyy-MM-dd')

  let checkInQuery = supabase.from('check_ins').select('*').eq('check_in_date', today).eq('user_id', user.id)
  if (slot) checkInQuery = checkInQuery.eq('slot', slot)

  const [{ data: checkIn }, { data: weightLog }, { data: workoutLogs }] = await Promise.all([
    checkInQuery.order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('weight_logs').select('*').eq('logged_on', today).eq('user_id', user.id).maybeSingle(),
    supabase.from('workout_logs').select('exercise').eq('logged_on', today).eq('user_id', user.id),
  ])

  if (!checkIn) return NextResponse.json({ error: 'No check-in' }, { status: 404 })

  const workoutDone = (workoutLogs ?? []).length

  const context = `Date: ${today} (${checkIn.slot ?? 'check-in'})
Mood: ${checkIn.mood}/5, Energy: ${checkIn.energy}/5
Note: ${checkIn.note ?? 'none'}
Workout exercises completed today: ${workoutDone}
Weight logged: ${weightLog ? `${weightLog.weight} kg` : 'no'}`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    system: 'You are a personal coach. Write 2-4 sentences: one observation about today, one encouragement, one small concrete next step. Warm and direct. No generic advice. No clinical claims.',
    messages: [{ role: 'user', content: context }]
  })

  const text = (msg.content[0] as { text: string }).text
  await supabase.from('check_ins').update({ reflection_text: text }).eq('id', checkIn.id)

  // Create coach notification
  await supabase.from('notifications').insert({
    user_id: user.id, type: 'coach', title: 'Daily reflection ready', body: text.slice(0, 100) + '…'
  })

  return NextResponse.json({ text })
}
