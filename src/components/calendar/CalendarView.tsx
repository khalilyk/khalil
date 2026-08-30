'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, ChevronLeft, ChevronRight, X, Trash2, Clock } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, parseISO, isToday,
  differenceInCalendarDays,
} from 'date-fns'
import { cn } from '@/lib/utils'

type Event = { id: string; title: string; starts_at: string; ends_at: string | null; all_day: boolean }

const emptyForm = { id: '', title: '', starts_at: '', ends_at: '', all_day: false }

export default function CalendarView({ userId, events }: { userId: string; events: Event[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [month, setMonth] = useState(() => new Date())
  const [selected, setSelected] = useState(() => new Date())
  const [form, setForm] = useState(emptyForm)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const startPad = startOfMonth(month).getDay()

  const dayEvents = (d: Date) =>
    events.filter(e => isSameDay(parseISO(e.starts_at), d))
      .sort((a, b) => (a.all_day === b.all_day ? a.starts_at.localeCompare(b.starts_at) : a.all_day ? -1 : 1))
  const selectedEvents = dayEvents(selected)

  function openNew() {
    const base = new Date(selected); base.setHours(9, 0, 0, 0)
    setForm({ ...emptyForm, starts_at: format(base, "yyyy-MM-dd'T'HH:mm") }); setOpen(true)
  }
  function openEdit(e: Event) {
    setForm({
      id: e.id, title: e.title,
      starts_at: format(parseISO(e.starts_at), "yyyy-MM-dd'T'HH:mm"),
      ends_at: e.ends_at ? format(parseISO(e.ends_at), "yyyy-MM-dd'T'HH:mm") : '',
      all_day: e.all_day,
    }); setOpen(true)
  }
  async function save() {
    if (!form.title || !form.starts_at) return
    setBusy(true)
    const row = {
      user_id: userId, title: form.title.trim(),
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      all_day: form.all_day, source: 'native',
    }
    if (form.id) await supabase.from('calendar_events').update(row).eq('id', form.id)
    else await supabase.from('calendar_events').insert(row)
    setBusy(false); setOpen(false); setForm(emptyForm); router.refresh()
  }
  async function remove() {
    if (!form.id) return
    setBusy(true)
    await supabase.from('calendar_events').delete().eq('id', form.id)
    setBusy(false); setOpen(false); setForm(emptyForm); router.refresh()
  }

  const rel = (() => {
    const d = differenceInCalendarDays(selected, new Date())
    return d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : d === -1 ? 'Yesterday' : format(selected, 'EEEE')
  })()

  return (
    <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-5 items-start">
      {/* LEFT — dates */}
      <div className="kk-rise rounded-3xl bg-card border border-border p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setMonth(m => subMonths(m, 1))} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"><ChevronLeft size={18} /></button>
          <span className="font-bold tracking-tight">{format(month, 'MMMM yyyy')}</span>
          <button onClick={() => setMonth(m => addMonths(m, 1))} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"><ChevronRight size={18} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="text-[11px] font-medium text-muted-foreground py-1">{d}</div>)}
          {Array.from({ length: startPad }).map((_, i) => <div key={`p-${i}`} />)}
          {days.map(day => {
            const has = dayEvents(day).length > 0
            const sel = isSameDay(day, selected)
            return (
              <button key={day.toISOString()} onClick={() => setSelected(day)}
                className={cn('aspect-square rounded-2xl flex flex-col items-center justify-center text-sm transition-all',
                  sel ? 'bg-primary text-primary-foreground font-bold shadow-[0_8px_20px_-8px_rgba(112,137,46,0.8)]'
                    : isToday(day) ? 'text-primary font-bold hover:bg-muted' : 'hover:bg-muted')}>
                {format(day, 'd')}
                <span className={cn('mt-0.5 w-1 h-1 rounded-full', has ? (sel ? 'bg-primary-foreground' : 'bg-primary') : 'bg-transparent')} />
              </button>
            )
          })}
        </div>
        <button onClick={() => { setMonth(new Date()); setSelected(new Date()) }}
          className="mt-3 w-full rounded-full border border-border py-2 text-sm font-medium hover:bg-muted transition-colors">Today</button>
      </div>

      {/* RIGHT — activities */}
      <div className="kk-rise space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{format(selected, 'EEEE, d MMMM')}</p>
            <h2 className="text-2xl font-extrabold tracking-tight">{rel}<span className="text-muted-foreground"> ({selectedEvents.length})</span></h2>
          </div>
          <button onClick={openNew} className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity">
            <Plus size={15} /> Add
          </button>
        </div>

        {selectedEvents.length === 0 ? (
          <button onClick={openNew} className="w-full rounded-3xl border border-dashed border-border py-12 text-center hover:bg-muted/40 transition-colors">
            <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
            <p className="mt-1 text-sm font-semibold text-primary">Add an event →</p>
          </button>
        ) : (
          <div className="space-y-2.5">
            {selectedEvents.map(e => (
              <button key={e.id} onClick={() => openEdit(e)}
                className="w-full text-left rounded-2xl bg-card border border-border p-4 flex gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="shrink-0 w-14 text-sm font-semibold tabular-nums">
                  {e.all_day ? 'All day' : format(parseISO(e.starts_at), 'h:mm')}
                  {!e.all_day && <div className="text-[11px] text-muted-foreground">{format(parseISO(e.starts_at), 'a')}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold leading-tight break-words">{e.title}</p>
                  {!e.all_day && e.ends_at && (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock size={12} /> until {format(parseISO(e.ends_at), 'h:mm a')}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add / edit sheet */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={() => setOpen(false)}>
          <div className="w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90dvh] overflow-y-auto"
            style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }} onClick={ev => ev.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight">{form.id ? 'Edit event' : 'New event'}</h2>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted"><X size={18} /></button>
            </div>
            <input autoFocus placeholder="What's happening?" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full h-12 rounded-xl border border-border bg-card px-4 text-base outline-none focus:border-primary" />
            <label className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <span className="text-sm font-medium">All day</span>
              <input type="checkbox" checked={form.all_day} onChange={e => setForm(f => ({ ...f, all_day: e.target.checked }))} className="h-5 w-5 accent-[var(--primary)]" />
            </label>
            <label className="block text-xs font-medium text-muted-foreground">Starts
              <input type={form.all_day ? 'date' : 'datetime-local'}
                value={form.all_day ? form.starts_at.slice(0, 10) : form.starts_at}
                onChange={e => setForm(f => ({ ...f, starts_at: form.all_day ? `${e.target.value}T00:00` : e.target.value }))}
                className="mt-1 w-full h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary" />
            </label>
            {!form.all_day && (
              <label className="block text-xs font-medium text-muted-foreground">Ends (optional)
                <input type="datetime-local" value={form.ends_at}
                  onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
                  className="mt-1 w-full h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary" />
              </label>
            )}
            <div className="flex items-center gap-2 pt-1">
              {form.id && (
                <button onClick={remove} disabled={busy} className="w-11 h-11 shrink-0 rounded-xl border border-border flex items-center justify-center text-destructive hover:bg-destructive/10"><Trash2 size={17} /></button>
              )}
              <button onClick={save} disabled={busy || !form.title || !form.starts_at}
                className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity">
                {busy ? 'Saving…' : form.id ? 'Save changes' : 'Add event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
