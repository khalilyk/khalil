'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Landmark, Upload, Loader2, CheckCircle, X } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

type Account = { id: string; type: 'personal' | 'business'; name: string }
type Parsed = { name: string; balance: number; kind: 'personal' | 'business'; include: boolean }

export default function BankImport({ userId, accounts, currency }: {
  userId: string; accounts: Account[]; currency: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<'idle' | 'parsing' | 'review' | 'saving' | 'done'>('idle')
  const [rows, setRows] = useState<Parsed[]>([])
  const [err, setErr] = useState('')

  async function handleFile(file: File) {
    setErr('')
    setStage('parsing')
    const base64 = await new Promise<string>((res, rej) => {
      const r = new FileReader()
      r.onload = () => res((r.result as string).split(',')[1])
      r.onerror = rej
      r.readAsDataURL(file)
    })
    try {
      const resp = await fetch('/api/accounts/parse', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      })
      const data = await resp.json()
      if (!resp.ok || !data.accounts?.length) {
        setErr(data.accounts && !data.accounts.length ? 'No accounts found in that image.' : 'Could not read that screenshot.')
        setStage('idle'); return
      }
      setRows((data.accounts as Omit<Parsed, 'include'>[]).map(a => ({ ...a, include: true })))
      setStage('review')
    } catch {
      setErr('Something went wrong reading the image.')
      setStage('idle')
    }
  }

  const update = (i: number, patch: Partial<Parsed>) =>
    setRows(rows => rows.map((r, j) => j === i ? { ...r, ...patch } : r))

  async function save() {
    setStage('saving')
    const today = format(new Date(), 'yyyy-MM-dd')
    for (const r of rows.filter(r => r.include)) {
      // Match an existing account by name, else create it in the chosen section
      let accountId = accounts.find(a => a.name.toLowerCase() === r.name.toLowerCase())?.id
      if (!accountId) {
        const { data } = await supabase.from('accounts')
          .insert({ user_id: userId, type: r.kind, name: r.name }).select('id').single()
        accountId = data?.id
      }
      if (!accountId) continue
      await supabase.from('balance_snapshots').insert({
        user_id: userId, account_id: accountId, balance: r.balance, as_of: today, note: 'Imported from bank screenshot',
      })
    }
    setStage('done')
    setTimeout(() => { setStage('idle'); setRows([]) }, 2000)
    router.refresh()
  }

  if (stage === 'done') return (
    <div className="flex items-center gap-2 text-green-600 text-sm py-2">
      <CheckCircle size={16} /> Balances imported
    </div>
  )

  return (
    <div className="space-y-3">
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

      {stage === 'idle' && (
        <>
          <Button variant="outline" onClick={() => fileRef.current?.click()} className="w-full rounded-full gap-2">
            <Landmark size={16} /> Import from bank screenshot
          </Button>
          {err && <p className="text-xs text-destructive">{err}</p>}
        </>
      )}

      {stage === 'parsing' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 size={14} className="animate-spin" /> Reading accounts with Claude…
        </div>
      )}

      {stage === 'review' && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <p className="text-sm font-medium flex items-center gap-2"><Upload size={14} /> Confirm accounts &amp; balances</p>
            <div className="space-y-2">
              {rows.map((r, i) => (
                <div key={i} className={cn('rounded-xl border p-2.5 space-y-2', !r.include && 'opacity-50')}>
                  <div className="flex items-center gap-2">
                    <Input value={r.name} onChange={e => update(i, { name: e.target.value })} className="h-9 flex-1" placeholder="Account name" />
                    <Input type="number" inputMode="decimal" value={r.balance}
                      onChange={e => update(i, { balance: parseFloat(e.target.value) || 0 })} className="h-9 w-28 text-right" />
                    <button onClick={() => update(i, { include: !r.include })} title={r.include ? 'Skip' : 'Include'}
                      className="w-9 h-9 shrink-0 grid place-items-center rounded-lg hover:bg-muted text-muted-foreground">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex gap-1 bg-muted rounded-full p-1 w-fit">
                    {(['personal', 'business'] as const).map(k => (
                      <button key={k} onClick={() => update(i, { kind: k })}
                        className={cn('text-xs font-medium rounded-full px-3 py-1 capitalize transition-colors',
                          r.kind === k ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
                        {k}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">Currency: {currency}. Saves a balance snapshot dated today; matching account names are reused.</p>
            <div className="flex gap-2">
              <Button onClick={save} disabled={stage !== 'review' || !rows.some(r => r.include)} className="flex-1 rounded-full">
                Save {rows.filter(r => r.include).length} account{rows.filter(r => r.include).length === 1 ? '' : 's'}
              </Button>
              <Button variant="outline" onClick={() => { setStage('idle'); setRows([]) }} className="flex-1 rounded-full">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {stage === 'saving' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 size={14} className="animate-spin" /> Saving balances…
        </div>
      )}
    </div>
  )
}
