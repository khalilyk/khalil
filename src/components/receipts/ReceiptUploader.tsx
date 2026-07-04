'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Camera, Upload, Loader2, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

type Account = { id: string; name: string; type: string }

const CATEGORIES = ['groceries','dining','supplies','subscriptions','travel','fuel','utilities','equipment','client_revenue','other']

export default function ReceiptUploader({ userId, accounts, currency }: {
  userId: string; accounts: Account[]; currency: string
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => cameraRef.current?.click()} className="flex-1 rounded-full">
            <Camera size={16} className="mr-2" /> Take photo
          </Button>
          <Button variant="outline" onClick={() => uploadRef.current?.click()} className="flex-1 rounded-full">
            <Upload size={16} className="mr-2" /> Upload
          </Button>
        </div>
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
            <p className="text-sm font-medium">Confirm receipt</p>
            <Input placeholder="Merchant" value={overrides.merchant} onChange={e => setOverrides(o => ({ ...o, merchant: e.target.value }))} />
            <Input placeholder="Amount" type="number" value={overrides.amount} onChange={e => setOverrides(o => ({ ...o, amount: e.target.value }))} />
            <Select value={overrides.category} onValueChange={v => setOverrides(o => ({ ...o, category: v || 'other' }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="date" value={overrides.date} onChange={e => setOverrides(o => ({ ...o, date: e.target.value }))} />
            <Select value={accountId} onValueChange={v => v && setAccountId(v)}>
              <SelectTrigger><SelectValue placeholder="Account" /></SelectTrigger>
              <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
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
