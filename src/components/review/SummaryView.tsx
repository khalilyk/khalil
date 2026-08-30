import type { PeriodSummary } from '@/lib/summary'
import { CheckCircle2, Dumbbell, Scale, Target } from 'lucide-react'

const MESH = {
  green: {
    bg: 'radial-gradient(120% 90% at 22% 12%, #f4dcba 0%, transparent 46%), radial-gradient(120% 120% at 62% 52%, #9fbf5a 0%, transparent 55%), radial-gradient(130% 130% at 48% 115%, #c6df82 0%, transparent 60%), linear-gradient(160deg, #eef3e0, #d6e6ad)',
    ink: '#33401b',
  },
  orange: {
    bg: 'radial-gradient(120% 90% at 24% 14%, #ffdcb4 0%, transparent 46%), radial-gradient(120% 120% at 72% 58%, #ff9e78 0%, transparent 55%), radial-gradient(130% 130% at 44% 116%, #ffcb8c 0%, transparent 60%), linear-gradient(160deg, #fdefe0, #f6cba9)',
    ink: '#5b3320',
  },
  blue: {
    bg: 'radial-gradient(120% 90% at 24% 14%, #d6e6ff 0%, transparent 46%), radial-gradient(120% 120% at 72% 58%, #7aa0ff 0%, transparent 55%), radial-gradient(130% 130% at 44% 116%, #a9c6ff 0%, transparent 60%), linear-gradient(160deg, #eaf1ff, #bcd2f7)',
    ink: '#20365c',
  },
} as const

export default function SummaryView({ s }: { s: PeriodSummary }) {
  const label = s.period === 'week' ? 'this week' : s.period === 'month' ? 'this month' : 'this year'
  const wChange = s.weightChange

  const cards = [
    { icon: CheckCircle2, label: 'Check-ins', value: `${s.checkinsDone}/${s.daysElapsed}`, sub: 'days logged', tone: MESH.green },
    { icon: Dumbbell, label: 'Trained', value: `${s.workoutDays}`, sub: `${s.workoutDays === 1 ? 'day' : 'days'} ${label}`, tone: MESH.orange },
    {
      icon: Scale, label: 'Weight',
      value: wChange == null ? (s.weightLatest ? `${s.weightLatest} ${s.unit}` : '—') : `${wChange > 0 ? '+' : ''}${wChange} ${s.unit}`,
      sub: wChange == null ? 'latest' : `change ${label}`, tone: MESH.blue,
    },
  ]

  return (
    <div className="kk-stagger space-y-4">
      <p className="text-sm text-muted-foreground">{s.rangeLabel}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(({ icon: Icon, label: l, value, sub, tone }) => (
          <div key={l} className="relative overflow-hidden rounded-3xl p-5 sm:p-6 shadow-[0_20px_50px_-26px_rgba(0,0,0,0.4)]"
            style={{ background: tone.bg, color: tone.ink }}>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="flex items-center justify-center w-6 h-6 rounded-md text-white" style={{ background: tone.ink }}><Icon size={13} /></span>
              {l}
            </div>
            <p className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight tabular-nums leading-none">{value}</p>
            <p className="mt-2 text-xs font-semibold opacity-70">{sub}</p>
          </div>
        ))}
      </div>

      <div className="kk-rise relative overflow-hidden rounded-3xl bg-card border border-border p-5 sm:p-6">
        <span className="kk-glow" style={{ left: '90%', top: '10%', width: 180, height: 180, background: 'radial-gradient(circle, rgba(112,137,46,0.16), transparent 70%)' }} />
        <p className="relative text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <Target size={13} /> Goals
        </p>
        {s.goalsDueSoon.length === 0 ? (
          <p className="relative text-sm text-muted-foreground">{s.goalsActive} active — none due within 30 days.</p>
        ) : (
          <div className="relative space-y-2">
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
