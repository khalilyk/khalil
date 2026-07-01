import { CalendarRange } from 'lucide-react'
import type { WeeklySummary } from '@/lib/summary'
import { cn } from '@/lib/utils'

export default function WeeklyReviewCard({ summary }: { summary: WeeklySummary }) {
  const stats = [
    { label: 'Check-ins', value: `${summary.checkinsDone}/7`, good: summary.checkinsDone >= 5 },
    { label: 'Trained', value: `${summary.workoutDays} days`, good: summary.workoutDays >= 4 },
    {
      label: 'Weight',
      value: summary.weightChange === null ? '—' : `${summary.weightChange > 0 ? '+' : ''}${summary.weightChange} ${summary.unit}`,
      good: summary.weightChange !== null && summary.weightChange <= 0,
    },
    { label: 'Spent', value: `${summary.currency} ${Math.round(summary.spend).toLocaleString()}`, good: summary.overBudget.length === 0 },
  ]

  return (
    <div className="rounded-3xl bg-card border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold flex items-center gap-2"><CalendarRange size={16} /> This week</span>
        <span className="text-xs text-muted-foreground">{summary.rangeLabel}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl bg-muted/50 px-3 py-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={cn('text-lg font-bold mt-0.5 tabular-nums', s.good ? 'text-primary' : 'text-foreground')}>{s.value}</p>
          </div>
        ))}
      </div>

      {(summary.overBudget.length > 0 || summary.goalsDueSoon.length > 0) && (
        <div className="mt-4 space-y-1 text-sm">
          {summary.overBudget.length > 0 && (
            <p className="text-destructive">Over budget: {summary.overBudget.join(', ')}</p>
          )}
          {summary.goalsDueSoon.map(g => (
            <p key={g.title} className="text-muted-foreground">
              🎯 {g.title} — {g.days < 0 ? 'overdue' : g.days === 0 ? 'due today' : `${g.days}d left`}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
