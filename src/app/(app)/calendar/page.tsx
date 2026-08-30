import { createClient, getCachedUser } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'
import CalendarView from '@/components/calendar/CalendarView'

export default async function CalendarPage() {
  const user = await getCachedUser()
  if (!user) return null
  const supabase = await createClient()

  const rangeStart = format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd')
  const rangeEnd = format(endOfMonth(addMonths(new Date(), 2)), 'yyyy-MM-dd')

  const { data: events } = await supabase
    .from('calendar_events')
    .select('*')
    .gte('starts_at', rangeStart)
    .lte('starts_at', rangeEnd)
    .order('starts_at')

  return (
    <div className="w-full max-w-2xl mx-auto px-4 lg:px-8 py-6">
      <CalendarView userId={user.id} events={events ?? []} />
    </div>
  )
}
