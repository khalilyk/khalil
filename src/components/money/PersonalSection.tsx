'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'

type Account = { id: string; name: string; type: string }
type Tx = { id: string; account_id: string; direction: string; amount: number; category: string | null; merchant: string | null; occurred_on: string; note: string | null }
type Snapshot = { id: string; account_id: string; balance: number; as_of: string; note: string | null }

const CATEGORIES = ['groceries','dining','supplies','subscriptions','travel','fuel','utilities','equipment','client_revenue','other']

export default function PersonalSection({ userId, accounts, transactions, snapshots, currency }: {
  userId: string; accounts: Account[]; transactions: Tx[]; snapshots: Snapshot[]; currency: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [showTxForm, setShowTxForm] = useState(false)
  const [showSnapForm, setShowSnapForm] = useState(false)
  const [form, setForm] = useState({ amount: '', category: 'other', merchant: '', note: '', date: format(new Date(), 'yyyy-MM-dd'), direction: 'expense' })
  const [snapForm, setSnapForm] = useState({ balance: '', note: '', date: format(new Date(), 'yyyy-MM-dd') })
  const [loading, setLoading] = useState(false)

  const personalAccount = accounts[0]
  const latestSnap = personalAccount ? snapshots.filter(s => s.account_id === personalAccount.id)[0] : null
  const personalTxs = personalAccount ? transactions.filter(t => t.account_id === personalAccount.id) : []
  const monthExpenses = personalTxs.filter(t => t.direction === 'expense').reduce((s, t) => s + t.amount, 0)

  async function addAccount() {
    await supabase.from('accounts').insert({ user_id: userId, type: 'personal', name: 'Personal' })
    router.refresh()
  }

  async function addTransaction() {
    if (!personalAccount || !form.amount) return
    setLoading(true)
    await supabase.from('transactions').insert({
      user_id: userId, account_id: personalAccount.id,
      direction: form.direction as 'income' | 'expense',
      amount: parseFloat(form.amount), currency,
      category: form.category, merchant: form.merchant || null,
      note: form.note || null, occurred_on: form.date, source: 'manual'
    })
    setShowTxForm(false)
    setForm({ amount: '', category: 'other', merchant: '', note: '', date: format(new Date(), 'yyyy-MM-dd'), direction: 'expense' })
    setLoading(false)
    router.refresh()
  }

  async function addSnapshot() {
    if (!personalAccount || !snapForm.balance) return
    setLoading(true)
    await supabase.from('balance_snapshots').insert({
      user_id: userId, account_id: personalAccount.id,
      balance: parseFloat(snapForm.balance), as_of: snapForm.date, note: snapForm.note || null
    })
    setShowSnapForm(false)
    setLoading(false)
    router.refresh()
  }

  if (!personalAccount) return (
    <Button onClick={addAccount} variant="outline" className="w-full">Set up Personal account</Button>
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="text-xl font-semibold mt-0.5">{latestSnap ? `${currency} ${latestSnap.balance.toFixed(0)}` : '—'}</p>
            {latestSnap && <p className="text-xs text-muted-foreground">{format(new Date(latestSnap.as_of), 'd MMM')}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Month spend</p>
            <p className="text-xl font-semibold mt-0.5">{currency} {monthExpenses.toFixed(0)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => { setShowTxForm(!showTxForm); setShowSnapForm(false) }}>
          <Plus size={14} className="mr-1" /> Transaction
        </Button>
        <Button variant="outline" size="sm" onClick={() => { setShowSnapForm(!showSnapForm); setShowTxForm(false) }}>
          <Plus size={14} className="mr-1" /> Balance
        </Button>
      </div>

      {showTxForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex gap-2">
              <Select value={form.direction} onValueChange={v => setForm(f => ({ ...f, direction: v || 'expense' }))}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Amount" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v || 'other' }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Merchant" value={form.merchant} onChange={e => setForm(f => ({ ...f, merchant: e.target.value }))} />
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            <Button onClick={addTransaction} disabled={loading} className="w-full">Add</Button>
          </CardContent>
        </Card>
      )}

      {showSnapForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <Input placeholder="Balance" type="number" value={snapForm.balance} onChange={e => setSnapForm(f => ({ ...f, balance: e.target.value }))} />
            <Input type="date" value={snapForm.date} onChange={e => setSnapForm(f => ({ ...f, date: e.target.value }))} />
            <Input placeholder="Note (optional)" value={snapForm.note} onChange={e => setSnapForm(f => ({ ...f, note: e.target.value }))} />
            <Button onClick={addSnapshot} disabled={loading} className="w-full">Save snapshot</Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {personalTxs.slice(0, 20).map(tx => (
          <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <div>
              <p className="text-sm font-medium">{tx.merchant ?? tx.category ?? 'Transaction'}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(tx.occurred_on), 'd MMM')} · {tx.category}</p>
            </div>
            <span className={tx.direction === 'expense' ? 'text-sm font-medium text-destructive' : 'text-sm font-medium text-green-500'}>
              {tx.direction === 'expense' ? '-' : '+'}{currency} {tx.amount.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
