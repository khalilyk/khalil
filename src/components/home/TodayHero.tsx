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
  const ring = `conic-gradient(var(--primary) ${pct * 3.6}deg, rgba(255,255,255,0.08) 0deg)`
  const status = pct >= 80 ? 'On track' : pct >= 50 ? 'Getting there' : pct > 0 ? 'Warming up' : 'Fresh start'

  return (
    <div className="kk-rise relative overflow-hidden rounded-3xl bg-neutral-900 text-white p-5 sm:p-6 shadow-[0_20px_60px_-20px_rgba(112,137,46,0.5)]">
      {/* Ambient glows */}
      <span className="kk-glow" style={{ left: '18%', top: '30%', width: 260, height: 260, background: 'radial-gradient(circle, rgba(134,160,58,0.55), transparent 68%)' }} />
      <span className="kk-glow" style={{ left: '85%', top: '85%', width: 200, height: 200, background: 'radial-gradient(circle, rgba(112,137,46,0.35), transparent 70%)', animationDelay: '1.4s' }} />

      {/* Top: score ring + streak, week dots on the right */}
      <div className="relative flex items-center gap-4">
        <div className="relative w-20 h-20 rounded-full grid place-items-center shrink-0 transition-transform duration-500" style={{ background: ring }}>
          <div className="rounded-full bg-neutral-900 grid place-items-center" style={{ width: 62, height: 62 }}>
            <span className="kk-pop text-2xl font-bold tabular-nums leading-none">{pct}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white/70">Today’s score</p>
          <p className="text-lg font-bold leading-tight">{status}</p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
            <Flame size={14} /> {streak}-day streak
          </p>
        </div>
        <div className="flex gap-1 shrink-0 self-start">
          {weekDots.map((d, i) => (
            <span key={i} className={cn('w-1.5 h-1.5 rounded-full transition-colors', d ? 'bg-primary shadow-[0_0_8px_rgba(134,160,58,0.9)]' : 'bg-white/20')} />
          ))}
        </div>
      </div>

      {/* The four things that make the day count */}
      <div className="relative mt-4 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
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
