import { Wallet, Briefcase, Target, Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Row = {
  id: string; name: string; type: 'personal' | 'business'
  balance: number | null; purpose: string | null; goalTitle: string | null; businessName: string | null
}

export default function AccountsList({ accounts, currency }: { accounts: Row[]; currency: string }) {
  if (!accounts.length) return null
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Accounts</p>
      {accounts.map(a => (
        <Card key={a.id}>
          <CardContent className="py-3.5">
            <div className="flex items-start gap-3">
              <span className={cn('flex items-center justify-center w-9 h-9 rounded-xl shrink-0',
                a.type === 'business' ? 'bg-foreground text-background' : 'bg-primary/15 text-primary')}>
                {a.type === 'business' ? <Briefcase size={16} /> : <Wallet size={16} />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold truncate">{a.name}</p>
                  <span className="text-sm font-semibold tabular-nums shrink-0">
                    {a.balance !== null ? `${currency} ${a.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—'}
                  </span>
                </div>
                {a.purpose && <p className="text-xs text-muted-foreground mt-0.5">{a.purpose}</p>}
                {(a.goalTitle || a.businessName) && (
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {a.goalTitle && (
                      <span className="inline-flex items-center gap-1 text-[11px] rounded-full bg-primary/10 text-primary px-2 py-0.5">
                        <Target size={11} /> {a.goalTitle}
                      </span>
                    )}
                    {a.businessName && (
                      <span className="inline-flex items-center gap-1 text-[11px] rounded-full bg-muted px-2 py-0.5">
                        <Building2 size={11} /> {a.businessName}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
