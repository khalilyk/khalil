'use client'

import { useState, useEffect } from 'react'

export default function Countdown({ date }: { date: string }) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (now === null) return <span className="tabular-nums">—</span>

  const target = new Date(`${date}T23:59:59`).getTime()
  let diff = target - now
  const overdue = diff < 0
  diff = Math.abs(diff)

  const d = Math.floor(diff / 86_400_000)
  const h = Math.floor(diff / 3_600_000) % 24
  const m = Math.floor(diff / 60_000) % 60
  const s = Math.floor(diff / 1000) % 60

  return (
    <span className="tabular-nums">
      {overdue && 'overdue by '}
      {d > 0 && `${d}d `}{String(h).padStart(2, '0')}h {String(m).padStart(2, '0')}m {String(s).padStart(2, '0')}s
    </span>
  )
}
