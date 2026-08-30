'use client'

import { useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'

type Pt = { weight: number; logged_on: string }

const W = 260, H = 60, INK = '#5b3320'

export default function WeightSparkline({ pts, unit }: { pts: Pt[]; unit: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<number | null>(null)

  if (pts.length < 2) {
    return <p className="text-xs opacity-70 px-5 sm:px-6 pb-5">Log your weight on the Body page to see your trend.</p>
  }

  const ys = pts.map(p => p.weight)
  const min = Math.min(...ys), max = Math.max(...ys), span = max - min || 1
  const xy = pts.map((p, i) => {
    const x = (i / (pts.length - 1)) * W
    const y = H - 8 - ((p.weight - min) / span) * (H - 16)
    return { x, y, xPct: (i / (pts.length - 1)) * 100, yPct: (H - 8 - ((p.weight - min) / span) * (H - 16)) / H * 100 }
  })
  const line = xy.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${W},${H} L0,${H} Z`

  function onMove(e: React.PointerEvent) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    setActive(Math.round(frac * (pts.length - 1)))
  }

  const a = active != null ? xy[active] : null
  const ap = active != null ? pts[active] : null

  return (
    <div ref={ref} className="relative w-full" onPointerMove={onMove} onPointerLeave={() => setActive(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block w-full h-16">
        <defs>
          <linearGradient id="wtfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={INK} stopOpacity="0.28" />
            <stop offset="100%" stopColor={INK} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#wtfill)" />
        <path d={line} pathLength={100} className="kk-draw" fill="none" stroke={INK} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>

      {/* Hover marker + tooltip */}
      {a && ap && (
        <>
          <span className="pointer-events-none absolute top-0 bottom-0 w-px" style={{ left: `${a.xPct}%`, background: 'rgba(91,51,32,0.3)' }} />
          <span className="pointer-events-none absolute w-2.5 h-2.5 rounded-full ring-2 ring-white"
            style={{ left: `${a.xPct}%`, top: `${a.yPct}%`, background: INK, transform: 'translate(-50%,-50%)' }} />
          <span className="pointer-events-none absolute -translate-x-1/2 -translate-y-full mb-1 rounded-lg px-2 py-1 text-[11px] font-bold whitespace-nowrap shadow-lg"
            style={{ left: `${Math.min(88, Math.max(12, a.xPct))}%`, top: `${a.yPct}%`, background: INK, color: '#fff' }}>
            {ap.weight} {unit} · {format(parseISO(ap.logged_on), 'd MMM')}
          </span>
        </>
      )}
    </div>
  )
}
