import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// Daily push-health check. If someone wants reminders (water/snack toggles on)
// but has NO live push subscription, their device has silently dropped push —
// flag it in-app so they see it next time they open the app. Deduped ~daily.
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  const ok =
    req.headers.get('x-cron-secret') === expected ||
    auth === `Bearer ${expected}` ||
    req.nextUrl.searchParams.get('secret') === expected
  if (!expected || !ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createServiceClient()
  const { data: profiles } = await supabase.from('profiles').select('id, remind_water, remind_snack')
  const since = new Date(Date.now() - 20 * 3600 * 1000).toISOString()
  let flagged = 0

  for (const p of profiles ?? []) {
    const prof = p as { id: string; remind_water?: boolean; remind_snack?: boolean }
    if (!prof.remind_water && !prof.remind_snack) continue // doesn't want reminders → nothing to flag

    const { count } = await supabase.from('push_subscriptions')
      .select('id', { count: 'exact', head: true }).eq('user_id', prof.id)
    if ((count ?? 0) > 0) continue // has a live subscription → healthy

    // Already flagged in the last ~day? don't repeat
    const { data: recent } = await supabase.from('notifications')
      .select('id').eq('user_id', prof.id).eq('type', 'push_health').gte('created_at', since).limit(1)
    if (recent && recent.length) continue

    await supabase.from('notifications').insert({
      user_id: prof.id, type: 'push_health',
      title: '🔔 Reminders dropped',
      body: 'Your device stopped receiving notifications. Opening Khalil usually re-enables them automatically — or flip them back on in Settings.',
    })
    flagged++
  }

  return NextResponse.json({ flagged })
}
