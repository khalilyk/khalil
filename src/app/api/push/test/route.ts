import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPush } from '@/lib/push'

export const runtime = 'nodejs'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await sendPush(user.id, {
    title: 'Khalil',
    body: 'Notifications are working. This is a test.',
    url: '/',
    tag: 'test',
  })
  return NextResponse.json({ ok: true })
}
