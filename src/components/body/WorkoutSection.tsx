'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Check, Dumbbell } from 'lucide-react'
import { startOfWeek, addDays, format } from 'date-fns'
import { cn } from '@/lib/utils'
import { PROGRAM, totalExercises, type WorkoutDay } from '@/lib/workout'

type Log = { logged_on: string; exercise: string; weight?: number | null }

// Selectable weights: 10 - 70 kg in 2.5 kg steps
const WEIGHTS = Array.from({ length: 25 }, (_, i) => 10 + i * 2.5)

export default function WorkoutSection({ userId, weekLogs }: { userId: string; weekLogs: Log[] }) {
  const router = useRouter()
  const todayWd = new Date().getDay() // 0 Sun .. 6 Sat
  const [selected, setSelected] = useState<number>(todayWd >= 1 && todayWd <= 5 ? todayWd : 1)
  const [doneSet, setDoneSet] = useState<Set<string>>(
    () => new Set(weekLogs.map(l => `${l.logged_on}|${l.exercise}`))
  )
  // Weight lifted per exercise, keyed by `${date}|${exercise}`
  const [weights, setWeights] = useState<Map<string, string>>(
    () => new Map(weekLogs.filter(l => l.weight != null).map(l => [`${l.logged_on}|${l.exercise}`, String(l.weight)]))
  )

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const dateFor = (weekday: number) => format(addDays(weekStart, weekday - 1), 'yyyy-MM-dd')
  const day = PROGRAM.find(d => d.weekday === selected)!
  const date = dateFor(selected)
  const isDone = (ex: string) => doneSet.has(`${date}|${ex}`)
  const doneCount = [...doneSet].filter(k => k.startsWith(`${date}|`)).length
  const total = totalExercises(day)

  async function client() {
    const { createClient } = await import('@/lib/supabase/client')
    return createClient()
  }

  // Mirror the day's progress into the calendar so it's reviewable later
  async function syncCalendar(d: WorkoutDay, dt: string, count: number) {
    const supabase = await client()
    const ext = `workout:${dt}`
    const { data: existing } = await supabase
      .from('calendar_events').select('id').eq('external_id', ext).maybeSingle()
    if (count === 0) {
      if (existing) await supabase.from('calendar_events').delete().eq('id', (existing as { id: string }).id)
      return
    }
    const title = `💪 ${d.title} (${count}/${totalExercises(d)})`
    if (existing) {
      await supabase.from('calendar_events').update({ title }).eq('id', (existing as { id: string }).id)
    } else {
      await supabase.from('calendar_events').insert({
        user_id: userId, title, starts_at: `${dt}T00:00:00`, ends_at: null,
        all_day: true, source: 'native', external_id: ext,
      })
    }
  }

  async function toggle(ex: string) {
    const key = `${date}|${ex}`
    const next = new Set(doneSet)
    const nowDone = !next.has(key)
    nowDone ? next.add(key) : next.delete(key)
    setDoneSet(next)

    const supabase = await client()
    if (nowDone) {
      await supabase.from('workout_logs').upsert(
        { user_id: userId, logged_on: date, exercise: ex },
        { onConflict: 'user_id,logged_on,exercise' }
      )
      // Best-effort weight (needs migration 013). Silently ignored if the column is absent.
      const w = weights.get(key)
      if (w && w.trim() !== '') await supabase.from('workout_logs').update({ weight: Number(w) }).eq('logged_on', date).eq('exercise', ex)
    } else {
      await supabase.from('workout_logs').delete().eq('logged_on', date).eq('exercise', ex)
    }
    const count = [...next].filter(k => k.startsWith(`${date}|`)).length
    await syncCalendar(day, date, count)
    router.refresh()
  }

  // Save the weight for an exercise (logging it also marks the exercise done)
  async function saveWeight(ex: string, val?: string) {
    const key = `${date}|${ex}`
    const raw = (val ?? weights.get(key) ?? '').trim()
    const w = raw === '' ? null : Number(raw)
    if (raw !== '' && Number.isNaN(w as number)) return
    const next = new Set(doneSet)
    if (raw !== '') next.add(key)
    setDoneSet(next)

    const supabase = await client()
    // Ensure the row exists / is marked done (works without migration 013)…
    await supabase.from('workout_logs').upsert(
      { user_id: userId, logged_on: date, exercise: ex },
      { onConflict: 'user_id,logged_on,exercise' }
    )
    // …then set the weight (best-effort; needs migration 013)
    await supabase.from('workout_logs').update({ weight: w }).eq('logged_on', date).eq('exercise', ex)
    await syncCalendar(day, date, [...next].filter(k => k.startsWith(`${date}|`)).length)
    router.refresh()
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Dumbbell size={18} /> Workout</h2>
        <span className="text-sm text-muted-foreground">{doneCount}/{total} done</span>
      </div>

      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PROGRAM.map(d => {
          const dt = dateFor(d.weekday)
          const n = [...doneSet].filter(k => k.startsWith(`${dt}|`)).length
          const isTodayTab = d.weekday === todayWd
          return (
            <button key={d.key} onClick={() => setSelected(d.weekday)}
              className={cn('shrink-0 rounded-2xl px-3 py-2 border text-center transition-colors min-w-[88px]',
                selected === d.weekday ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}>
              <span className="block text-xs font-semibold uppercase tracking-wide">
                {['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'][d.weekday]}{isTodayTab ? ' •' : ''}
              </span>
              <span className={cn('block text-[11px] truncate',
                selected === d.weekday ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                {n > 0 ? `${n} done` : d.title}
              </span>
            </button>
          )
        })}
      </div>

      {/* Selected day */}
      <Card>
        <CardContent className="py-4 space-y-5">
          <div className="flex items-baseline justify-between">
            <p className="font-semibold">{['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][selected]} - {day.title}</p>
            <p className="text-xs text-muted-foreground">{format(addDays(weekStart, selected - 1), 'd MMM')}</p>
          </div>

          {day.blocks.map((block, bi) => (
            <div key={bi} className="space-y-1.5">
              {block.heading && (
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{block.heading}</p>
              )}
              {block.exercises.map(ex => {
                const checked = isDone(ex.name)
                const key = `${date}|${ex.name}`
                return (
                  <div key={ex.name} className="w-full flex items-center gap-3 py-2 group">
                    <button onClick={() => toggle(ex.name)} aria-label={checked ? 'Mark undone' : 'Mark done'}
                      className={cn('w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors',
                        checked ? 'bg-primary border-primary text-primary-foreground' : 'border-border group-hover:border-primary')}>
                      {checked && <Check size={14} strokeWidth={3} />}
                    </button>
                    <button onClick={() => toggle(ex.name)} className="flex-1 min-w-0 text-left">
                      <span className={cn('block text-sm font-medium', checked && 'text-muted-foreground')}>{ex.name}</span>
                      <span className="block text-[11px] text-muted-foreground">{ex.detail}</span>
                    </button>
                    {/* Weight lifted */}
                    <div className="shrink-0 flex items-center gap-1">
                      <select
                        value={weights.get(key) ?? ''}
                        onChange={e => { const v = e.target.value; setWeights(m => new Map(m).set(key, v)); saveWeight(ex.name, v) }}
                        className="w-[88px] h-9 rounded-lg border border-border bg-card px-2.5 text-sm tabular-nums outline-none focus:border-primary">
                        <option value="">—</option>
                        {WEIGHTS.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                      <span className="text-xs text-muted-foreground">kg</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}
