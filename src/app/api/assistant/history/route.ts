import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data: messages } = await supabase
    .from('messages')
    .select('role,content')
    .eq('conversation_id', id)
    .eq('user_id', user.id)
    .order('created_at')

  return NextResponse.json({ messages: messages ?? [] })
}
