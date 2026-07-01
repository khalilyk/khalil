import Link from 'next/link'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { Target, ChevronRight } from 'lucide-react'
import Countdown from '@/components/goals/Countdown'
import type { Goal } from '@/types/goal'

function shortLeft(date: string | null): string {
  if (!date) return ''
  const days = differenceInCalendarDays(parseISO(date), new Date())
  if (days < 0) return 'overdue'
  if (days < 31) return `${days}d left`
  if (days < 365) return `${Math.round(days / 30)}mo left`
  return `${(days / 365).toFixed(1)}y left`
}

export default function GoalFocusCard({ goals, className }: { goals: Goal[]; className?: string }) {
  const featured = goals.find(g => g.target_date) ?? goals[0] ?? null
  const rest = goals.filter(g => g.id !== featured?.id).slice(0, 3)

  return (
    <div className={`rounded-3xl bg-primary text-primary-foreground p-5 flex flex-col ${className ?? ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest font-semibold opacity-80 flex items-center gap-1.5">
          <Target size={12} /> Focus
        </span>
        <Link href="/goals" className="opacity-80 hover:opacity-100"><ChevronRight size={16} /></Link>
      </div>

      {featured ? (
        <>
          <p className="text-xl font-bold mt-3 leading-tight">{featured.title}</p>
          {featured.target_date && (
            <p className="text-lg font-extrabold mt-2 tabular-nums"><Countdown date={featured.target_date} /></p>
          )}

          {rest.length > 0 && (
            <div className="mt-4 pt-4 border-t border-primary-foreground/20 space-y-2">
              {rest.map(g => (
                <Link key={g.id} href="/goals" className="flex items-center justify-between text-sm group">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/70 shrink-0" />
                    <span className="truncate opacity-90 group-hover:opacity-100">{g.title}</span>
                  </span>
                  <span className="text-[11px] opacity-70 shrink-0 ml-2">{shortLeft(g.target_date)}</span>
                </Link>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex flex-col justify-center py-6">
          <p className="text-sm opacity-80">No goals yet.</p>
          <Link href="/goals" className="text-sm font-semibold underline mt-1">Set your first goal</Link>
        </div>
      )}
    </div>
  )
}
