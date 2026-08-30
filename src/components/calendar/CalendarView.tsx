'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bell, BellOff, Plus, ChevronLeft, ChevronRight, X, Trash2, Clock } from 'lucide-react'
import {
  format, startOfWeek, addDays, addWeeks, isSameDay, parseISO, isToday, differenceInCalendarDays,
} from 'date-fns'
import { cn } from '@/lib/utils'

type Event = {
  id: string
  title: string
  starts_at: string
  ends_at: string | null
  all_day: boolean
  notify?: boolean | null
  source?: string | null
}

// Soft pastel palette for the event cards (green accent stays the app primary)
const PASTELS = [
  { bg: '#e7edd9', ink: '#3a4420' }, // sage (on-brand)
  { bg: '#fce9d4', ink: '#5c4326' }, // peach
  { bg: '#d9ecf2', ink: '#274b57' }, // sky
  { bg: '#ece3f6', ink: '#443159' }, // lilac
  { bg: '#f7e2e2', ink: '#5c2f2f' }, // blush
]
const paletteFor = (id: string) => {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return PASTELS[h % PASTELS.length]
}

const emptyForm = { id: '', title: '', starts_at: '', ends_at: '', all_day: false, notify: false }

export default function CalendarView({ userId, events }: { userId: string; events: Event[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [selected, setSelected] = useState(() => new Date())
  const [form, setForm] = useState(emptyForm)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekAnchor, i)),
    [weekAnchor],
  )

  const dayEvents = (d: Date) =>
    events
      .filter(e => isSameDay(parseISO(e.starts_at), d))
      .sort((a, b) => (a.all_day === b.all_day ? a.starts_at.localeCompare(b.starts_at) : a.all_day ? -1 : 1))

  const selectedEvents = dayEvents(selected)

  function openNew() {
    const base = new Date(selected); base.setHours(9, 0, 0, 0)
    setForm({ ...emptyForm, starts_at: format(base, "yyyy-MM-dd'T'HH:mm") })
    setOpen(true)
  }
  function openEdit(e: Event) {
    setForm({
      id: e.id, title: e.title,
      starts_at: format(parseISO(e.starts_at), "yyyy-MM-dd'T'HH:mm"),
      ends_at: e.ends_at ? format(parseISO(e.ends_at), "yyyy-MM-dd'T'HH:mm") : '',
      all_day: e.all_day, notify: !!e.notify,
    })
    setOpen(true)
  }

  async function save() {
    if (!form.title || !form.starts_at) return
    setBusy(true)
    const row = {
      user_id: userId,
      title: form.title.trim(),
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      all_day: form.all_day,
      source: 'native',
    }
    let id = form.id
    if (form.id) {
      await supabase.from('calendar_events').update(row).eq('id', form.id)
    } else {
      const { data } = await supabase.from('calendar_events').insert(row).select('id').maybeSingle()
      id = (data as { id: string } | null)?.id ?? ''
    }
    // Best-effort: needs migration 012 (calendar_events.notify). Ignored if the column isn't there yet.
    if (id) await supabase.from('calendar_events').update({ notify: form.notify }).eq('id', id)
    setBusy(false); setOpen(false); setForm(emptyForm)
    router.refresh()
  }

  async function remove() {
    if (!form.id) return
    setBusy(true)
    await supabase.from('calendar_events').delete().eq('id', form.id)
    setBusy(false); setOpen(false); setForm(emptyForm)
    router.refresh()
  }

  // Toggle the per-event reminder straight from the card
  async function toggleNotify(e: Event) {
    await supabase.from('calendar_events').update({ notify: !e.notify }).eq('id', e.id)
    router.refresh()
  }

  const relLabel = (() => {
    const diff = differenceInCalendarDays(selected, new Date())
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Tomorrow'
    if (diff === -1) return 'Yesterday'
    return format(selected, 'EEEE')
  })()

  return (
    <div className="space-y-6">
      {/* Editorial header */}
      <div>
        <p className="text-sm text-muted-foreground">{format(selected, 'EEEE, d MMMM')}</p>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[0.95]">
          {relLabel}
          <span className="text-muted-foreground"> ({selectedEvents.length})</span>
        </h1>
      </div>

      {/* Week strip */}
      <div className="flex items-center gap-2">
        <button onClick={() => setWeekAnchor(w => addWeeks(w, -1))}
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 grid grid-cols-7 gap-1.5">
          {weekDays.map(day => {
            const sel = isSameDay(day, selected)
            const has = dayEvents(day).length > 0
            return (
              <button key={day.toISOString()} onClick={() => setSelected(day)}
                className={cn(
                  'flex flex-col items-center gap-1 py-2 rounded-2xl transition-colors',
                  sel ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                )}>
                <span className={cn('text-[11px] font-medium', !sel && 'text-muted-foreground')}>{format(day, 'EEEEEE')}</span>
                <span className={cn('text-base font-bold tabular-nums', isToday(day) && !sel && 'text-primary')}>{format(day, 'd')}</span>
                <span className={cn('w-1 h-1 rounded-full', has ? (sel ? 'bg-primary-foreground' : 'bg-primary') : 'bg-transparent')} />
              </button>
            )
          })}
        </div>
        <button onClick={() => setWeekAnchor(w => addWeeks(w, 1))}
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => { const t = startOfWeek(new Date(), { weekStartsOn: 1 }); setWeekAnchor(t); setSelected(new Date()) }}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-sm font-medium hover:bg-muted transition-colors">
          <ChevronLeft size={13} /> Today <ChevronRight size={13} />
        </button>
        <button onClick={openNew}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-1.5 text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus size={15} /> Event
        </button>
      </div>

      {/* Agenda for the selected day */}
      <div className="space-y-3">
        {selectedEvents.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border py-12 text-center">
            <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
            <button onClick={openNew} className="mt-2 text-sm font-semibold text-primary hover:opacity-80">Add an event →</button>
          </div>
        ) : selectedEvents.map(e => {
          const pal = paletteFor(e.id)
          const notify = !!e.notify
          return (
            <div key={e.id} className="rounded-3xl p-4 sm:p-5 flex gap-4" style={{ backgroundColor: pal.bg, color: pal.ink }}>
              {/* time rail */}
              <div className="shrink-0 w-14 pt-1 text-sm font-semibold tabular-nums" style={{ color: pal.ink }}>
                {e.all_day ? 'All day' : format(parseISO(e.starts_at), 'h:mm')}
                {!e.all_day && <div className="text-[11px] opacity-60">{format(parseISO(e.starts_at), 'a')}</div>}
              </div>
              {/* body — tap to edit */}
              <button onClick={() => openEdit(e)} className="flex-1 min-w-0 text-left">
                <p className="text-xl font-bold leading-tight tracking-tight break-words">{e.title}</p>
                {!e.all_day && e.ends_at && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs opacity-70">
                    <Clock size={12} /> until {format(parseISO(e.ends_at), 'h:mm a')}
                  </p>
                )}
              </button>
              {/* notify toggle */}
              <button onClick={() => toggleNotify(e)} title={notify ? 'Reminder on' : 'Reminder off'}
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                style={{ backgroundColor: notify ? '#141414' : 'rgba(20,20,20,0.06)', color: notify ? '#fff' : pal.ink }}>
                {notify ? <Bell size={16} /> : <BellOff size={16} />}
              </button>
            </div>
          )
        })}
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

            <div className="grid grid-cols-1 gap-3">
              <label className="text-xs font-medium text-muted-foreground">Starts
                <input type={form.all_day ? 'date' : 'datetime-local'}
                  value={form.all_day ? form.starts_at.slice(0, 10) : form.starts_at}
                  onChange={e => setForm(f => ({ ...f, starts_at: form.all_day ? `${e.target.value}T00:00` : e.target.value }))}
                  className="mt-1 w-full h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary" />
              </label>
              {!form.all_day && (
                <label className="text-xs font-medium text-muted-foreground">Ends (optional)
                  <input type="datetime-local" value={form.ends_at}
                    onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
                    className="mt-1 w-full h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary" />
                </label>
              )}
            </div>

            <button type="button" onClick={() => setForm(f => ({ ...f, notify: !f.notify }))}
              className="w-full flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-medium">
                {form.notify ? <Bell size={16} className="text-primary" /> : <BellOff size={16} className="text-muted-foreground" />}
                Notify me before it starts
              </span>
              <span className={cn('w-10 h-6 rounded-full p-0.5 transition-colors', form.notify ? 'bg-primary' : 'bg-muted')}>
                <span className={cn('block w-5 h-5 rounded-full bg-white transition-transform', form.notify && 'translate-x-4')} />
              </span>
            </button>

            <div className="flex items-center gap-2 pt-1">
              {form.id && (
                <button onClick={remove} disabled={busy}
                  className="w-11 h-11 shrink-0 rounded-xl border border-border flex items-center justify-center text-destructive hover:bg-destructive/10">
                  <Trash2 size={17} />
                </button>
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
