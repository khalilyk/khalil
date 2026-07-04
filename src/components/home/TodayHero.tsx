import Link from 'next/link'
import { Flame, Check, Sun, Moon, Dumbbell, Scale } from 'lucide-react'
import { cn } from '@/lib/utils'

const ICONS = { morning: Sun, evening: Moon, workout: Dumbbell, weight: Scale } as const

export type HeroRow = {
  key: keyof typeof ICONS
  label: string
  value: string
  done: boolean
  href: string
}

export default function TodayHero({ score, streak, rows, weekDots }: {
  score: number; streak: number; rows: HeroRow[]; weekDots: boolean[]
}) {
  const pct = Math.round(score)
  const ring = `conic-gradient(var(--primary) ${pct * 3.6}deg, rgba(255,255,255,0.1) 0deg)`

  return (
    <div className="rounded-3xl bg-neutral-900 text-white p-5 sm:p-6">
      {/* Top: score ring + streak, week dots on the right */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-full grid place-items-center shrink-0" style={{ background: ring }}>
          <div className="rounded-full bg-neutral-900 grid place-items-center" style={{ width: 50, height: 50 }}>
            <span className="text-xl font-bold tabular-nums leading-none">{pct}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Today’s score</p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
            <Flame size={14} /> {streak}-day streak
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          {weekDots.map((d, i) => (
            <span key={i} className={cn('w-1.5 h-1.5 rounded-full', d ? 'bg-primary' : 'bg-white/20')} />
          ))}
        </div>
      </div>

      {/* The four things that make the day count */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {rows.map(({ key, label, value, done, href }) => {
          const Icon = ICONS[key]
          return (
            <Link key={key} href={href}
              className="flex items-center gap-3 py-2 px-2.5 rounded-xl hover:bg-white/5 transition-colors">
              <span className={cn('flex items-center justify-center w-8 h-8 rounded-lg shrink-0',
                done ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white/60')}>
                {done ? <Check size={15} strokeWidth={3} /> : <Icon size={15} />}
              </span>
              <span className="flex-1 min-w-0 text-sm truncate">{label}</span>
              <span className={cn('text-sm font-medium shrink-0', done ? 'text-white' : 'text-white/45')}>{value}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
