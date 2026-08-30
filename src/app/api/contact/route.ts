import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const TO = 'khalilykhouri@gmail.com'

// Public contact form → emails the studio inbox via Resend (same account as Not Normal).
export async function POST(req: NextRequest) {
  let data: { topic?: string; name?: string; email?: string; message?: string }
  try {
    data = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const topic = (data.topic || '').trim()
  const name = (data.name || '').trim()
  const email = (data.email || '').trim()
  const message = (data.message || '').trim()

  if (!topic || !name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please fill in every field with a valid email.' }, { status: 422 })
  }

  if (!process.env.RESEND_API_KEY) {
    // Not wired up yet - tell the client to fall back to a mailto handoff.
    return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.EMAIL_FROM || 'Khalil Khouri <onboarding@resend.dev>'

  try {
    const { error } = await resend.emails.send({
      from,
      to: TO,
      replyTo: email,
      subject: `New enquiry · ${topic} · ${name}`,
      text: `Topic: ${topic}\nFrom: ${name} <${email}>\n\n${message}`,
      html: renderEmail({ topic, name, email, message }),
    })
    if (error) return NextResponse.json({ error: 'Could not send. Please try again.' }, { status: 502 })
  } catch {
    return NextResponse.json({ error: 'Could not send. Please try again.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}

function renderEmail({ topic, name, email, message }: { topic: string; name: string; email: string; message: string }): string {
  const esc = (s: string) => s.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!))
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 0;color:#a3a09b;font-size:12px;text-transform:uppercase;letter-spacing:.06em;width:80px;vertical-align:top">${label}</td>
      <td style="padding:6px 0;color:#171717;font-size:15px">${value}</td></tr>`
  return `<!doctype html><html><body style="margin:0;background:#f4f2ed;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;padding:28px">
      <div style="font-size:22px;font-weight:800;color:#171717">kk<span style="color:#e5342b">.</span></div>
      <h1 style="font-size:20px;color:#171717;margin:18px 0 4px">New portfolio enquiry</h1>
      <table style="width:100%;border-collapse:collapse;margin-top:12px">
        ${row('Topic', esc(topic))}
        ${row('Name', esc(name))}
        ${row('Email', `<a href="mailto:${esc(email)}" style="color:#e5342b;text-decoration:none">${esc(email)}</a>`)}
      </table>
      <div style="margin-top:16px;padding:16px;background:#fff;border-radius:12px;color:#333;font-size:15px;line-height:1.6;white-space:pre-wrap">${esc(message)}</div>
    </div>
  </body></html>`
}
