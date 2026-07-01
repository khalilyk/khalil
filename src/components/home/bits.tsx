import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TrendPill({ value, invert = false, className }: { value: number; invert?: boolean; className?: string }) {
  const up = value >= 0
  // invert: for spend, up is "bad" (red), down is "good"
  const good = invert ? !up : up
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-[11px] font-semibold rounded-full px-2 py-0.5',
      good ? 'bg-primary/15 text-primary' : 'bg-destructive/10 text-destructive',
      className
    )}>
      {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{Math.abs(value)}%
    </span>
  )
}

export function DotStrip({ filled, total, className, tone = 'primary' }: {
  filled: number; total: number; className?: string; tone?: 'primary' | 'light'
}) {
  return (
    <div className={cn('flex gap-1 items-center', className)}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={cn(
          'w-1.5 h-1.5 rounded-full',
          i < filled ? 'bg-primary' : tone === 'light' ? 'bg-white/20' : 'bg-foreground/10'
        )} />
      ))}
    </div>
  )
}
