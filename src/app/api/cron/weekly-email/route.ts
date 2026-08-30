import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import { weeklySummary } from '@/lib/summary'

export const runtime = 'nodejs'

// Weekly email digest. Trigger once a week (e.g. Sunday evening) via an
// external scheduler:  /api/cron/weekly-email?secret=<CRON_SECRET>
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET
  const ok =
    req.headers.get('x-cron-secret') === expected ||
    req.headers.get('authorization') === `Bearer ${expected}` ||
    req.nextUrl.searchParams.get('secret') === expected
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.EMAIL_FROM || 'Khalil <onboarding@resend.dev>'
  const supabase = await createServiceClient()

  const { data: profiles } = await supabase.from('profiles').select('id, contact_email')
  const { data: userList } = await supabase.auth.admin.listUsers()
  const emailFor = new Map((userList?.users ?? []).map(u => [u.id, u.email]))

  let sent = 0
  for (const p of profiles ?? []) {
    const to = (p as { contact_email?: string }).contact_email || emailFor.get(p.id)
    if (!to) continue
    const s = await weeklySummary(supabase, p.id)
    try {
      await resend.emails.send({ from, to, subject: `Your week - ${s.rangeLabel}`, html: renderEmail(s) })
      sent++
    } catch { /* skip failed sends */ }
  }
  return NextResponse.json({ sent })
}

function renderEmail(s: Awaited<ReturnType<typeof weeklySummary>>): string {
  const money = `${s.currency} ${Math.round(s.spend).toLocaleString()}`
  const stat = (label: string, value: string) =>
    `<td style="padding:14px 10px;background:#f4f4f2;border-radius:14px;text-align:center;width:25%">
      <div style="font-size:11px;color:#8a8a86;text-transform:uppercase;letter-spacing:.05em">${label}</div>
      <div style="font-size:20px;font-weight:700;color:#171717;margin-top:4px">${value}</div>
    </td>`
  const extras = [
    ...(s.overBudget.length ? [`<p style="color:#d84315;margin:6px 0">Over budget: ${s.overBudget.join(', ')}</p>`] : []),
    ...s.goalsDueSoon.map(g => `<p style="color:#555;margin:6px 0">🎯 ${g.title} - ${g.days < 0 ? 'overdue' : g.days === 0 ? 'due today' : `${g.days} days left`}</p>`),
  ].join('')

  return `<!doctype html><html><body style="margin:0;background:#ededea;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;padding:24px">
      <div style="display:inline-block;width:34px;height:34px;background:#70892e;border-radius:9px;color:#fff;font-weight:800;text-align:center;line-height:34px;font-size:18px">K</div>
      <h1 style="font-size:22px;color:#171717;margin:16px 0 2px">Your week in review</h1>
      <p style="color:#8a8a86;margin:0 0 20px">${s.rangeLabel}</p>
      <table style="width:100%;border-spacing:8px 0;margin:0 -8px"><tr>
        ${stat('Check-ins', `${s.checkinsDone}/7`)}
        ${stat('Trained', `${s.workoutDays}d`)}
        ${stat('Weight', s.weightChange === null ? ' - ' : `${s.weightChange > 0 ? '+' : ''}${s.weightChange}${s.unit}`)}
        ${stat('Spent', money)}
      </tr></table>
      <div style="margin-top:20px">${extras || '<p style="color:#555;margin:6px 0">On track - nothing flagged this week.</p>'}</div>
      <a href="https://khalilkhouri.org" style="display:inline-block;margin-top:20px;background:#70892e;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600">Open Khalil</a>
      <p style="color:#b0b0ac;font-size:12px;margin-top:24px">Keep the streak going. Small steps, every day.</p>
    </div>
  </body></html>`
}
