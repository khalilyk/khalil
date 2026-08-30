import Link from 'next/link'
import { Footprints, ChevronRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

const GOAL = 10000

export default function StepsCard({ steps, asOf, className }: { steps: number; asOf?: string | null; className?: string }) {
  const pct = Math.min(100, Math.round((steps / GOAL) * 100))
  const hit = steps >= GOAL
  // Ring geometry
  const r = 40
  const c = 2 * Math.PI * r
  const dash = (pct / 100) * c

  return (
    <Link href="/body" className={cn('kk-rise relative overflow-hidden rounded-3xl bg-card border border-border p-5 sm:p-6 flex flex-col group transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.25)]', className)}>
      <span className="kk-glow" style={{ left: '50%', top: '58%', width: 200, height: 200, background: `radial-gradient(circle, ${hit ? 'rgba(34,197,94,0.28)' : 'rgba(112,137,46,0.22)'}, transparent 70%)`, animationDelay: '1.1s' }} />
      <div className="relative flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground"><Footprints size={13} /></span>
          Steps
        </span>
        <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
      </div>

      {/* Ring centred, count + goal beneath — fills the card height */}
      <div className="relative flex-1 flex flex-col items-center justify-center gap-3 py-3">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-muted" />
            <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round"
              strokeDasharray={`${dash} ${c}`} className={hit ? 'text-green-500' : 'text-primary'} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span className="text-xl font-bold tracking-tight tabular-nums">{steps.toLocaleString()}</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">{pct}%</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {asOf
            ? `as of ${format(parseISO(asOf), 'EEE d MMM')}`
            : hit ? '🎉 10k goal hit' : `${(GOAL - steps).toLocaleString()} steps to 10k`}
        </p>
      </div>
    </Link>
  )
}
