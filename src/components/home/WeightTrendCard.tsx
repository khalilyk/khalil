import { format, parseISO, subDays } from 'date-fns'
import { Scale, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Log = { weight: number; logged_on: string }

// Warm gradient-mesh sibling to the green score card
const MESH =
  'radial-gradient(120% 90% at 24% 14%, #ffdcb4 0%, transparent 46%),' +
  'radial-gradient(120% 120% at 72% 58%, #ff9e78 0%, transparent 55%),' +
  'radial-gradient(130% 130% at 44% 116%, #ffcb8c 0%, transparent 60%),' +
  'linear-gradient(160deg, #fdefe0, #f6cba9)'
const INK = '#5b3320'

export default function WeightTrendCard({ logs, unit, goal, className }: {
  logs: Log[]; unit: string; goal: number | null; className?: string
}) {
  const latest = logs[logs.length - 1] ?? null
  const weekTarget = latest ? format(subDays(parseISO(latest.logged_on), 7), 'yyyy-MM-dd') : null
  const prior = weekTarget ? [...logs].reverse().find(l => l.logged_on <= weekTarget) : null
  const weekPct = latest && prior && prior.weight ? +(((latest.weight - prior.weight) / prior.weight) * 100).toFixed(1) : null
  const dir = weekPct == null || weekPct === 0 ? 'flat' : weekPct > 0 ? 'up' : 'down'

  // Minimal sparkline (no axes) from the recent logs
  const pts = logs.slice(-24)
  const W = 260, H = 52
  let path = '', area = ''
  if (pts.length > 1) {
    const ys = pts.map(p => p.weight)
    const min = Math.min(...ys), max = Math.max(...ys), span = max - min || 1
    const xy = pts.map((p, i) => {
      const x = (i / (pts.length - 1)) * W
      const y = H - 6 - ((p.weight - min) / span) * (H - 12)
      return [x, y] as const
    })
    path = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
    area = `${path} L${W},${H} L0,${H} Z`
  }

  return (
    <div className={cn('kk-rise relative overflow-hidden rounded-3xl p-5 sm:p-6 flex flex-col shadow-[0_20px_60px_-24px_rgba(214,120,60,0.5)]', className)}
      style={{ background: MESH, color: INK }}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex items-center justify-center w-6 h-6 rounded-md text-white" style={{ background: INK }}><Scale size={13} /></span>
          Weight
        </span>
        {weekPct !== null && dir !== 'flat' && (
          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold rounded-full px-2 py-0.5 bg-white/55 backdrop-blur">
            {dir === 'up' ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{Math.abs(weekPct)}%
          </span>
        )}
      </div>

      <div className="mt-2 flex items-end gap-2">
        <span className="text-6xl sm:text-7xl font-extrabold tracking-tight leading-none tabular-nums">{latest ? latest.weight : '—'}</span>
        <span className="pb-2 text-lg font-semibold opacity-70">{unit}</span>
      </div>
      <p className="mt-1 text-xs font-semibold opacity-70">
        {goal ? `Goal ${goal} ${unit}` : 'This week’s trend'}
      </p>

      {/* Sparkline fills the rest of the card */}
      <div className="relative mt-auto pt-4">
        {pts.length > 1 ? (
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-14">
            <defs>
              <linearGradient id="wtfill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={INK} stopOpacity="0.28" />
                <stop offset="100%" stopColor={INK} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#wtfill)" />
            <path d={path} fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <p className="text-xs opacity-70">Log your weight on the Body page to see your trend.</p>
        )}
      </div>
    </div>
  )
}
