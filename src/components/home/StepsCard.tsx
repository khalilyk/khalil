import Link from 'next/link'
import { Footprints, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const GOAL = 10000

export default function StepsCard({ steps, className }: { steps: number; className?: string }) {
  const pct = Math.min(100, Math.round((steps / GOAL) * 100))
  const hit = steps >= GOAL
  // Ring geometry
  const r = 40
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

      {/* Ring centred, count + goal beneath — fills the card height */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-3">
        <div className="relative w-24 h-24">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
            <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${dash} ${c}`} className={hit ? 'text-green-500' : 'text-primary'} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span className="text-2xl font-bold tracking-tight tabular-nums">{steps.toLocaleString()}</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">{pct}%</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {hit ? '🎉 10k goal hit' : `${(GOAL - steps).toLocaleString()} steps to 10k`}
        </p>
      </div>
    </Link>
  )
}
