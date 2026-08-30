'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

type Craving = { feeling: string | null; rode_out: boolean }

const FEELINGS = ['Stressed', 'Bored', 'Tired', 'Lonely', 'Anxious', 'Celebrating', 'Actually hungry']

export default function CravingTracker({ userId, cravings }: { userId: string; cravings: Craving[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [feeling, setFeeling] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const total = cravings.length
  const resisted = cravings.filter(c => c.rode_out).length
  const pct = total ? Math.round((resisted / total) * 100) : null

  async function log(rodeOut: boolean) {
    setBusy(true)
    const { createClient } = await import('@/lib/supabase/client')
    await createClient().from('cravings').insert({ user_id: userId, feeling, rode_out: rodeOut })
    setBusy(false); setOpen(false); setFeeling(null)
    router.refresh()
  }

  return (
    <Card>
      <CardContent className="py-4">
        {!open ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold flex items-center gap-2"><Flame size={16} className="text-primary" /> Craving hitting?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {total ? `${resisted} beaten this month · ${pct}% resisted` : 'Tap when an urge strikes - ride it out.'}
              </p>
            </div>
            <Button onClick={() => setOpen(true)} className="rounded-full shrink-0">Ride it out</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium">What are you feeling right now?</p>
            <div className="flex flex-wrap gap-2">
              {FEELINGS.map(f => (
                <button key={f} onClick={() => setFeeling(f)}
                  className={cn('text-xs rounded-full px-3 py-1.5 border transition-colors',
                    feeling === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}>
                  {f}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Cravings peak and pass in ~15 minutes. Drink a glass of water, step away, and give it a few minutes before you decide. You’ve got this.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => log(true)} disabled={busy} className="flex-1 rounded-full gap-1.5"><Check size={15} /> I beat it</Button>
              <Button onClick={() => log(false)} disabled={busy} variant="outline" className="rounded-full text-muted-foreground">Gave in</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
