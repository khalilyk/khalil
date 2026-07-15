import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

const SYSTEM = `You read a screenshot of a banking app's accounts list and extract every account. Return JSON only, no prose, no code fences:
{"accounts":[{"name":string,"balance":number,"kind":"personal"|"business"}]}
Rules:
- name: the account's display name exactly as shown (e.g. "Smart Savers").
- balance: the AVAILABLE balance as a plain number — strip currency symbols and thousands separators. Use the negative sign if the account is in debt / owing.
- kind: "business" if the account name or grouping indicates a business/company account, otherwise "personal".
If nothing is readable, return {"accounts":[]}.`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { imageBase64, mimeType } = await req.json()
  if (!imageBase64) return NextResponse.json({ error: 'No image' }, { status: 400 })

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: (mimeType || 'image/jpeg') as 'image/jpeg', data: imageBase64 } },
          { type: 'text', text: 'Extract every account and its available balance from this banking app screenshot.' },
        ],
      }],
    })

    const raw = (msg.content[0] as { text: string }).text.trim()
    const clean = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    const parsed = JSON.parse(clean) as { accounts?: { name: string; balance: number; kind: string }[] }
    const accounts = (parsed.accounts ?? [])
      .filter(a => a && typeof a.name === 'string')
      .map(a => ({
        name: a.name.trim(),
        balance: Number(a.balance) || 0,
        kind: a.kind === 'business' ? 'business' : 'personal',
      }))
    return NextResponse.json({ accounts })
  } catch {
    return NextResponse.json({ error: 'Parse failed' }, { status: 500 })
  }
}
