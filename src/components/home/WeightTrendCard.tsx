import { format, parseISO, subDays } from 'date-fns'
import { Scale, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import WeightSparkline from './WeightSparkline'

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
  const pts = logs.slice(-24)

  return (
    <div className={cn('kk-rise relative overflow-hidden rounded-3xl pt-5 sm:pt-6 px-5 sm:px-6 flex flex-col shadow-[0_20px_60px_-24px_rgba(214,120,60,0.5)]', className)}
      style={{ background: MESH, color: INK }}>
      <span className="flex items-center gap-2 text-sm font-semibold">
        <span className="flex items-center justify-center w-6 h-6 rounded-md text-white" style={{ background: INK }}><Scale size={13} /></span>
        Weight
      </span>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-none tabular-nums">{latest ? latest.weight : ' - '}</span>
        <span className="text-base font-semibold opacity-70 shrink-0">{unit}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        {weekPct !== null && dir !== 'flat' && (
          <span className="shrink-0 inline-flex items-center gap-0.5 whitespace-nowrap text-[11px] font-bold rounded-full px-2 py-0.5 bg-white/55 backdrop-blur">
            {dir === 'up' ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{Math.abs(weekPct)}%
          </span>
        )}
      </div>

      {/* Full-bleed sparkline - hover for the date + weight */}
      <div className="mt-auto -mx-5 sm:-mx-6 pt-4">
        <WeightSparkline pts={pts} unit={unit} />
      </div>
    </div>
  )
}
