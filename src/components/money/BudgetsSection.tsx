'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Wallet, Plus, AlertTriangle, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Budget = { id: string; category: string; monthly_limit: number }
type Tx = { direction: string; amount: number; category: string | null }

const CATEGORIES = ['groceries', 'dining', 'supplies', 'subscriptions', 'travel', 'fuel', 'utilities', 'equipment', 'other']

export default function BudgetsSection({ userId, budgets, transactions, currency }: {
  userId: string; budgets: Budget[]; transactions: Tx[]; currency: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [adding, setAdding] = useState(false)
  const [cat, setCat] = useState('groceries')
  const [limit, setLimit] = useState('')
  const [busy, setBusy] = useState(false)

  const spentByCat: Record<string, number> = {}
  for (const t of transactions) {
    if (t.direction !== 'expense') continue
    const c = t.category ?? 'other'
    spentByCat[c] = (spentByCat[c] ?? 0) + t.amount
  }

  const totalBudget = budgets.reduce((s, b) => s + b.monthly_limit, 0)
  const totalSpent = budgets.reduce((s, b) => s + (spentByCat[b.category] ?? 0), 0)
  const money = (n: number) => `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

  async function addBudget() {
    if (!limit) return
    setBusy(true)
    await supabase.from('budgets').upsert(
      { user_id: userId, category: cat, monthly_limit: parseFloat(limit) },
      { onConflict: 'user_id,category' }
    )
    setLimit(''); setAdding(false); setBusy(false)
    router.refresh()
  }

  async function remove(id: string) {
    setBusy(true)
    await supabase.from('budgets').delete().eq('id', id)
    setBusy(false)
    router.refresh()
  }

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold flex items-center gap-2"><Wallet size={15} /> Monthly budgets</span>
          {budgets.length > 0 && (
            <span className="text-xs text-muted-foreground">{money(totalSpent)} / {money(totalBudget)}</span>
          )}
        </div>

        {budgets.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground">Set spending limits per category and get warned before you overspend.</p>
        )}

        <div className="space-y-3">
          {budgets.map(b => {
            const spent = spentByCat[b.category] ?? 0
            const pct = Math.min(100, Math.round((spent / b.monthly_limit) * 100))
            const over = spent > b.monthly_limit
            const near = !over && pct >= 80
            return (
              <div key={b.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize font-medium flex items-center gap-1.5">
                    {over && <AlertTriangle size={13} className="text-destructive" />}
                    {b.category}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={cn(over ? 'text-destructive font-semibold' : 'text-muted-foreground')}>
                      {money(spent)} / {money(b.monthly_limit)}
                    </span>
                    <button onClick={() => remove(b.id)} disabled={busy} className="text-muted-foreground hover:text-destructive">
                      <Trash2 size={13} />
                    </button>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all',
                    over ? 'bg-destructive' : near ? 'bg-amber-500' : 'bg-primary')}
                    style={{ width: `${Math.max(4, pct)}%` }} />
                </div>
                {over && <p className="text-xs text-destructive">Over by {money(spent - b.monthly_limit)}</p>}
              </div>
            )
          })}
        </div>

        {adding ? (
          <div className="flex gap-2 items-end">
            <select value={cat} onChange={e => setCat(e.target.value)}
              className="h-10 rounded-xl border border-input bg-transparent px-3 text-sm capitalize">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <Input type="number" inputMode="decimal" placeholder="Limit" value={limit}
              onChange={e => setLimit(e.target.value)} className="flex-1" />
            <Button onClick={addBudget} disabled={busy || !limit} className="rounded-full">Save</Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setAdding(true)} className="w-full rounded-full gap-2">
            <Plus size={15} /> Add budget
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
