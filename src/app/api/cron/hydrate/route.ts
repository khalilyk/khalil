import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPush } from '@/lib/push'

export const runtime = 'nodejs'

// Hourly water + no-snacking reminders, 10am–5pm Sydney time.
// Point an external scheduler (e.g. cron-job.org) at this hourly:
//   https://<domain>/api/cron/hydrate?secret=<CRON_SECRET>
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET
  const ok =
    req.headers.get('x-cron-secret') === expected ||
    req.headers.get('authorization') === `Bearer ${expected}` ||
    req.nextUrl.searchParams.get('secret') === expected
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const hour = Number(new Intl.DateTimeFormat('en-AU', {
    hour: 'numeric', hour12: false, timeZone: 'Australia/Sydney',
  }).format(new Date()))

  if (hour < 10 || hour > 17) return NextResponse.json({ skipped: 'outside 10–17 window', hour })

  const supabase = await createServiceClient()
  const { data: profiles } = await supabase.from('profiles').select('id, remind_water, remind_snack')
  let sent = 0

  for (const p of profiles ?? []) {
    const prof = p as { id: string; remind_water?: boolean; remind_snack?: boolean }
    if (prof.remind_water) {
      await sendPush(prof.id, { title: '💧 Drink water', body: 'Time for a glass of water — stay hydrated.', tag: 'water', url: '/body' })
      sent++
    }
    if (prof.remind_snack) {
      await sendPush(prof.id, { title: '🚫 No snacking', body: 'Stay on plan — no snacking between meals.', tag: 'snack', url: '/body' })
      sent++
    }
  }

  return NextResponse.json({ hour, sent })
}
