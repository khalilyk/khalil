'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import { Landmark } from 'lucide-react'
import { TrendPill } from '@/components/home/bits'

type Account = { id: string; name: string; type: string }
type Snapshot = { account_id: string; balance: number; as_of: string }

export default function NetWorthCard({ accounts, snapshots, currency }: {
  accounts: Account[]; snapshots: Snapshot[]; currency: string
}) {
  const money = (n: number) => `${currency} ${Math.round(n).toLocaleString()}`

  // Build a net-worth time series: on each snapshot date, sum the most
  // recent balance for every account as of that date.
  const dates = Array.from(new Set(snapshots.map(s => s.as_of))).sort()
  const series = dates.map(date => {
    let total = 0
    for (const acc of accounts) {
      const latest = snapshots
        .filter(s => s.account_id === acc.id && s.as_of <= date)
        .sort((a, b) => a.as_of.localeCompare(b.as_of))
        .at(-1)
      if (latest) total += Number(latest.balance)
    }
    return { date, total: +total.toFixed(0) }
  })

  const current = series.at(-1)?.total ?? 0
  const prev = series.length > 1 ? series[series.length - 2].total : null
  const pct = prev && prev !== 0 ? Math.round(((current - prev) / Math.abs(prev)) * 100) : null

  return (
    <div className="rounded-3xl bg-neutral-900 text-white p-5">
      <div className="flex items-center justify-between">
        <span className="font-semibold flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground"><Landmark size={14} /></span>
          Net worth
        </span>
        {pct !== null && <TrendPill value={pct} />}
      </div>

      <p className="text-3xl font-bold tabular-nums mt-3">{money(current)}</p>

      {series.length > 1 ? (
        <div className="mt-3">
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={series} margin={{ top: 6, right: 4, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="nw" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.67 0.2 44)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="oklch(0.67 0.2 44)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tickFormatter={d => format(parseISO(d), 'd MMM')} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} tickLine={false} axisLine={false} width={40} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#111', border: 'none', borderRadius: 12, fontSize: 12, color: '#fff' }}
                formatter={(v) => [money(Number(v)), 'Net worth']} labelFormatter={d => format(parseISO(d as string), 'd MMM yyyy')} />
              <Area type="monotone" dataKey="total" stroke="oklch(0.67 0.2 44)" strokeWidth={2.5} fill="url(#nw)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-sm text-white/40 mt-3">Add balance snapshots to your accounts to chart your net worth over time.</p>
      )}
    </div>
  )
}
