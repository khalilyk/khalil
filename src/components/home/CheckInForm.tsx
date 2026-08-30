'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sun, Moon, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type CheckIn = {
  id: string; slot: 'morning' | 'evening'; mood: number | null; energy: number | null
  note: string | null; reflection_text: string | null
}
type Slot = 'morning' | 'evening'

const MOODS = [
  { v: 1, label: '😔 Rough' },
  { v: 2, label: '😕 Low' },
  { v: 3, label: '😐 Okay' },
  { v: 4, label: '🙂 Good' },
  { v: 5, label: '😄 Great' },
]
const ENERGY = [
  { v: 1, label: '⚡ 1 · Drained' },
  { v: 2, label: '⚡ 2 · Low' },
  { v: 3, label: '⚡ 3 · Steady' },
  { v: 4, label: '⚡ 4 · High' },
  { v: 5, label: '⚡ 5 · Peak' },
]
const QUICK = {
  morning: ['Locked in and focused', 'Steady and calm', 'Low energy, pushing through', 'Motivated', 'Distracted'],
  evening: ['Great day', 'Good, productive', 'Average', 'Tough day', 'Rough — reset tomorrow'],
}

export default function CheckInForm({ userId, today, bySlot }: {
  userId: string; today: string; bySlot: Partial<Record<Slot, CheckIn>>
}) {
  const router = useRouter()
  const supabase = createClient()

  const [slot, setSlot] = useState<Slot>(new Date().getHours() < 15 ? 'morning' : 'evening')
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  // Load the selected slot's saved values when switching
  useEffect(() => {
    const ex = bySlot[slot]
    setMood(ex?.mood ?? null)
    setEnergy(ex?.energy ?? null)
    setNote(ex?.note ?? '')
  }, [slot, bySlot])

  async function save() {
    setLoading(true)
    // 1) Save the check-in itself
    const { error } = await supabase.from('check_ins').upsert(
      { user_id: userId, check_in_date: today, slot, mood, energy, note: note || null },
      { onConflict: 'user_id,check_in_date,slot' }
    )
    if (error) { setLoading(false); alert(`Could not save: ${error.message}`); return }

    // 2) Mirror to the calendar — never let a calendar hiccup block the save
    try { await syncCalendar() } catch (e) { console.error('calendar sync failed', e) }

    // 3) Kick off the coach reflection in the background (don't block the UI)
    fetch('/api/coach/reflect', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today, slot }),
    }).catch(() => {})

    // 4) Refresh the form to its saved state + flash a confirmation
    setLoading(false)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2500)
    router.refresh()
  }

  // Mirror the day's check-ins into the calendar so they're reviewable
  async function syncCalendar() {
    const { data: rows } = await supabase
      .from('check_ins').select('slot, mood').eq('check_in_date', today)
    const doneSlots = new Set((rows ?? []).filter(r => r.mood).map(r => r.slot))
    doneSlots.add(slot) // include the one we just saved
    const parts = [doneSlots.has('morning') && 'AM', doneSlots.has('evening') && 'PM'].filter(Boolean)
    const mL = MOODS.find(m => m.v === mood)?.label
    const title = `📝 Check-in ${parts.join(' + ')}${mL ? ` · ${mL.split(' ')[1] ?? mL}` : ''}`
    const ext = `checkin:${today}`

    const found = await supabase.from('calendar_events').select('id').eq('external_id', ext).maybeSingle()
    if (found.data) {
      await supabase.from('calendar_events').update({ title }).eq('id', (found.data as { id: string }).id)
    } else {
      await supabase.from('calendar_events').insert({
        user_id: userId, title, starts_at: `${today}T00:00:00`, ends_at: null,
        all_day: true, source: 'native', external_id: ext,
      })
    }
  }

  const saved = !!bySlot[slot]?.mood

  return (
    <Card className="kk-rise relative overflow-hidden">
      <span className="kk-glow" style={{ left: '90%', top: '0%', width: 190, height: 190, background: 'radial-gradient(circle, rgba(112,137,46,0.16), transparent 70%)' }} />
      <CardHeader className="relative pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Check-in</CardTitle>
        {/* AM/PM toggle next to the title */}
        <div className="flex gap-1 bg-muted rounded-full p-1 shrink-0">
          {(['morning', 'evening'] as Slot[]).map(s => (
            <button key={s} onClick={() => setSlot(s)}
              className={cn('flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 transition-colors',
                slot === s ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
              {s === 'morning' ? <Sun size={13} /> : <Moon size={13} />}
              {s === 'morning' ? 'AM' : 'PM'}
              {bySlot[s]?.mood && <Check size={12} className="text-primary" />}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="relative space-y-3">
        {/* Mood + Energy on one line */}
        <div className="flex flex-wrap items-center gap-2">
          <select value={mood ?? ''} onChange={e => setMood(e.target.value ? Number(e.target.value) : null)}
            className="flex-1 min-w-[120px] h-10 rounded-xl border border-input bg-transparent px-3 text-sm">
            <option value="">Mood</option>
            {MOODS.map(m => <option key={m.v} value={m.v}>{m.label}</option>)}
          </select>
          <select value={energy ?? ''} onChange={e => setEnergy(e.target.value ? Number(e.target.value) : null)}
            className="flex-1 min-w-[120px] h-10 rounded-xl border border-input bg-transparent px-3 text-sm">
            <option value="">Energy</option>
            {ENERGY.map(en => <option key={en.v} value={en.v}>{en.label}</option>)}
          </select>
        </div>

        {/* One field — type your own or pick a quick answer */}
        <input
          list={`quick-${slot}`}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder={slot === 'morning' ? 'How are you feeling? (type or pick)' : 'How did it go? (type or pick)'}
          className="w-full h-10 rounded-xl border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring"
        />
        <datalist id={`quick-${slot}`}>
          {QUICK[slot].map(q => <option key={q} value={q} />)}
        </datalist>

        <Button onClick={save} disabled={loading || justSaved || (!mood && !energy)}
          className={cn('w-full rounded-full gap-1.5', justSaved && 'bg-green-600 hover:bg-green-600')}>
          {loading ? 'Saving…'
            : justSaved ? <><Check size={15} strokeWidth={3} /> Saved to calendar</>
            : saved ? `Update ${slot === 'morning' ? 'morning' : 'evening'} check-in`
            : `Save ${slot === 'morning' ? 'morning' : 'evening'} check-in`}
        </Button>
      </CardContent>
    </Card>
  )
}
