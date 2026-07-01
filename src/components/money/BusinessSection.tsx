'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'

type Account = { id: string; name: string; type: string }
type Tx = { id: string; account_id: string; direction: string; amount: number; category: string | null; merchant: string | null; occurred_on: string; note: string | null }

const CATEGORIES = ['groceries','dining','supplies','subscriptions','travel','fuel','utilities','equipment','client_revenue','other']

export default function BusinessSection({ userId, accounts, transactions, currency }: {
  userId: string; accounts: Account[]; transactions: Tx[]; currency: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [newBizName, setNewBizName] = useState('')
  const [addingBiz, setAddingBiz] = useState(false)
  const [activeBiz, setActiveBiz] = useState<string | null>(accounts[0]?.id ?? null)
  const [showTxForm, setShowTxForm] = useState(false)
  const [form, setForm] = useState({ amount: '', category: 'other', merchant: '', note: '', date: format(new Date(), 'yyyy-MM-dd'), direction: 'income' })
  const [loading, setLoading] = useState(false)

  async function addBusiness() {
    if (!newBizName.trim()) return
    setAddingBiz(true)
    const { data } = await supabase.from('accounts').insert({ user_id: userId, type: 'business', name: newBizName.trim() }).select().single()
    setNewBizName('')
    setActiveBiz(data?.id ?? null)
    setAddingBiz(false)
    router.refresh()
  }

  async function addTransaction() {
    if (!activeBiz || !form.amount) return
    setLoading(true)
    await supabase.from('transactions').insert({
      user_id: userId, account_id: activeBiz,
      direction: form.direction as 'income' | 'expense',
      amount: parseFloat(form.amount), currency,
      category: form.category, merchant: form.merchant || null,
      note: form.note || null, occurred_on: form.date, source: 'manual'
    })
    setShowTxForm(false)
    setForm({ amount: '', category: 'other', merchant: '', note: '', date: format(new Date(), 'yyyy-MM-dd'), direction: 'income' })
    setLoading(false)
    router.refresh()
  }

  const bizTxs = (acctId: string) => transactions.filter(t => t.account_id === acctId)
  const revenue = (acctId: string) => bizTxs(acctId).filter(t => t.direction === 'income').reduce((s, t) => s + t.amount, 0)
  const costs = (acctId: string) => bizTxs(acctId).filter(t => t.direction === 'expense').reduce((s, t) => s + t.amount, 0)
  const profit = (acctId: string) => revenue(acctId) - costs(acctId)

  return (
    <div className="space-y-4">
      {accounts.length === 0 && (
        <p className="text-sm text-muted-foreground">No business accounts yet.</p>
      )}

      {accounts.map(acct => {
        const open = activeBiz === acct.id
        const p = profit(acct.id)
        return (
          <Card key={acct.id}>
            <button className="w-full" onClick={() => setActiveBiz(open ? null : acct.id)}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base">{acct.name}</CardTitle>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${p >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                    {p >= 0 ? '+' : ''}{currency} {p.toFixed(0)}
                  </span>
                  {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </CardHeader>
            </button>
            {open && (
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-xs text-muted-foreground">Revenue</p><p className="font-semibold text-green-500">{currency} {revenue(acct.id).toFixed(0)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Costs</p><p className="font-semibold text-destructive">{currency} {costs(acct.id).toFixed(0)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Profit</p><p className={`font-semibold ${p >= 0 ? 'text-green-500' : 'text-destructive'}`}>{currency} {p.toFixed(0)}</p></div>
                </div>

                <Button variant="outline" size="sm" className="w-full" onClick={() => setShowTxForm(!showTxForm)}>
                  <Plus size={14} className="mr-1" /> Add transaction
                </Button>

                {showTxForm && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Select value={form.direction} onValueChange={v => setForm(f => ({ ...f, direction: v || 'income' }))}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="Amount" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                    </div>
                    <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v || 'other' }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input placeholder="Note" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
                    <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                    <Button onClick={addTransaction} disabled={loading} className="w-full">Add</Button>
                  </div>
                )}

                <div className="space-y-1">
                  {bizTxs(acct.id).slice(0, 10).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm">{tx.note ?? tx.category ?? 'Transaction'}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(tx.occurred_on), 'd MMM')}</p>
                      </div>
                      <span className={`text-sm font-medium ${tx.direction === 'income' ? 'text-green-500' : 'text-destructive'}`}>
                        {tx.direction === 'income' ? '+' : '-'}{currency} {tx.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}

      <div className="flex gap-2">
        <Input placeholder="New business name…" value={newBizName} onChange={e => setNewBizName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addBusiness()} />
        <Button variant="outline" onClick={addBusiness} disabled={addingBiz}><Plus size={16} /></Button>
      </div>
    </div>
  )
}
