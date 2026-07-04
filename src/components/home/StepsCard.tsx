import Link from 'next/link'
import { Footprints, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const GOAL = 10000

export default function StepsCard({ steps, className }: { steps: number; className?: string }) {
  const pct = Math.min(100, Math.round((steps / GOAL) * 100))
  const hit = steps >= GOAL
  // Ring geometry
  const r = 26
  const c = 2 * Math.PI * r
  const dash = (pct / 100) * c

  return (
    <Link href="/body" className={cn('rounded-3xl bg-card border border-border p-5 flex flex-col group', className)}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground"><Footprints size={13} /></span>
          Steps
        </span>
        <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
      </div>

      <div className="flex items-center gap-4 mt-4">
        <div className="relative shrink-0">
          <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
            <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
            <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${dash} ${c}`} className={hit ? 'text-green-500' : 'text-primary'} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums">{pct}%</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-end gap-1">
            <span className="text-3xl font-bold tracking-tight tabular-nums">{steps.toLocaleString()}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hit ? '🎉 10k goal hit' : `${(GOAL - steps).toLocaleString()} to 10k`}
          </p>
        </div>
      </div>
    </Link>
  )
}
