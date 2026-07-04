import type { PeriodSummary } from '@/lib/summary'
import { CheckCircle2, Dumbbell, Scale, Wallet, Target } from 'lucide-react'

const money = (n: number, ccy: string) => `${ccy} ${Math.round(n).toLocaleString()}`

export default function SummaryView({ s }: { s: PeriodSummary }) {
  const label = s.period === 'week' ? 'this week' : s.period === 'month' ? 'this month' : 'this year'
  const wChange = s.weightChange
  const wColor = wChange == null ? 'text-muted-foreground' : wChange > 0 ? 'text-red-500' : wChange < 0 ? 'text-green-500' : 'text-foreground'

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{s.rangeLabel}</p>

      <div className="grid grid-cols-2 gap-3">
        <Stat icon={CheckCircle2} label="Check-ins" value={`${s.checkinsDone}/${s.daysElapsed}`} sub="days logged" />
        <Stat icon={Dumbbell} label="Trained" value={`${s.workoutDays}`} sub={`${s.workoutDays === 1 ? 'day' : 'days'} ${label}`} />
        <Stat icon={Scale} label="Weight"
          value={wChange == null ? (s.weightLatest ? `${s.weightLatest} ${s.unit}` : '—') : `${wChange > 0 ? '+' : ''}${wChange} ${s.unit}`}
          sub={wChange == null ? 'latest' : `change ${label}`} valueClass={wColor} />
        <Stat icon={Wallet} label="Spent" value={money(s.spend, s.currency)} sub={label}
          sub2={s.overBudget.length ? `over on ${s.overBudget.join(', ')}` : undefined} />
      </div>

      {s.topCategories.length > 0 && (
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Top spending</p>
          <div className="space-y-2">
            {s.topCategories.map(c => {
              const pct = s.spend > 0 ? Math.round((c.amount / s.spend) * 100) : 0
              return (
                <div key={c.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{c.category.replace('_', ' ')}</span>
                    <span className="tabular-nums font-medium">{money(c.amount, s.currency)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <Target size={13} /> Goals
        </p>
        {s.goalsDueSoon.length === 0 ? (
          <p className="text-sm text-muted-foreground">{s.goalsActive} active — none due within 30 days.</p>
        ) : (
          <div className="space-y-2">
            {s.goalsDueSoon.map(g => (
              <div key={g.title} className="flex justify-between text-sm">
                <span className="truncate">{g.title}</span>
                <span className={g.days < 0 ? 'text-red-500 shrink-0' : 'text-muted-foreground shrink-0'}>
                  {g.days < 0 ? `${-g.days}d overdue` : g.days === 0 ? 'due today' : `${g.days}d left`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value, sub, sub2, valueClass }: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string; value: string; sub: string; sub2?: string; valueClass?: string
}) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon size={13} /> {label}
      </div>
      <p className={`text-2xl font-bold tracking-tight tabular-nums mt-1 ${valueClass ?? ''}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
      {sub2 && <p className="text-xs text-red-500 mt-0.5">{sub2}</p>}
    </div>
  )
}
