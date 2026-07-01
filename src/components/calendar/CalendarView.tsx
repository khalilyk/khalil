'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, parseISO, isToday } from 'date-fns'
import { cn } from '@/lib/utils'

type Event = { id: string; title: string; starts_at: string; ends_at: string | null; all_day: boolean }

export default function CalendarView({ userId, events }: { userId: string; events: Event[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [month, setMonth] = useState(new Date())
  const [selected, setSelected] = useState<Date | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', starts_at: '', ends_at: '', all_day: false })
  const [loading, setLoading] = useState(false)

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const startPad = startOfMonth(month).getDay()

  async function addEvent() {
    if (!form.title || !form.starts_at) return
    setLoading(true)
    await supabase.from('calendar_events').insert({
      user_id: userId, title: form.title,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      all_day: form.all_day, source: 'native'
    })
    setShowForm(false)
    setForm({ title: '', starts_at: '', ends_at: '', all_day: false })
    setLoading(false)
    router.refresh()
  }

  const dayEvents = (d: Date) => events.filter(e => isSameDay(parseISO(e.starts_at), d))
  const selectedEvents = selected ? dayEvents(selected) : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setMonth(m => subMonths(m, 1))}><ChevronLeft size={20} /></button>
        <span className="font-medium">{format(month, 'MMMM yyyy')}</span>
        <button onClick={() => setMonth(m => addMonths(m, 1))}><ChevronRight size={20} /></button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-xs text-muted-foreground py-1">{d}</div>
        ))}
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const hasEvents = dayEvents(day).length > 0
          const sel = selected && isSameDay(day, selected)
          return (
            <button key={day.toISOString()} onClick={() => setSelected(sel ? null : day)}
              className={cn(
                'aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors',
                isToday(day) && 'ring-1 ring-primary',
                sel ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}>
              {format(day, 'd')}
              {hasEvents && <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{format(selected, 'EEEE, d MMMM')}</p>
            <Button size="sm" variant="outline" onClick={() => {
              setForm(f => ({ ...f, starts_at: format(selected, "yyyy-MM-dd'T'HH:mm") }))
              setShowForm(true)
            }}>
              <Plus size={14} className="mr-1" /> Event
            </Button>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events</p>
          ) : selectedEvents.map(e => (
            <Card key={e.id}>
              <CardContent className="py-3 px-4">
                <p className="text-sm font-medium">{e.title}</p>
                {!e.all_day && <p className="text-xs text-muted-foreground">{format(parseISO(e.starts_at), 'h:mm a')}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>New event</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
            <Input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} />
            <Input type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} placeholder="End (optional)" />
            <Button onClick={addEvent} disabled={loading} className="w-full">Add event</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
