import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { sydneyNow } from '@/lib/dates'

export const runtime = 'nodejs'

// Receives today's step count from Apple Health via an iOS Shortcut.
// The Shortcut POSTs { steps, day? } with header `x-cron-secret: <CRON_SECRET>`
// (or ?secret=). One owner, so we attach to the single profile.
export async function POST(req: NextRequest) {
  const expected = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  const ok =
    req.headers.get('x-cron-secret') === expected ||
    auth === `Bearer ${expected}` ||
    req.nextUrl.searchParams.get('secret') === expected
  if (!expected || !ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { steps?: unknown; day?: unknown } = {}
  try { body = await req.json() } catch { /* allow query params */ }
  const rawSteps = body.steps ?? req.nextUrl.searchParams.get('steps')
  const steps = Math.max(0, Math.round(Number(rawSteps)))
  if (!Number.isFinite(steps)) {
    return NextResponse.json({ error: 'steps must be a number' }, { status: 400 })
  }
  const day = typeof body.day === 'string' && body.day
    ? body.day
    : req.nextUrl.searchParams.get('day') || format(sydneyNow(), 'yyyy-MM-dd')

  const supabase = await createServiceClient()
  const { data: profile } = await supabase.from('profiles').select('id').limit(1).maybeSingle()
  if (!profile) return NextResponse.json({ error: 'No profile' }, { status: 404 })

  const { error } = await supabase.from('daily_steps').upsert(
    { user_id: profile.id, day, steps, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,day' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, day, steps })
}
