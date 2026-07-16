'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Camera, Upload, Loader2, CheckCircle, AlertTriangle, Target } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

type Account = { id: string; name: string; type: string; goalTitle?: string | null }
type Budget = { category: string; monthly_limit: number }

const CATEGORIES = ['groceries','dining','supplies','subscriptions','travel','fuel','utilities','equipment','client_revenue','other']

export default function ReceiptUploader({ userId, accounts, currency, budgets = [], monthByCategory = {}, topGoal = null }: {
  userId: string; accounts: Account[]; currency: string
  budgets?: Budget[]; monthByCategory?: Record<string, number>; topGoal?: string | null
}) {
  const router = useRouter()
  const supabase = createClient()
  const cameraRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<'idle' | 'uploading' | 'parsing' | 'confirm' | 'done'>('idle')
  const [extraction, setExtraction] = useState<{
    merchant?: string; total?: number; date?: string; category?: string; currency?: string
  } | null>(null)
  const [receiptId, setReceiptId] = useState<string | null>(null)
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [overrides, setOverrides] = useState({ merchant: '', amount: '', category: 'other', date: '' })

  // Arriving from the header camera button (/money?capture=1) opens the camera straight away
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('capture') === '1') {
      cameraRef.current?.click()
      // strip the param so a refresh/back doesn't re-trigger the camera
      window.history.replaceState(null, '', '/money')
    }
  }, [])

  async function handleFile(file: File) {
    setStage('uploading')
    const path = `${userId}/${Date.now()}_${file.name}`
    const { error: upErr } = await supabase.storage.from('receipts').upload(path, file)
    if (upErr) { setStage('idle'); return }

    const { data: receipt } = await supabase.from('receipts').insert({
      user_id: userId, image_path: path, status: 'pending'
    }).select().single()

    if (!receipt) { setStage('idle'); return }
    setReceiptId(receipt.id)
    setStage('parsing')

    const res = await fetch('/api/receipts/parse', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiptId: receipt.id })
    })
    const data = await res.json()
    if (data.extraction) {
      setExtraction(data.extraction)
      setOverrides({
        merchant: data.extraction.merchant ?? '',
        amount: String(data.extraction.total ?? ''),
        category: data.extraction.category ?? 'other',
        date: data.extraction.date ?? format(new Date(), 'yyyy-MM-dd'),
      })
    }
    setStage('confirm')
  }

  async function confirm() {
    if (!accountId || !overrides.amount) return
    await supabase.from('transactions').insert({
      user_id: userId, account_id: accountId,
      direction: 'expense', amount: parseFloat(overrides.amount),
      currency: extraction?.currency ?? currency,
      category: overrides.category,
      merchant: overrides.merchant || null,
      occurred_on: overrides.date || format(new Date(), 'yyyy-MM-dd'),
      receipt_id: receiptId, source: 'receipt'
    })
    setStage('done')
    setTimeout(() => { setStage('idle'); setExtraction(null); setReceiptId(null) }, 2000)
    router.refresh()
  }

  if (stage === 'done') return (
    <div className="flex items-center gap-2 text-green-500 text-sm py-2">
      <CheckCircle size={16} /> Receipt saved
    </div>
  )

  return (
    <div className="space-y-3">
      {/* Camera capture (mobile opens the camera directly) */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      {/* Upload from photos / files */}
      <input ref={uploadRef} type="file" accept="image/*" className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

      {stage === 'idle' && (
        <>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => cameraRef.current?.click()} className="flex-1 rounded-full">
              <Camera size={16} className="mr-2" /> Take photo
            </Button>
            <Button variant="outline" onClick={() => uploadRef.current?.click()} className="flex-1 rounded-full">
              <Upload size={16} className="mr-2" /> Upload
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">Snap a receipt or a screenshot of a purchase — I&apos;ll read the amount and check it against your budget.</p>
        </>
      )}

      {(stage === 'uploading' || stage === 'parsing') && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 size={14} className="animate-spin" />
          {stage === 'uploading' ? 'Uploading…' : 'Parsing with Claude…'}
        </div>
      )}

      {stage === 'confirm' && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <p className="text-sm font-medium">Confirm spending</p>
            <Input placeholder="Merchant" value={overrides.merchant} onChange={e => setOverrides(o => ({ ...o, merchant: e.target.value }))} />
            <Input placeholder="Amount" type="number" value={overrides.amount} onChange={e => setOverrides(o => ({ ...o, amount: e.target.value }))} />
            <Select value={overrides.category} onValueChange={v => setOverrides(o => ({ ...o, category: v || 'other' }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="date" value={overrides.date} onChange={e => setOverrides(o => ({ ...o, date: e.target.value }))} />
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground">Which account did it come from?</span>
              <Select value={accountId} onValueChange={v => v && setAccountId(v)}>
                <SelectTrigger><SelectValue placeholder="Choose account" /></SelectTrigger>
                <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <ImpactBanner amount={overrides.amount} category={overrides.category}
              budgets={budgets} monthByCategory={monthByCategory} currency={currency} topGoal={topGoal}
              accountName={accounts.find(a => a.id === accountId)?.name ?? null}
              accountGoal={accounts.find(a => a.id === accountId)?.goalTitle ?? null} />

            <div className="flex gap-2">
              <Button onClick={confirm} className="flex-1">Confirm</Button>
              <Button variant="outline" onClick={() => setStage('idle')} className="flex-1">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Live budget/goal feedback shown while confirming a spend
function ImpactBanner({ amount, category, budgets, monthByCategory, currency, topGoal, accountName, accountGoal }: {
  amount: string; category: string; budgets: Budget[]; monthByCategory: Record<string, number>
  currency: string; topGoal: string | null; accountName: string | null; accountGoal: string | null
}) {
  const amt = parseFloat(amount) || 0
  if (amt <= 0) return null
  const money = (n: number) => `${currency} ${Math.abs(Math.round(n)).toLocaleString()}`
  const spent = monthByCategory[category] ?? 0
  const budget = budgets.find(b => b.category === category)

  // Strongest signal: spending straight out of an account earmarked for a goal
  if (accountGoal) {
    return (
      <div className="rounded-xl px-3 py-2.5 text-sm flex items-start gap-2 bg-destructive/10 text-destructive">
        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
        <span>
          You&apos;re spending <strong>{money(amt)}</strong> from {accountName ?? 'savings'}, which funds <strong>{accountGoal}</strong> — this sets that goal back.
        </span>
      </div>
    )
  }

  if (budget) {
    const remaining = budget.monthly_limit - (spent + amt)
    const over = remaining < 0
    return (
      <div className={cn('rounded-xl px-3 py-2.5 text-sm flex items-start gap-2',
        over ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary')}>
        {over ? <AlertTriangle size={15} className="mt-0.5 shrink-0" /> : <Target size={15} className="mt-0.5 shrink-0" />}
        <span>
          {over
            ? <>This puts you <strong>{money(remaining)} over</strong> your {category} budget this month.{topGoal && <> That&apos;s money not going toward <strong>{topGoal}</strong>.</>}</>
            : <><strong>{money(remaining)} left</strong> in your {category} budget this month — you&apos;re on track.</>}
        </span>
      </div>
    )
  }

  return (
    <div className="rounded-xl px-3 py-2.5 text-sm bg-muted text-muted-foreground flex items-start gap-2">
      <Target size={15} className="mt-0.5 shrink-0" />
      <span>No budget set for {category}. {topGoal ? <>Every dollar saved gets you closer to <strong>{topGoal}</strong>.</> : 'Set a budget to track this category.'}</span>
    </div>
  )
}
