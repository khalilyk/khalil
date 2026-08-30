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

// Soft gradient-mesh backdrop for the score card (green, on-brand)
const MESH =
  'radial-gradient(120% 90% at 22% 12%, #f4dcba 0%, transparent 46%),' +
  'radial-gradient(120% 120% at 62% 52%, #9fbf5a 0%, transparent 55%),' +
  'radial-gradient(130% 130% at 48% 115%, #c6df82 0%, transparent 60%),' +
  'linear-gradient(160deg, #eef3e0, #d6e6ad)'

const INK = '#33401b'

export default function TodayHero({ score, streak, rows, weekDots }: {
  score: number; streak: number; rows: HeroRow[]; weekDots: boolean[]
}) {
  const pct = Math.round(score)
  const status = pct >= 80 ? 'On track' : pct >= 50 ? 'Getting there' : pct > 0 ? 'Warming up' : 'Fresh start'

  return (
    <div className="kk-rise relative overflow-hidden rounded-3xl p-5 sm:p-6 flex flex-col shadow-[0_20px_60px_-24px_rgba(112,137,46,0.5)]"
      style={{ background: MESH, color: INK }}>
      {/* Header row */}
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold">Today’s score</p>
        <div className="flex gap-1">
          {weekDots.map((d, i) => (
            <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: d ? INK : 'rgba(51,64,27,0.2)' }} />
          ))}
        </div>
      </div>

      {/* Big score + status */}
      <div className="mt-2 flex items-end gap-3">
        <span className="kk-pop text-6xl sm:text-7xl font-extrabold tracking-tight leading-none tabular-nums">{pct}</span>
        <div className="pb-1.5">
          <span className="inline-block rounded-full bg-white/55 backdrop-blur px-3 py-1 text-xs font-bold">{status}</span>
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: '#4a5c22' }}>
            <Flame size={12} /> {streak}-day streak
          </p>
        </div>
      </div>

      {/* Dotted progress bar */}
      <div className="mt-3 flex gap-1">
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i < Math.round(pct / 5) ? INK : 'rgba(51,64,27,0.18)' }} />
        ))}
      </div>

      {/* The four things that make the day count */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-1">
        {rows.map(({ key, label, value, done, href }) => {
          const Icon = ICONS[key]
          return (
            <Link key={key} href={href}
              className="flex items-center gap-2.5 py-1.5 px-2 rounded-xl transition-colors hover:bg-white/40">
              <span className={cn('flex items-center justify-center w-7 h-7 rounded-lg shrink-0 text-white')}
                style={{ background: done ? INK : 'rgba(51,64,27,0.22)' }}>
                {done ? <Check size={14} strokeWidth={3} /> : <Icon size={13} />}
              </span>
              <span className="flex-1 min-w-0 text-sm truncate font-medium">{label}</span>
              <span className={cn('text-sm font-semibold shrink-0', !done && 'opacity-50')}>{value}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
