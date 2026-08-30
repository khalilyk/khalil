import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPush } from '@/lib/push'
import { format, parseISO } from 'date-fns'

export const runtime = 'nodejs'

// Hourly: push a reminder for calendar events the user flagged with `notify`,
// as they come due. Runs on the top of the hour, so it catches anything
// starting within the next hour. Each event is sent once (notified_at).
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  const ok =
    req.headers.get('x-cron-secret') === expected ||
    auth === `Bearer ${expected}` ||
    req.nextUrl.searchParams.get('secret') === expected
  if (!expected || !ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createServiceClient()
  const now = Date.now()
  const windowAhead = new Date(now + 60 * 60 * 1000).toISOString() // next hour
  const windowBehind = new Date(now - 2 * 60 * 60 * 1000).toISOString() // don't fire very stale ones

  const { data: due } = await supabase
    .from('calendar_events')
    .select('id, user_id, title, starts_at, all_day, notify, notified_at')
    .eq('notify', true)
    .is('notified_at', null)
    .lte('starts_at', windowAhead)
    .gte('starts_at', windowBehind)

  if (!due?.length) return NextResponse.json({ sent: 0 })

  let sent = 0
  for (const e of due as { id: string; user_id: string; title: string; starts_at: string; all_day: boolean }[]) {
    const when = e.all_day ? 'Today' : format(parseISO(e.starts_at), 'h:mm a')
    try {
      await sendPush(e.user_id, {
        title: '🔔 Upcoming',
        body: `${e.title} · ${when}`,
        url: '/calendar',
        tag: `event:${e.id}`,
      })
      // Log it in-app too, and mark as notified so it only fires once.
      await supabase.from('notifications').insert({
        user_id: e.user_id, type: 'event', title: e.title,
        body: `Starts ${when}`, related_id: e.id,
      })
      await supabase.from('calendar_events').update({ notified_at: new Date().toISOString() }).eq('id', e.id)
      sent++
    } catch { /* leave notified_at null so we retry next hour */ }
  }

  return NextResponse.json({ sent })
}
