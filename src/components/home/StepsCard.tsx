import Link from 'next/link'
import { Footprints, ChevronRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

const GOAL = 10000

// Blue gradient-mesh sibling to the green score / orange weight cards
const MESH =
  'radial-gradient(120% 90% at 24% 14%, #d6e6ff 0%, transparent 46%),' +
  'radial-gradient(120% 120% at 72% 58%, #7aa0ff 0%, transparent 55%),' +
  'radial-gradient(130% 130% at 44% 116%, #a9c6ff 0%, transparent 60%),' +
  'linear-gradient(160deg, #eaf1ff, #bcd2f7)'
const INK = '#20365c'
const RINGBG = 'rgba(255,255,255,0.3)'

export default function StepsCard({ steps, asOf, className }: { steps: number; asOf?: string | null; className?: string }) {
  const pct = Math.min(100, Math.round((steps / GOAL) * 100))
  const hit = steps >= GOAL
  const r = 40
  const c = 2 * Math.PI * r
  const dash = (pct / 100) * c

  return (
    <Link href="/body"
      className={cn('kk-rise relative overflow-hidden rounded-3xl p-5 sm:p-6 flex flex-col group transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgba(32,54,92,0.5)]', className)}
      style={{ background: MESH, color: INK }}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex items-center justify-center w-6 h-6 rounded-md text-white" style={{ background: INK }}><Footprints size={13} /></span>
          Steps
        </span>
        <ChevronRight size={16} className="opacity-60 group-hover:translate-x-0.5 transition-transform" />
      </div>

      {/* Ring centred, count + goal beneath — fills the card height */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-3">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r={r} fill="none" stroke={RINGBG} strokeWidth="7" />
            <circle cx="50" cy="50" r={r} fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round"
              strokeDasharray={`${dash} ${c}`} style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.95))' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span className="text-xl font-bold tracking-tight tabular-nums">{steps.toLocaleString()}</span>
            <span className="text-[11px] opacity-60 mt-0.5">{pct}%</span>
          </div>
        </div>
        <p className="text-xs opacity-70 text-center">
          {asOf
            ? `as of ${format(parseISO(asOf), 'EEE d MMM')}`
            : hit ? '🎉 10k goal hit' : `${(GOAL - steps).toLocaleString()} steps to 10k`}
        </p>
      </div>
    </Link>
  )
}
