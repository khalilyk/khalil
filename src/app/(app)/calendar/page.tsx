import { createClient } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns'
import CalendarView from '@/components/calendar/CalendarView'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(addMonths(new Date(), 1)), 'yyyy-MM-dd')

  const { data: events } = await supabase
    .from('calendar_events')
    .select('*')
    .gte('starts_at', monthStart)
    .lte('starts_at', monthEnd)
    .order('starts_at')

  return (
    <div className="w-full px-4 lg:px-8 py-6 space-y-6">
      <h1 className="text-xl font-semibold">Calendar</h1>
      <CalendarView userId={user.id} events={events ?? []} />
    </div>
  )
}
