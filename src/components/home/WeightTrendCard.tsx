'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format, parseISO, subDays } from 'date-fns'
import { Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Log = { weight: number; logged_on: string }

// Weight is the one metric where UP is bad: gaining → red, losing → green.
const GAIN = '#ef4444'  // red-500
const LOSS = '#22c55e'  // green-500
const FLAT = 'oklch(0.67 0.2 44)'

export default function WeightTrendCard({ logs, unit, goal, className }: {
  logs: Log[]; unit: string; goal: number | null; className?: string
}) {
  const latest = logs[logs.length - 1] ?? null
  const weekTarget = latest ? format(subDays(parseISO(latest.logged_on), 7), 'yyyy-MM-dd') : null
  const prior = weekTarget ? [...logs].reverse().find(l => l.logged_on <= weekTarget) : null
  const weekPct = latest && prior && prior.weight ? +(((latest.weight - prior.weight) / prior.weight) * 100).toFixed(1) : null

  const dir = weekPct == null || weekPct === 0 ? 'flat' : weekPct > 0 ? 'up' : 'down'
  const color = dir === 'up' ? GAIN : dir === 'down' ? LOSS : FLAT

  return (
    <div className={cn('rounded-3xl bg-neutral-900 text-white p-5 flex flex-col', className)}>
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground"><Activity size={14} /></span>
        <span className="font-semibold">Weight</span>
      </div>

      <div className="mt-3 flex items-end gap-2">
        <span className="text-4xl font-bold tracking-tight tabular-nums" style={dir !== 'flat' ? { color } : undefined}>
          {latest ? latest.weight : '—'}
        </span>
        <span className="text-white/50 mb-1">{unit}</span>
      </div>

      <div className="mt-2 flex-1 min-h-[110px]">
        {logs.length > 1 ? (
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={logs} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="wt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="logged_on" tickFormatter={d => format(parseISO(d), 'd MMM')}
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} tickLine={false} axisLine={false} width={34} />
              <Tooltip
                contentStyle={{ background: '#111', border: 'none', borderRadius: 12, fontSize: 12, color: '#fff' }}
                formatter={(v) => [`${v} ${unit}`, '']} labelFormatter={d => format(parseISO(d as string), 'd MMM yyyy')} />
              {goal && <ReferenceLine y={goal} stroke="rgba(255,255,255,0.25)" strokeDasharray="4 4" />}
              <Area type="monotone" dataKey="weight" stroke={color} strokeWidth={2.5} fill="url(#wt)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[150px] flex items-center justify-center text-white/40 text-sm text-center px-6">
            Log your weight on the Body page to see your trend here.
          </div>
        )}
      </div>

      {weekPct !== null && dir !== 'flat' && (
        <div className="mt-2 flex justify-center">
          <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold rounded-full px-2 py-0.5"
            style={{ color, backgroundColor: `${color}26` }}>
            {dir === 'up' ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{Math.abs(weekPct)}% vs last week
          </span>
        </div>
      )}
    </div>
  )
}
