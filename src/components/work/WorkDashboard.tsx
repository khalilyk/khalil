'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Plus, Check, Trash2, TrendingUp, Package, ListTodo } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { BUSINESSES, type WorkItem, type BusinessKey } from '@/lib/work'
import type { LiveStat } from '@/lib/businesses'

const KINDS = [
  { v: 'revenue', label: 'Revenue' },
  { v: 'project', label: 'Project' },
  { v: 'order', label: 'Order' },
  { v: 'task', label: 'Task' },
]

export default function WorkDashboard({ userId, items, currency, live }: {
  userId: string; items: WorkItem[]; currency: string; live?: Partial<Record<BusinessKey, LiveStat>>
}) {
  const router = useRouter()
  const [openAdd, setOpenAdd] = useState<BusinessKey | null>(null)
  const [kind, setKind] = useState('task')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [due, setDue] = useState('')
  const [busy, setBusy] = useState(false)

  async function client() {
    const { createClient } = await import('@/lib/supabase/client')
    return createClient()
  }

  async function addItem(business: BusinessKey) {
    if (!title.trim()) return
    setBusy(true)
    const supabase = await client()
    await supabase.from('work_items').insert({
      user_id: userId, business, kind, title: title.trim(),
      amount: amount ? parseFloat(amount) : null,
      status: kind === 'revenue' ? 'done' : 'pending',
      due_date: due || null,
    })
    setTitle(''); setAmount(''); setDue(''); setKind('task'); setOpenAdd(null); setBusy(false)
    router.refresh()
  }

  async function toggle(item: WorkItem) {
    setBusy(true)
    const supabase = await client()
    await supabase.from('work_items').update({ status: item.status === 'done' ? 'pending' : 'done' }).eq('id', item.id)
    setBusy(false); router.refresh()
  }

  async function remove(id: string) {
    setBusy(true)
    const supabase = await client()
    await supabase.from('work_items').delete().eq('id', id)
    setBusy(false); router.refresh()
  }

  const money = (n: number) => `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

  return (
    <div className="grid gap-4 lg:grid-cols-3 [&>*]:min-w-0">
      {BUSINESSES.map(biz => {
        const mine = items.filter(i => i.business === biz.key)
        const liveStat = live?.[biz.key]
        const isLive = !!liveStat
        const revenue = isLive ? liveStat!.revenue : mine.filter(i => i.kind === 'revenue').reduce((s, i) => s + (i.amount ?? 0), 0)
        const pending = isLive
          ? liveStat!.pending.map((p, idx) => ({ id: `live-${idx}`, title: p.title, amount: p.amount, kind: '', status: p.status, due_date: null } as WorkItem & { id: string }))
          : mine.filter(i => (i.kind === 'project' || i.kind === 'order') && i.status !== 'done')
        const tasks = mine.filter(i => i.kind === 'task' && i.status !== 'done')

        return (
          <Card key={biz.key} className="flex flex-col">
            <CardContent className="py-4 space-y-4 flex-1">
              {/* Header + revenue */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">{biz.name}</h3>
                  <span className="text-[10px] uppercase tracking-wider text-primary bg-primary/10 rounded-full px-2 py-0.5 flex items-center gap-1">
                    <TrendingUp size={11} /> {isLive ? 'live' : 'made'}
                  </span>
                </div>
                <p className="text-2xl font-bold tabular-nums mt-1">{money(revenue)}</p>
              </div>

              {/* Pending projects / orders */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Package size={12} /> Pending ({pending.length})
                </p>
                <div className="space-y-1.5">
                  {pending.length === 0 && <p className="text-sm text-muted-foreground/60">Nothing pending.</p>}
                  {pending.map(p => (
                    <div key={p.id} className="flex items-center gap-2 text-sm">
                      {isLive ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      ) : (
                        <button onClick={() => toggle(p)} disabled={busy}
                          className="w-4 h-4 rounded border border-border hover:border-primary shrink-0" />
                      )}
                      <span className="flex-1 min-w-0 truncate">
                        {p.title}
                        {!isLive && p.kind && <span className="text-muted-foreground"> · {p.kind}</span>}
                      </span>
                      {p.amount != null && <span className="text-muted-foreground shrink-0">{money(p.amount)}</span>}
                      {p.due_date && <span className="text-[11px] text-muted-foreground shrink-0">{format(parseISO(p.due_date), 'd MMM')}</span>}
                      {!isLive && (
                        <button onClick={() => remove(p.id)} disabled={busy} className="text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tasks */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <ListTodo size={12} /> To do ({tasks.length})
                </p>
                <div className="space-y-1.5">
                  {tasks.length === 0 && <p className="text-sm text-muted-foreground/60">No tasks.</p>}
                  {tasks.map(t => (
                    <div key={t.id} className="flex items-center gap-2 text-sm">
                      <button onClick={() => toggle(t)} disabled={busy}
                        className="w-4 h-4 rounded-full border border-border hover:border-primary shrink-0 flex items-center justify-center">
                        {busy ? null : null}
                      </button>
                      <span className="flex-1 min-w-0 truncate">{t.title}</span>
                      {t.due_date && <span className="text-[11px] text-muted-foreground shrink-0">{format(parseISO(t.due_date), 'd MMM')}</span>}
                      <button onClick={() => remove(t.id)} disabled={busy} className="text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>

            {/* Add */}
            <div className="px-4 pb-4">
              {openAdd === biz.key ? (
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex gap-2">
                    <select value={kind} onChange={e => setKind(e.target.value)}
                      className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm">
                      {KINDS.map(k => <option key={k.v} value={k.v}>{k.label}</option>)}
                    </select>
                    {(kind === 'revenue' || kind === 'project' || kind === 'order') && (
                      <Input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} className="h-9 flex-1" />
                    )}
                  </div>
                  <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="h-9"
                    onKeyDown={e => { if (e.key === 'Enter') addItem(biz.key) }} />
                  {kind !== 'revenue' && (
                    <Input type="date" value={due} onChange={e => setDue(e.target.value)} className="h-9" />
                  )}
                  <div className="flex gap-2">
                    <Button onClick={() => addItem(biz.key)} disabled={busy || !title.trim()} className="flex-1 rounded-full h-9">
                      {busy ? <Loader2 size={14} className="animate-spin" /> : 'Add'}
                    </Button>
                    <Button variant="ghost" onClick={() => setOpenAdd(null)} className="rounded-full h-9">Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" onClick={() => { setOpenAdd(biz.key); setKind('task') }} className="w-full rounded-full gap-2">
                  <Plus size={15} /> Add item
                </Button>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
