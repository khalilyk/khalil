import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { format, subDays } from 'date-fns'

const anthropic = new Anthropic()

const SYSTEM = `You are the owner's personal life assistant inside their private dashboard.
You can read and write their data through tools. Be concise, direct, and warm.
Use tools to get real numbers rather than guessing. Make practical recommendations.
Always confirm before writing data or creating reminders, and state exactly what you will do.
No clinical or medical claims, no calorie targets. Currency AUD, weight kg, timezone Australia/Sydney.`

const tools: Anthropic.Tool[] = [
  {
    name: 'get_financial_summary',
    description: 'Get balances, spend total, and P&L per business account for a period',
    input_schema: {
      type: 'object' as const,
      properties: { period: { type: 'string', description: 'e.g. "this_month", "last_month", or "YYYY-MM-DD:YYYY-MM-DD"' } },
      required: ['period']
    }
  },
  {
    name: 'query_transactions',
    description: 'Query transactions with optional filters',
    input_schema: {
      type: 'object' as const,
      properties: {
        account: { type: 'string' }, direction: { type: 'string', enum: ['income', 'expense'] },
        category: { type: 'string' }, from: { type: 'string' }, to: { type: 'string' },
        limit: { type: 'number' }
      }
    }
  },
  {
    name: 'get_weight_trend',
    description: 'Get weight logs, moving average, and distance to goal',
    input_schema: {
      type: 'object' as const,
      properties: { from: { type: 'string' }, to: { type: 'string' } }
    }
  },
  {
    name: 'get_anchors_status',
    description: 'Get anchor completion status for a date',
    input_schema: {
      type: 'object' as const,
      properties: { date: { type: 'string', description: 'YYYY-MM-DD, defaults to today' } }
    }
  },
  {
    name: 'get_calendar',
    description: 'Get calendar events for a date range',
    input_schema: {
      type: 'object' as const,
      properties: { from: { type: 'string' }, to: { type: 'string' } },
      required: ['from', 'to']
    }
  },
  {
    name: 'get_checkins',
    description: 'Get daily check-in data for a date range',
    input_schema: {
      type: 'object' as const,
      properties: { from: { type: 'string' }, to: { type: 'string' } },
      required: ['from', 'to']
    }
  },
  {
    name: 'list_reminders',
    description: 'List reminders, optionally filtered by status',
    input_schema: {
      type: 'object' as const,
      properties: { status: { type: 'string', enum: ['pending', 'done', 'cancelled'] } }
    }
  },
  {
    name: 'log_transaction',
    description: 'Log a transaction (confirm with user first)',
    input_schema: {
      type: 'object' as const,
      properties: {
        account: { type: 'string', description: 'Account name or "personal"' },
        direction: { type: 'string', enum: ['income', 'expense'] },
        amount: { type: 'number' }, category: { type: 'string' },
        merchant: { type: 'string' }, date: { type: 'string' }, note: { type: 'string' }
      },
      required: ['account', 'direction', 'amount']
    }
  },
  {
    name: 'log_weight',
    description: 'Log a weight entry (confirm with user first)',
    input_schema: {
      type: 'object' as const,
      properties: { weight: { type: 'number' }, date: { type: 'string' }, note: { type: 'string' } },
      required: ['weight']
    }
  },
  {
    name: 'log_anchor',
    description: 'Log an anchor as done (confirm with user first)',
    input_schema: {
      type: 'object' as const,
      properties: { anchor: { type: 'string', description: 'Anchor name' }, date: { type: 'string' }, value: { type: 'number' } },
      required: ['anchor']
    }
  },
  {
    name: 'create_reminder',
    description: 'Create a reminder (confirm with user first)',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' }, due_at: { type: 'string', description: 'ISO datetime' },
        recurrence: { type: 'string', enum: ['daily', 'weekly', 'monthly'] }
      },
      required: ['title', 'due_at']
    }
  },
  {
    name: 'update_reminder',
    description: 'Update a reminder status (confirm with user first)',
    input_schema: {
      type: 'object' as const,
      properties: { id: { type: 'string' }, status: { type: 'string', enum: ['done', 'cancelled'] } },
      required: ['id', 'status']
    }
  },
  {
    name: 'create_event',
    description: 'Create a calendar event (confirm with user first)',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' }, starts_at: { type: 'string' },
        ends_at: { type: 'string' }, all_day: { type: 'boolean' }
      },
      required: ['title', 'starts_at']
    }
  }
]

