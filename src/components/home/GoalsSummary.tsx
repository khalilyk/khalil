import Link from 'next/link'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { Target, ChevronRight } from 'lucide-react'
import type { Goal } from '@/types/goal'

function timeLeft(date: string | null): string {
  if (!date) return 'No date'
  const days = differenceInCalendarDays(parseISO(date), new Date())
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Today'
  if (days < 31) return `${days} days`
  if (days < 365) return `${Math.round(days / 30)} months`
  const years = (days / 365).toFixed(1)
  return `${years} yrs`
}

// How much left to reach it — kg for body goals (vs latest weight), else the target value.
function remaining(g: Goal, latestWeight: number | null): string | null {
  if (g.category === 'body' && g.target_value != null && latestWeight != null) {
    const diff = latestWeight - g.target_value
    if (Math.abs(diff) < 0.05) return 'Reached'
    return `${Math.abs(diff).toFixed(1)} kg to ${diff > 0 ? 'lose' : 'gain'}`
  }
  if (g.target_value != null) return `${g.target_value.toLocaleString()}${g.target_unit ? ' ' + g.target_unit : ''}`
  return null
}

export default function GoalsSummary({ goals, latestWeight }: { goals: Goal[]; latestWeight: number | null }) {
  if (goals.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          <Target size={12} /> Goals
        </p>
        <Link href="/goals" className="text-xs text-muted-foreground hover:text-foreground flex items-center">
          All <ChevronRight size={13} />
        </Link>
      </div>

      <div className="space-y-2">
        {goals.map(g => {
          const rem = remaining(g, latestWeight)
          return (
            <Link key={g.id} href="/goals"
              className="flex items-center gap-3 rounded-2xl bg-card border border-border px-4 py-3 hover:border-primary/40 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{g.title}</p>
                <p className="text-xs text-muted-foreground capitalize">{g.category}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">{timeLeft(g.target_date)}</p>
                {rem && <p className="text-xs text-primary-foreground bg-primary rounded-full px-2 py-0.5 mt-0.5 inline-block">{rem}</p>}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
