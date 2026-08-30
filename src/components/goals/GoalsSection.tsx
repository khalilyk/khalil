'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, Check, Target, Trash2, Calendar as CalIcon, ChevronDown, ListChecks } from 'lucide-react'
import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import Countdown from './Countdown'
import type { Goal } from '@/types/goal'

export type Milestone = { id: string; goal_id: string; title: string; done: boolean }

const CATEGORIES = ['Money', 'Body', 'Career', 'Personal', 'Travel', 'Learning']

function dueLabel(date: string | null): { text: string; tone: string } {
  if (!date) return { text: 'No date set', tone: 'text-muted-foreground' }
  const days = differenceInCalendarDays(parseISO(date), new Date())
  const when = format(parseISO(date), 'd MMM yyyy')
  if (days < 0) return { text: `Overdue · ${when}`, tone: 'text-destructive' }
  if (days === 0) return { text: `Due today · ${when}`, tone: 'text-foreground' }
  if (days <= 31) return { text: `${days}d left · ${when}`, tone: 'text-foreground' }
  const months = Math.round(days / 30)
  return { text: `~${months} mo · ${when}`, tone: 'text-muted-foreground' }
}

export default function GoalsSection({ userId, goals, milestones, categories, currentSavings }: {
  userId: string; goals: Goal[]; milestones: Milestone[]; categories?: string[]; currentSavings?: number
}) {
  const router = useRouter()
  const cats = categories ?? CATEGORIES
  const single = cats.length === 1
  const catLower = cats.map(c => c.toLowerCase())
  const TABS = single ? [] : ['All', ...cats]
  const [tab, setTab] = useState(single ? cats[0] : 'All')
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Personal')
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('')
  const [date, setDate] = useState('')
  const [detail, setDetail] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [msInput, setMsInput] = useState('')

  const msByGoal: Record<string, Milestone[]> = {}
  for (const m of milestones) (msByGoal[m.goal_id] ??= []).push(m)

  async function toggleMilestone(m: Milestone) {
    const supabase = await client()
    await supabase.from('milestones').update({ done: !m.done }).eq('id', m.id)
    router.refresh()
  }
  async function addMilestone(goalId: string) {
    if (!msInput.trim()) return
    const supabase = await client()
    await supabase.from('milestones').insert({ user_id: userId, goal_id: goalId, title: msInput.trim() })
    setMsInput('')
    router.refresh()
  }
  async function removeMilestone(id: string) {
    const supabase = await client()
    await supabase.from('milestones').delete().eq('id', id)
    router.refresh()
  }

  const inScope = (g: Goal) => catLower.includes(g.category)
  const inTab = (g: Goal) => (tab === 'All' || g.category === tab.toLowerCase())
  const active = goals.filter(g => g.status === 'active' && inScope(g) && inTab(g))
  const done = goals.filter(g => g.status === 'done' && inScope(g) && inTab(g))
  const countFor = (t: string) =>
    goals.filter(g => g.status === 'active' && inScope(g) && (t === 'All' || g.category === t.toLowerCase())).length

  function openAdd() {
    setCategory(tab !== 'All' ? tab : cats[0])
    setAdding(true)
  }

  // Savings progress for money goals (vs current net worth)
  function savingsProgress(g: Goal) {
    if (g.category !== 'money' || g.target_value == null || currentSavings == null) return null
    const pct = Math.max(0, Math.min(100, Math.round((currentSavings / g.target_value) * 100)))
    const toGo = Math.max(0, g.target_value - currentSavings)
    const u = g.target_unit ? `${g.target_unit} ` : ''
    return { pct, toGo, saved: currentSavings, u }
  }

  async function client() {
    const { createClient } = await import('@/lib/supabase/client')
    return createClient()
  }

  async function addGoal() {
    if (!title.trim()) return
    setSaving(true)
    const supabase = await client()
    await supabase.from('goals').insert({
      user_id: userId,
      title: title.trim(),
      category: category.toLowerCase(),
      target_value: value ? Number(value) : null,
      target_unit: unit.trim() || null,
      target_date: date || null,
      detail: detail.trim() || null,
      status: 'active',
    })
    setTitle(''); setValue(''); setUnit(''); setDate(''); setDetail(''); setCategory('Personal')
    setSaving(false); setAdding(false)
    router.refresh()
  }

  async function toggleDone(g: Goal) {
    setBusyId(g.id)
    const supabase = await client()
    const next = g.status === 'done' ? 'active' : 'done'
    await supabase.from('goals').update({
      status: next,
      completed_at: next === 'done' ? new Date().toISOString() : null,
    }).eq('id', g.id)
    setBusyId(null)
    router.refresh()
  }

  async function remove(g: Goal) {
    setBusyId(g.id)
    const supabase = await client()
    await supabase.from('goals').delete().eq('id', g.id)
    setBusyId(null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Category tabs */}
      {TABS.length > 0 && (
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map(t => {
          const n = countFor(t)
          return (
            <button key={t} onClick={() => setTab(t)}
              className={cn('shrink-0 text-sm rounded-full px-3.5 py-1.5 border transition-colors flex items-center gap-1.5',
                tab === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}>
              {t}
              {n > 0 && (
                <span className={cn('text-[10px] rounded-full px-1.5 leading-4',
                  tab === t ? 'bg-primary-foreground/20' : 'bg-muted')}>{n}</span>
              )}
            </button>
          )
        })}
      </div>
      )}

      {/* Featured goal for this tab - coloured box with live countdown */}
      {(() => {
        const featured = active.find(g => g.target_date) ?? active[0]
        if (!featured) return null
        return (
          <div className="rounded-3xl bg-primary text-primary-foreground p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest font-semibold opacity-70">
                {tab === 'All' ? 'Next up' : `${tab} focus`}
              </span>
              {featured.target_value != null && (
                <span className="text-[11px] font-semibold bg-primary-foreground/20 rounded-full px-2 py-0.5">
                  {featured.target_value.toLocaleString()}{featured.target_unit ? ` ${featured.target_unit}` : ''}
                </span>
              )}
            </div>
            <p className="text-xl font-bold mt-2 leading-tight">{featured.title}</p>
            {featured.target_date ? (
              <>
                <p className="text-sm font-medium mt-3 opacity-80">
                  By {format(parseISO(featured.target_date), 'EEEE, d MMMM yyyy')}
                </p>
                <p className="text-2xl font-extrabold mt-1 tracking-tight">
                  <Countdown date={featured.target_date} />
                </p>
              </>
            ) : (
              <p className="text-sm mt-3 opacity-80">No target date set</p>
            )}
            {(() => {
              const p = savingsProgress(featured)
              if (!p) return null
              return (
                <div className="mt-4">
                  <div className="h-2 rounded-full bg-primary-foreground/25 overflow-hidden">
                    <div className="h-full bg-primary-foreground rounded-full" style={{ width: `${Math.max(3, p.pct)}%` }} />
                  </div>
                  <p className="text-sm font-medium mt-1.5">{p.pct}% there · {p.u}{Math.round(p.toGo).toLocaleString()} to go</p>
                </div>
              )
            })()}
          </div>
        )
      })()}

      {/* Add goal */}
      {adding ? (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Goal</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} autoFocus
                placeholder="e.g. Save $20k emergency fund" className="h-11 rounded-xl" />
            </div>

            {!single && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Category</Label>
              <div className="flex flex-wrap gap-2">
                {cats.map(c => (
                  <button key={c} onClick={() => setCategory(c)}
                    className={cn('text-xs rounded-full px-3 py-1.5 border transition-colors',
                      category === c ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Target (optional)</Label>
                <Input value={value} onChange={e => setValue(e.target.value)} type="number"
                  placeholder="20000" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Unit</Label>
                <Input value={unit} onChange={e => setUnit(e.target.value)}
                  placeholder="AUD, kg, books…" className="h-11 rounded-xl" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Realistic target date</Label>
              <Input value={date} onChange={e => setDate(e.target.value)} type="date" className="h-11 rounded-xl" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Notes (optional)</Label>
              <Textarea value={detail} onChange={e => setDetail(e.target.value)} rows={2}
                placeholder="Why it matters, the plan, milestones…" className="rounded-xl resize-none" />
            </div>

            <div className="flex gap-2">
              <Button onClick={addGoal} disabled={saving || !title.trim()} className="flex-1 rounded-full gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : 'Add goal'}
              </Button>
              <Button variant="ghost" onClick={() => setAdding(false)} className="rounded-full">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={openAdd} className="w-full rounded-full gap-2">
          <Plus size={16} /> New goal{tab !== 'All' ? ` · ${tab}` : ''}
        </Button>
      )}

      {/* Active goals */}
      {active.length === 0 && !adding && (
        <div className="text-center py-10 text-muted-foreground">
          <Target size={28} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">
            {tab === 'All'
              ? 'No goals yet. Add the first thing you’re reaching for.'
              : `No ${tab} goals yet.`}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {active.map(g => {
          const due = dueLabel(g.target_date)
          return (
            <Card key={g.id}>
              <CardContent className="py-4 flex items-start gap-3">
                <button onClick={() => toggleDone(g)} disabled={busyId === g.id}
                  className="mt-0.5 w-6 h-6 shrink-0 rounded-full border-2 border-border hover:border-primary flex items-center justify-center transition-colors">
                  {busyId === g.id ? <Loader2 size={12} className="animate-spin" /> : null}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted rounded-full px-2 py-0.5">{g.category}</span>
                    {g.target_value != null && (
                      <span className="text-[10px] uppercase tracking-wider text-primary-foreground bg-primary rounded-full px-2 py-0.5">
                        {g.target_value.toLocaleString()} {g.target_unit ?? ''}
                      </span>
                    )}
                  </div>
                  <p className="font-medium mt-1.5">{g.title}</p>
                  {g.detail && <p className="text-sm text-muted-foreground mt-0.5">{g.detail}</p>}
                  <p className={cn('text-xs mt-1.5 flex items-center gap-1', due.tone)}>
                    <CalIcon size={12} /> {due.text}
                  </p>

                  {/* Savings progress (money goals) */}
                  {(() => {
                    const p = savingsProgress(g)
                    if (!p) return null
                    return (
                      <div className="mt-2">
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.max(3, p.pct)}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="font-semibold text-foreground">{p.pct}%</span> · {p.u}{Math.round(p.saved).toLocaleString()} saved · {p.u}{Math.round(p.toGo).toLocaleString()} to go
                        </p>
                      </div>
                    )
                  })()}

                  {/* Milestones */}
                  {(() => {
                    const ms = msByGoal[g.id] ?? []
                    const doneCount = ms.filter(m => m.done).length
                    const isOpen = expanded === g.id
                    return (
                      <div className="mt-2">
                        <button onClick={() => { setExpanded(isOpen ? null : g.id); setMsInput('') }}
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                          <ListChecks size={12} /> {ms.length ? `${doneCount}/${ms.length} milestones` : 'Add milestones'}
                          <ChevronDown size={12} className={cn('transition-transform', isOpen && 'rotate-180')} />
                        </button>
                        {isOpen && (
                          <div className="mt-2 space-y-1.5">
                            {ms.map(m => (
                              <div key={m.id} className="flex items-center gap-2">
                                <button onClick={() => toggleMilestone(m)}
                                  className={cn('w-4 h-4 rounded border flex items-center justify-center shrink-0',
                                    m.done ? 'bg-primary border-primary text-primary-foreground' : 'border-border')}>
                                  {m.done && <Check size={11} strokeWidth={3} />}
                                </button>
                                <span className={cn('text-sm flex-1', m.done && 'line-through text-muted-foreground')}>{m.title}</span>
                                <button onClick={() => removeMilestone(m.id)} className="text-muted-foreground hover:text-destructive">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                            <div className="flex gap-2 pt-1">
                              <Input value={msInput} onChange={e => setMsInput(e.target.value)} placeholder="Add a milestone…"
                                className="h-8 text-sm" onKeyDown={e => { if (e.key === 'Enter') addMilestone(g.id) }} />
                              <Button size="sm" variant="outline" onClick={() => addMilestone(g.id)} className="rounded-full h-8">Add</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
                <button onClick={() => remove(g)} disabled={busyId === g.id}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1">
                  <Trash2 size={15} />
                </button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Done goals */}
      {done.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider pt-2">Reached ({done.length})</p>
          {done.map(g => (
            <div key={g.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/50">
              <button onClick={() => toggleDone(g)} disabled={busyId === g.id}
                className="w-6 h-6 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                {busyId === g.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={14} />}
              </button>
              <p className="flex-1 text-sm line-through text-muted-foreground truncate">{g.title}</p>
              <button onClick={() => remove(g)} disabled={busyId === g.id}
                className="text-muted-foreground hover:text-destructive transition-colors p-1">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
