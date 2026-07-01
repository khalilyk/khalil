'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Check, Plus, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { subDays, format, parseISO, eachDayOfInterval } from 'date-fns'

type Anchor = { id: string; name: string; type: string | null; target: number | null; active: boolean }
type AnchorLog = { id: string; anchor_id: string; logged_on: string; value: number | null }

function streak(logs: AnchorLog[], anchorId: string): number {
  const days = new Set(logs.filter(l => l.anchor_id === anchorId).map(l => l.logged_on))
  let count = 0
  let d = new Date()
  while (days.has(format(d, 'yyyy-MM-dd'))) {
    count++
    d = subDays(d, 1)
  }
  return count
}

export default function AnchorsSection({ userId, anchors, anchorLogs, today }: {
  userId: string; anchors: Anchor[]; anchorLogs: AnchorLog[]; today: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [newAnchor, setNewAnchor] = useState('')
  const [adding, setAdding] = useState(false)

  async function toggleAnchor(anchor: Anchor) {
    const existing = anchorLogs.find(l => l.anchor_id === anchor.id && l.logged_on === today)
    if (existing) {
      await supabase.from('anchor_logs').delete().eq('id', existing.id)
    } else {
      await supabase.from('anchor_logs').insert({ user_id: userId, anchor_id: anchor.id, logged_on: today, value: 1 })
    }
    router.refresh()
  }

  async function addAnchor() {
    if (!newAnchor.trim()) return
    setAdding(true)
    await supabase.from('anchors').insert({ user_id: userId, name: newAnchor.trim(), type: 'binary', active: true })
    setNewAnchor('')
    setAdding(false)
    router.refresh()
  }

  return (
    <section className="space-y-4">
      <h2 className="font-medium">Anchors</h2>
      <div className="space-y-2">
        {anchors.map(anchor => {
          const done = anchorLogs.some(l => l.anchor_id === anchor.id && l.logged_on === today)
          const s = streak(anchorLogs, anchor.id)
          return (
            <Card key={anchor.id} className={cn('transition-colors', done && 'border-primary/30 bg-primary/5')}>
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleAnchor(anchor)}
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0',
                      done ? 'bg-primary text-primary-foreground' : 'border border-border hover:border-primary'
                    )}>
                    {done && <Check size={14} />}
                  </button>
                  <span className={cn('text-sm font-medium', done && 'line-through opacity-60')}>{anchor.name}</span>
                </div>
                {s > 0 && (
                  <div className="flex items-center gap-1 text-orange-400">
                    <Flame size={12} />
                    <span className="text-xs font-medium">{s}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
      <div className="flex gap-2">
        <Input placeholder="New anchor…" value={newAnchor} onChange={e => setNewAnchor(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addAnchor()} />
        <Button variant="outline" onClick={addAnchor} disabled={adding}><Plus size={16} /></Button>
      </div>
    </section>
  )
}
