import Link from 'next/link'
import { createClient, getCachedUser } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns'
import { LineChart } from 'lucide-react'
import CalendarView from '@/components/calendar/CalendarView'

export default async function CalendarPage() {
  const user = await getCachedUser()
  if (!user) return null
  const supabase = await createClient()

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <Link href="/review"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity">
          <LineChart size={15} /> Review
        </Link>
      </div>
      <CalendarView userId={user.id} events={events ?? []} />
    </div>
  )
}
