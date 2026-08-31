'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Check, Dumbbell } from 'lucide-react'
import { startOfWeek, addDays, format } from 'date-fns'
import { cn } from '@/lib/utils'
import { PROGRAM, totalExercises, type WorkoutDay } from '@/lib/workout'

type Log = { logged_on: string; exercise: string; weight?: number | null; set_weights?: (number | null)[] | null }

// Selectable weights: 2.5 - 300 kg in 2.5 kg steps
const WEIGHTS = Array.from({ length: 120 }, (_, i) => 2.5 + i * 2.5)

// Number of sets from a detail string like "4 × 8-10"; 0 = no weighted sets (e.g. cardio)
const setsFor = (detail: string) => {
  const m = detail.match(/^(\d+)\s*×/)
  return m ? Math.min(8, Math.max(1, Number(m[1]))) : 0
}

export default function WorkoutSection({ userId, weekLogs }: { userId: string; weekLogs: Log[] }) {
  const router = useRouter()
  const todayWd = new Date().getDay() // 0 Sun .. 6 Sat
  const [selected, setSelected] = useState<number>(todayWd >= 1 && todayWd <= 5 ? todayWd : 1)
  const [doneSet, setDoneSet] = useState<Set<string>>(
    () => new Set(weekLogs.map(l => `${l.logged_on}|${l.exercise}`))
  )
  // Weight lifted per set, keyed by `${date}|${exercise}` -> array of set weights (strings; '' = unset)
  const [weights, setWeights] = useState<Map<string, string[]>>(
    () => new Map(
      weekLogs
        .filter(l => Array.isArray(l.set_weights) && l.set_weights.length)
        .map(l => [`${l.logged_on}|${l.exercise}`, (l.set_weights as (number | null)[]).map(w => w == null ? '' : String(w))])
    )
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
      await persistSets(supabase, ex, weights.get(key))
    } else {
      await supabase.from('workout_logs').delete().eq('logged_on', date).eq('exercise', ex)
    }
    const count = [...next].filter(k => k.startsWith(`${date}|`)).length
    await syncCalendar(day, date, count)
    router.refresh()
  }

  // Best-effort: write the per-set weights (needs migration 013's set_weights column)
  async function persistSets(supabase: Awaited<ReturnType<typeof client>>, ex: string, arr?: string[]) {
    if (!arr || !arr.some(v => v !== '')) return
    await supabase.from('workout_logs')
      .update({ set_weights: arr.map(v => v === '' ? null : Number(v)) })
      .eq('logged_on', date).eq('exercise', ex)
  }

  // Set the weight for one set of an exercise (logging it also marks the exercise done)
  async function setSetWeight(ex: string, sets: number, i: number, val: string) {
    const key = `${date}|${ex}`
    const arr = [...(weights.get(key) ?? Array(sets).fill(''))]
    while (arr.length < sets) arr.push('')
    arr[i] = val
    setWeights(m => new Map(m).set(key, arr))

    const next = new Set(doneSet)
    if (arr.some(v => v !== '')) next.add(key)
    setDoneSet(next)

    const supabase = await client()
    await supabase.from('workout_logs').upsert(
      { user_id: userId, logged_on: date, exercise: ex },
      { onConflict: 'user_id,logged_on,exercise' }
    )
    await persistSets(supabase, ex, arr)
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
        <CardContent className="py-0 space-y-5">
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
                const sets = setsFor(ex.detail)
                const arr = weights.get(key) ?? []
                return (
                  <div key={ex.name} className="w-full py-2 flex items-center gap-3 group">
                    <button onClick={() => toggle(ex.name)} aria-label={checked ? 'Mark undone' : 'Mark done'}
                      className={cn('w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors',
                        checked ? 'bg-primary border-primary text-primary-foreground' : 'border-border group-hover:border-primary')}>
                      {checked && <Check size={14} strokeWidth={3} />}
                    </button>
                    <button onClick={() => toggle(ex.name)} className="flex-1 min-w-0 text-left">
                      <span className={cn('block text-sm font-medium leading-snug', checked && 'text-muted-foreground')}>{ex.name}</span>
                      <span className="block text-[11px] text-muted-foreground">{ex.detail}</span>
                    </button>
                    {/* Weight per set (skipped for cardio / bodyweight / band moves) */}
                    {sets > 0 && !ex.bw && (
                      <div className="shrink-0 w-40 grid grid-cols-2 gap-1.5">
                        {Array.from({ length: sets }).map((_, i) => (
                          <select key={i} value={arr[i] ?? ''} title={`Set ${i + 1}`}
                            onChange={e => setSetWeight(ex.name, sets, i, e.target.value)}
                            className="w-full h-8 rounded-lg border border-border bg-card pl-2 text-sm tabular-nums outline-none focus:border-primary">
                            <option value="">S{i + 1}</option>
                            {WEIGHTS.map(w => <option key={w} value={w}>{w}</option>)}
                          </select>
                        ))}
                      </div>
                    )}
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
