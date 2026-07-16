import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

const SYSTEM = `You read a photo of a paper receipt OR a screenshot of a purchase/transaction (bank app, order confirmation, etc.). Return JSON only, no prose, no fences:
{"merchant":string,"total":number,"currency":string,"date":"YYYY-MM-DD","category":string,"tax":number|null,"lineItems":[{"name":string,"amount":number}]}
- total: the amount spent as a plain number (the transaction/purchase amount).
- merchant: who it was paid to.
Unreadable fields = null. Category from: groceries,dining,supplies,subscriptions,travel,fuel,utilities,equipment,client_revenue,other.`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { receiptId } = await req.json()
  const { data: receipt } = await supabase.from('receipts').select('*').eq('id', receiptId).eq('user_id', user.id).maybeSingle()
  if (!receipt) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const { data: imageData } = await supabase.storage.from('receipts').download(receipt.image_path)
    if (!imageData) throw new Error('Image download failed')

    const buffer = await imageData.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mimeType = imageData.type || 'image/jpeg'

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: [{
          type: 'image',
          source: { type: 'base64', media_type: mimeType as 'image/jpeg', data: base64 }
        }, { type: 'text', text: 'Extract this receipt.' }]
      }]
    })

    const raw = (msg.content[0] as { text: string }).text.trim()
    const clean = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    const extraction = JSON.parse(clean)

    await supabase.from('receipts').update({ status: 'parsed', raw_extraction: extraction }).eq('id', receiptId)
    return NextResponse.json({ extraction })
  } catch (err) {
    await supabase.from('receipts').update({ status: 'failed' }).eq('id', receiptId)
    return NextResponse.json({ error: 'Parse failed' }, { status: 500 })
  }
}
