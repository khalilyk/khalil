import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { format, addDays, addWeeks, addMonths } from 'date-fns'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createServiceClient()
  const now = new Date().toISOString()

  const { data: dueReminders } = await supabase
    .from('reminders')
    .select('*')
    .eq('status', 'pending')
    .lte('due_at', now)

  if (!dueReminders?.length) return NextResponse.json({ processed: 0 })

  for (const reminder of dueReminders) {
    // Create notification
    await supabase.from('notifications').insert({
      user_id: reminder.user_id, type: 'reminder',
      title: reminder.title, body: `Due: ${format(new Date(reminder.due_at), 'd MMM, h:mm a')}`,
      related_id: reminder.id
    })

    // Mark done
    await supabase.from('reminders').update({ status: 'done' }).eq('id', reminder.id)

    // Create next occurrence for recurring
    if (reminder.recurrence) {
      let nextDue: Date
      const base = new Date(reminder.due_at)
      if (reminder.recurrence === 'daily') nextDue = addDays(base, 1)
      else if (reminder.recurrence === 'weekly') nextDue = addWeeks(base, 1)
      else nextDue = addMonths(base, 1)

      await supabase.from('reminders').insert({
        user_id: reminder.user_id, title: reminder.title,
        due_at: nextDue.toISOString(), recurrence: reminder.recurrence,
        status: 'pending', source: reminder.source
      })
    }
  }

  return NextResponse.json({ processed: dueReminders.length })
}
