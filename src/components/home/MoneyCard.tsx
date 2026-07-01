import Link from 'next/link'
import { Wallet, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TrendPill } from './bits'

export default function MoneyCard({ currency, monthSpend, trend, className }: {
  currency: string; monthSpend: number; trend: number | null; className?: string
}) {
  return (
    <Link href="/money" className={cn('rounded-3xl bg-card border border-border p-5 flex flex-col group', className)}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground"><Wallet size={13} /></span>
          Money
        </span>
        <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
      </div>

      <p className="text-xs text-muted-foreground mt-4">Spent this month</p>
      <div className="flex items-end gap-2 mt-1">
        <span className="text-3xl font-bold tracking-tight tabular-nums">
          {currency} {monthSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
        {trend !== null && <TrendPill value={trend} invert className="mb-1.5" />}
      </div>
      {trend !== null && (
        <p className="text-xs text-muted-foreground mt-1">vs last month</p>
      )}
    </Link>
  )
}
