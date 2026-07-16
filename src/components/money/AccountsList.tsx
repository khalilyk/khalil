'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Wallet, Briefcase, Pencil, Target, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Account = {
  id: string; name: string; type: 'personal' | 'business'
  purpose: string | null; goal_id: string | null; business_key: string | null
}
type Snap = { account_id: string; balance: number; as_of: string }
type Goal = { id: string; title: string }
type Biz = { key: string; name: string }

export default function AccountsList({ userId, accounts, snapshots, goals, businesses, currency }: {
  userId: string; accounts: Account[]; snapshots: Snap[]; goals: Goal[]; businesses: Biz[]; currency: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<{ name: string; purpose: string; goal_id: string; business_key: string }>({ name: '', purpose: '', goal_id: '', business_key: '' })
  const [saving, setSaving] = useState(false)

  const latestBalance = (id: string) => snapshots.filter(s => s.account_id === id)[0]?.balance ?? null

  function startEdit(a: Account) {
    setEditing(a.id)
    setDraft({ name: a.name, purpose: a.purpose ?? '', goal_id: a.goal_id ?? '', business_key: a.business_key ?? '' })
  }

  async function save(a: Account) {
    setSaving(true)
    await supabase.from('accounts').update({
      name: draft.name.trim() || a.name,
      purpose: draft.purpose.trim() || null,
      goal_id: a.type === 'personal' ? (draft.goal_id || null) : null,
      business_key: a.type === 'business' ? (draft.business_key || null) : null,
    }).eq('id', a.id)
    setSaving(false)
    setEditing(null)
    router.refresh()
  }

  if (!accounts.length) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Accounts</p>
      {accounts.map(a => {
        const bal = latestBalance(a.id)
        const goal = goals.find(g => g.id === a.goal_id)
        const biz = businesses.find(b => b.key === a.business_key)
        const isEditing = editing === a.id
        return (
          <Card key={a.id}>
            <CardContent className="py-3.5">
              {isEditing ? (
                <div className="space-y-2.5">
                  <Input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="Account name" className="h-9" />
                  <Input value={draft.purpose} onChange={e => setDraft(d => ({ ...d, purpose: e.target.value }))} placeholder="What's it for? (e.g. Everyday spending & bills)" className="h-9" />
                  {a.type === 'personal' ? (
                    <label className="block">
                      <span className="text-[11px] text-muted-foreground">Link to a goal</span>
                      <select value={draft.goal_id} onChange={e => setDraft(d => ({ ...d, goal_id: e.target.value }))}
                        className="mt-1 w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm">
                        <option value="">None</option>
                        {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                      </select>
                    </label>
                  ) : (
                    <label className="block">
                      <span className="text-[11px] text-muted-foreground">Link to a business</span>
                      <select value={draft.business_key} onChange={e => setDraft(d => ({ ...d, business_key: e.target.value }))}
                        className="mt-1 w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm">
                        <option value="">None</option>
                        {businesses.map(b => <option key={b.key} value={b.key}>{b.name}</option>)}
                      </select>
                    </label>
                  )}
                  <div className="flex gap-2 pt-0.5">
                    <Button onClick={() => save(a)} disabled={saving} size="sm" className="flex-1 rounded-full">Save</Button>
                    <Button onClick={() => setEditing(null)} variant="outline" size="sm" className="flex-1 rounded-full">Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <span className={cn('flex items-center justify-center w-9 h-9 rounded-xl shrink-0',
                    a.type === 'business' ? 'bg-foreground text-background' : 'bg-primary/15 text-primary')}>
                    {a.type === 'business' ? <Briefcase size={16} /> : <Wallet size={16} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold truncate">{a.name}</p>
                      <span className="text-sm font-semibold tabular-nums shrink-0">
                        {bal !== null ? `${currency} ${bal.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—'}
                      </span>
                    </div>
                    {a.purpose && <p className="text-xs text-muted-foreground mt-0.5">{a.purpose}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      {goal && (
                        <span className="inline-flex items-center gap-1 text-[11px] rounded-full bg-primary/10 text-primary px-2 py-0.5">
                          <Target size={11} /> {goal.title}
                        </span>
                      )}
                      {biz && (
                        <span className="inline-flex items-center gap-1 text-[11px] rounded-full bg-muted px-2 py-0.5">
                          <Building2 size={11} /> {biz.name}
                        </span>
                      )}
                      <button onClick={() => startEdit(a)} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                        <Pencil size={11} /> Edit
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
