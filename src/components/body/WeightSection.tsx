'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { format, parseISO, subDays, addWeeks } from 'date-fns'
import { TrendingDown, TrendingUp, Minus, Target, Pencil, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Log = { id: string; weight: number; logged_on: string; note: string | null }

function movingAverage(logs: Log[], window = 7) {
  return logs.map((log, i) => {
    const slice = logs.slice(Math.max(0, i - window + 1), i + 1)
    const avg = slice.reduce((s, l) => s + l.weight, 0) / slice.length
    return { ...log, avg: parseFloat(avg.toFixed(2)) }
  })
}

export default function WeightSection({ userId, logs, weightGoal, weightRate, unit, today }: {
  userId: string; logs: Log[]; weightGoal: number | null; weightRate: number | null; unit: string; today: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [weight, setWeight] = useState('')
  const [loading, setLoading] = useState(false)
  const [editPlan, setEditPlan] = useState(false)
  const [logging, setLogging] = useState(false)
  const [goalInput, setGoalInput] = useState(weightGoal?.toString() ?? '')
  const [rateInput, setRateInput] = useState(weightRate?.toString() ?? '')

  const data = movingAverage(logs)
  const latest = logs[logs.length - 1]
  const distToGoal = latest && weightGoal ? (latest.weight - weightGoal).toFixed(1) : null

  // Difference vs ~a week ago: most recent log on/before (latest date − 7 days)
  const weekTarget = latest ? format(subDays(parseISO(latest.logged_on), 7), 'yyyy-MM-dd') : null
  const prior = weekTarget ? [...logs].reverse().find(l => l.logged_on <= weekTarget) : null
  const weekDiff = latest && prior ? +(latest.weight - prior.weight).toFixed(1) : null

  // ── Plan: projected finish + pace ────────────────────
  const rate = weightRate && weightRate > 0 ? weightRate : null
  const projection = latest && weightGoal != null && rate ? (() => {
    const remaining = latest.weight - weightGoal
    if (Math.abs(remaining) < 0.05) return { done: true } as const
    const losing = remaining > 0
    const weeks = Math.abs(remaining) / rate
    return { done: false, losing, weeks, finish: addWeeks(new Date(), weeks) } as const
  })() : null

  let pace: { label: string; tone: 'ok' | 'fast' | 'slow' | 'off' } | null = null
  if (projection && !projection.done && weekDiff !== null && rate) {
    const movingRight = (projection.losing && weekDiff < 0) || (!projection.losing && weekDiff > 0)
    const mag = Math.abs(weekDiff)
    if (!movingRight && weekDiff !== 0) pace = { label: 'Off track - wrong direction', tone: 'off' }
    else if (weekDiff === 0) pace = { label: 'Stalled this week', tone: 'slow' }
    else if (mag > rate * 1.5) pace = { label: 'Too fast - ease off', tone: 'fast' }
    else if (mag < rate * 0.5) pace = { label: 'Too slow - push a little', tone: 'slow' }
    else pace = { label: 'On track', tone: 'ok' }
  }

  async function savePlan() {
    setLoading(true)
    await supabase.from('profiles').update({
      weight_goal: goalInput ? parseFloat(goalInput) : null,
      weight_rate: rateInput ? parseFloat(rateInput) : null,
    }).eq('id', userId)
    setLoading(false)
    setEditPlan(false)
    router.refresh()
  }

  async function logWeight() {
    if (!weight) return
    setLoading(true)
    await supabase.from('weight_logs').insert({
      user_id: userId, weight: parseFloat(weight), unit, logged_on: today, note: null
    })
    setWeight('')
    setLoading(false)
    setLogging(false)
    router.refresh()
  }

  return (
    <section className="space-y-4">
      {/* Weight + plan, merged into one compact card */}
      <Card>
        <CardContent className="py-0">
          <div className="grid grid-cols-2 gap-4">
            {/* Left — weight */}
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground">Weight</h2>
                {latest && <p className="text-[11px] text-muted-foreground shrink-0">Logged {format(parseISO(latest.logged_on), 'd MMM')}</p>}
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-3xl font-bold tracking-tight tabular-nums">{latest ? latest.weight : ' - '}</span>
                <span className="text-sm text-muted-foreground">{unit}</span>
              </div>
              <div className="flex flex-col items-start gap-1 text-xs mt-1.5">
                {weekDiff !== null && (
                  <span className={cn('inline-flex items-center gap-1 font-medium rounded-full',
                    weekDiff < 0 ? 'text-primary-foreground bg-primary px-2 py-0.5'
                      : weekDiff > 0 ? 'text-destructive bg-destructive/10 px-2 py-0.5' : 'text-muted-foreground')}>
                    {weekDiff < 0 ? <TrendingDown size={12} /> : weekDiff > 0 ? <TrendingUp size={12} /> : <Minus size={12} />}
                    {weekDiff > 0 ? '+' : ''}{weekDiff} {unit} vs last week
                  </span>
                )}
                {distToGoal && (
                  <span className="text-muted-foreground">
                    {parseFloat(distToGoal) > 0 ? '+' : ''}{distToGoal} {unit} from goal
                  </span>
                )}
              </div>
            </div>

            {/* Right — plan */}
            <div className="min-w-0 pl-4 border-l border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2"><Target size={15} /> Plan</span>
                <button onClick={() => setEditPlan(v => !v)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <Pencil size={12} /> {editPlan ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <div className="mt-2">
          {editPlan ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-xs text-muted-foreground">Goal ({unit})</span>
                  <Input type="number" inputMode="decimal" value={goalInput} onChange={e => setGoalInput(e.target.value)} placeholder="80" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-muted-foreground">Rate ({unit}/week)</span>
                  <Input type="number" inputMode="decimal" value={rateInput} onChange={e => setRateInput(e.target.value)} placeholder="0.5" />
                </label>
              </div>
              <p className="text-[11px] text-muted-foreground">A healthy rate is about 0.25–0.75 {unit}/week.</p>
              <Button onClick={savePlan} disabled={loading} className="w-full rounded-full">Save plan</Button>
            </div>
          ) : projection ? (
            projection.done ? (
              <p className="text-sm font-medium text-primary">🎯 You’ve reached your goal weight.</p>
            ) : (
              <div className="space-y-1.5">
                <p className="text-sm">
                  {projection.losing ? 'Lose' : 'Gain'} to <span className="font-semibold">{weightGoal} {unit}</span> by{' '}
                  <span className="font-semibold">{format(projection.finish, 'd MMM yyyy')}</span>
                  <span className="text-muted-foreground"> · at {rate} {unit}/wk (~{Math.ceil(projection.weeks)} wks)</span>
                </p>
                {pace && (
                  <span className={cn('inline-block text-xs font-semibold rounded-full px-2.5 py-0.5',
                    pace.tone === 'ok' ? 'bg-primary/15 text-primary'
                      : pace.tone === 'off' ? 'bg-destructive/10 text-destructive'
                        : 'bg-amber-500/15 text-amber-600')}>
                    {pace.label}
                  </span>
                )}
              </div>
            )
          ) : (
            <p className="text-sm text-muted-foreground">Set a goal weight and weekly rate to get a projected finish date and pace coaching.</p>
          )}
              </div>
            </div>
          </div>

          {/* Log today's weight — revealed on click */}
          <div className="mt-2 pt-2 border-t border-border">
            {logging ? (
              <div className="flex items-center gap-2">
                <Input autoFocus placeholder={`Today's weight (${unit})`} type="number" inputMode="decimal" value={weight}
                  onChange={e => setWeight(e.target.value)} className="flex-1 h-9"
                  onKeyDown={e => { if (e.key === 'Enter') logWeight() }} />
                <Button onClick={logWeight} disabled={loading || !weight} className="rounded-full px-5 h-9">Log</Button>
                <button onClick={() => { setLogging(false); setWeight('') }} aria-label="Cancel"
                  className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                  <X size={17} />
                </button>
              </div>
            ) : (
              <button onClick={() => setLogging(true)}
                className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-primary hover:opacity-80 transition-opacity">
                <Plus size={15} /> Log today’s weight
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {data.length > 1 && (
        <Card>
          <CardContent className="pt-4 pb-2 px-2">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={data}>
                <XAxis dataKey="logged_on" tickFormatter={d => format(parseISO(d), 'd MMM')} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
                <Tooltip formatter={(v) => [`${v} ${unit}`, '']} labelFormatter={d => format(parseISO(d as string), 'd MMM yyyy')} />
                <Line type="monotone" dataKey="weight" stroke="oklch(0.55 0.01 60)" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="avg" stroke="oklch(0.592 0.121 123.2)" strokeWidth={2.5} dot={false} />
                {weightGoal && <ReferenceLine y={weightGoal} stroke="oklch(0.592 0.121 123.2)" strokeDasharray="4 4" />}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

    </section>
  )
}
