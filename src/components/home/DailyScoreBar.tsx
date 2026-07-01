import { Flame, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ScoreItem = { label: string; points: number; got: number }

export default function DailyScoreBar({ score, items, streak }: {
  score: number; items: ScoreItem[]; streak: number
}) {
  const pct = Math.round(score)
  const ring = `conic-gradient(var(--primary) ${pct * 3.6}deg, color-mix(in oklab, var(--foreground) 10%, transparent) 0deg)`

  return (
    <div className="rounded-3xl bg-neutral-900 text-white p-5 flex flex-col sm:flex-row sm:items-center gap-5">
      {/* Score ring */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="relative w-20 h-20 rounded-full grid place-items-center" style={{ background: ring }}>
          <div className="w-15 h-15 rounded-full bg-neutral-900 grid place-items-center" style={{ width: 60, height: 60 }}>
            <span className="text-2xl font-bold tabular-nums leading-none">{pct}</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold">Today’s score</p>
          <p className="text-xs text-white/50">out of 100</p>
          <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary">
            <Flame size={14} /> {streak}-day streak
          </p>
        </div>
      </div>

      {/* Pillar chips */}
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {items.map(it => {
          const done = it.got >= it.points
          const partial = it.got > 0 && !done
          return (
            <div key={it.label} className={cn(
              'rounded-2xl px-3 py-2.5 border',
              done ? 'bg-primary/15 border-primary/40' : partial ? 'bg-white/5 border-white/15' : 'bg-white/[0.03] border-white/10'
            )}>
              <div className="flex items-center justify-between">
                <span className={cn('flex items-center justify-center w-5 h-5 rounded-full shrink-0',
                  done ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white/40')}>
                  {done ? <Check size={12} strokeWidth={3} /> : <span className="text-[10px] font-bold">{it.got}</span>}
                </span>
                <span className="text-[11px] text-white/40 tabular-nums">/{it.points}</span>
              </div>
              <p className="text-xs mt-1.5 text-white/80 leading-tight">{it.label}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