async function executeTool(toolName: string, input: Record<string, unknown>, supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<unknown> {
  const today = format(new Date(), 'yyyy-MM-dd')

  switch (toolName) {
    case 'get_financial_summary': {
      const period = input.period as string
      let from = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
      let to = today
      if (period === 'last_month') {
        const d = new Date(); d.setMonth(d.getMonth() - 1)
        from = format(new Date(d.getFullYear(), d.getMonth(), 1), 'yyyy-MM-dd')
        to = format(new Date(d.getFullYear(), d.getMonth() + 1, 0), 'yyyy-MM-dd')
      } else if (period?.includes(':')) {
        [from, to] = period.split(':')
      }
      const [{ data: accounts }, { data: txs }, { data: snaps }] = await Promise.all([
        supabase.from('accounts').select('*'),
        supabase.from('transactions').select('*').gte('occurred_on', from).lte('occurred_on', to),
        supabase.from('balance_snapshots').select('*').order('as_of', { ascending: false }).limit(10),
      ])
      const summary = (accounts ?? []).map(a => {
        const atxs = (txs ?? []).filter(t => t.account_id === a.id)
        const income = atxs.filter(t => t.direction === 'income').reduce((s, t) => s + t.amount, 0)
        const expense = atxs.filter(t => t.direction === 'expense').reduce((s, t) => s + t.amount, 0)
        const balance = (snaps ?? []).find(s => s.account_id === a.id)?.balance
        return { account: a.name, type: a.type, income, expense, profit: income - expense, balance }
      })
      return { period: `${from} to ${to}`, accounts: summary }
    }

    case 'query_transactions': {
      let q = supabase.from('transactions').select('*,accounts(name)')
      if (input.direction) q = q.eq('direction', input.direction as string)
      if (input.category) q = q.eq('category', input.category as string)
      if (input.from) q = q.gte('occurred_on', input.from as string)
      if (input.to) q = q.lte('occurred_on', input.to as string)
      q = q.order('occurred_on', { ascending: false }).limit((input.limit as number) ?? 20)
      const { data } = await q
      return data ?? []
    }

    case 'get_weight_trend': {
      const from = (input.from as string) ?? format(subDays(new Date(), 30), 'yyyy-MM-dd')
      const to = (input.to as string) ?? today
      const [{ data: logs }, { data: profile }] = await Promise.all([
        supabase.from('weight_logs').select('*').gte('logged_on', from).lte('logged_on', to).order('logged_on'),
        supabase.from('profiles').select('weight_goal').eq('id', userId).maybeSingle(),
      ])
      const latest = logs?.[logs.length - 1]?.weight
      const goal = profile?.weight_goal
      return { logs: logs ?? [], latest, goal, distToGoal: latest && goal ? (latest - goal).toFixed(1) : null }
    }

    case 'get_anchors_status': {
      const date = (input.date as string) ?? today
      const [{ data: anchors }, { data: logs }] = await Promise.all([
        supabase.from('anchors').select('*').eq('active', true),
        supabase.from('anchor_logs').select('*').eq('logged_on', date),
      ])
      return (anchors ?? []).map(a => ({
        ...a, done: (logs ?? []).some(l => l.anchor_id === a.id)
      }))
    }

    case 'get_calendar': {
      const { data } = await supabase.from('calendar_events')
        .select('*').gte('starts_at', input.from as string).lte('starts_at', input.to as string).order('starts_at')
      return data ?? []
    }

    case 'get_checkins': {
      const { data } = await supabase.from('check_ins')
        .select('*').gte('check_in_date', input.from as string).lte('check_in_date', input.to as string).order('check_in_date')
      return data ?? []
    }

    case 'list_reminders': {
      let q = supabase.from('reminders').select('*').order('due_at')
      if (input.status) q = q.eq('status', input.status as string)
      const { data } = await q
      return data ?? []
    }

    case 'log_transaction': {
      const { data: accounts } = await supabase.from('accounts').select('*')
      const acct = (accounts ?? []).find(a =>
        a.name.toLowerCase().includes((input.account as string).toLowerCase()) ||
        (input.account === 'personal' && a.type === 'personal')
      )
      if (!acct) return { error: `Account "${input.account}" not found` }
      const { data } = await supabase.from('transactions').insert({
        user_id: userId, account_id: acct.id,
        direction: input.direction as 'income' | 'expense',
        amount: input.amount as number, currency: 'AUD',
        category: (input.category as string) ?? 'other',
        merchant: (input.merchant as string) ?? null,
        occurred_on: (input.date as string) ?? today,
        note: (input.note as string) ?? null, source: 'assistant'
      }).select().single()
      return { success: true, transaction: data }
    }

    case 'log_weight': {
      const { data } = await supabase.from('weight_logs').insert({
        user_id: userId, weight: input.weight as number, unit: 'kg',
        logged_on: (input.date as string) ?? today, note: (input.note as string) ?? null
      }).select().single()
      return { success: true, log: data }
    }

    case 'log_anchor': {
      const { data: anchors } = await supabase.from('anchors').select('*').eq('active', true)
      const anchor = (anchors ?? []).find(a => a.name.toLowerCase().includes((input.anchor as string).toLowerCase()))
      if (!anchor) return { error: `Anchor "${input.anchor}" not found` }
      const date = (input.date as string) ?? today
      const existing = await supabase.from('anchor_logs').select('id').eq('anchor_id', anchor.id).eq('logged_on', date).maybeSingle()
      if (existing.data) return { success: true, message: 'Already logged' }
      await supabase.from('anchor_logs').insert({ user_id: userId, anchor_id: anchor.id, logged_on: date, value: (input.value as number) ?? 1 })
      return { success: true }
    }

    case 'create_reminder': {
      const { data } = await supabase.from('reminders').insert({
        user_id: userId, title: input.title as string, due_at: input.due_at as string,
        recurrence: (input.recurrence as string) ?? null, source: 'assistant'
      }).select().single()
      return { success: true, reminder: data }
    }

    case 'update_reminder': {
      await supabase.from('reminders').update({ status: input.status as string }).eq('id', input.id as string)
      return { success: true }
    }

    case 'create_event': {
      const { data } = await supabase.from('calendar_events').insert({
        user_id: userId, title: input.title as string,
        starts_at: input.starts_at as string,
        ends_at: (input.ends_at as string) ?? null,
        all_day: (input.all_day as boolean) ?? false, source: 'native'
      }).select().single()
      return { success: true, event: data }
    }

    default:
      return { error: `Unknown tool: ${toolName}` }
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { conversationId, message } = await req.json()

  // Get or create conversation
  let convId = conversationId
  if (!convId) {
    const { data: conv } = await supabase.from('conversations').insert({
      user_id: user.id, title: message.slice(0, 60)
    }).select().single()
    convId = conv?.id
  }

  // Save user message
  await supabase.from('messages').insert({
    user_id: user.id, conversation_id: convId, role: 'user', content: message
  })

  // Load history
  const { data: history } = await supabase.from('messages')
    .select('role,content').eq('conversation_id', convId).order('created_at').limit(40)

  const messages: Anthropic.MessageParam[] = (history ?? []).map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content ?? ''
  }))

  // Tool loop
  let toolCallsRecord: Record<string, unknown>[] = []
  let finalText = ''

  let response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: SYSTEM,
    tools,
    messages
  })

  while (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[]
    const toolResults: Anthropic.ToolResultBlockParam[] = []

    for (const block of toolUseBlocks) {
      const result = await executeTool(block.name, block.input as Record<string, unknown>, supabase, user.id)
      toolCallsRecord.push({ tool: block.name, input: block.input, result })
      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) })
    }

    messages.push({ role: 'assistant', content: response.content })
    messages.push({ role: 'user', content: toolResults })

    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM,
      tools,
      messages
    })
  }

  finalText = response.content.filter(b => b.type === 'text').map(b => (b as Anthropic.TextBlock).text).join('\n')

  // Save assistant message
  await supabase.from('messages').insert({
    user_id: user.id, conversation_id: convId, role: 'assistant',
    content: finalText, tool_calls: toolCallsRecord.length ? toolCallsRecord : null
  })

  // Bump conversation updated_at
  await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId)

  return NextResponse.json({ reply: finalText, conversationId: convId })
}
