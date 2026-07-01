'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Droplet, Ban } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function RemindersSection({ userId, remindWater, remindSnack }: {
  userId: string; remindWater: boolean; remindSnack: boolean
}) {
  const router = useRouter()
  const supabase = createClient()
  const [water, setWater] = useState(remindWater)
  const [snack, setSnack] = useState(remindSnack)

  async function set(col: 'remind_water' | 'remind_snack', value: boolean) {
    if (col === 'remind_water') setWater(value); else setSnack(value)
    await supabase.from('profiles').update({ [col]: value }).eq('id', userId)
    router.refresh()
  }

  const Row = ({ icon: Icon, label, sub, on, toggle }: {
    icon: typeof Droplet; label: string; sub: string; on: boolean; toggle: (v: boolean) => void
  }) => (
    <div className="flex items-center gap-3">
      <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted shrink-0"><Icon size={16} /></span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <button onClick={() => toggle(!on)}
        className={cn('w-11 h-6 rounded-full p-0.5 transition-colors shrink-0', on ? 'bg-primary' : 'bg-muted')}>
        <span className={cn('block w-5 h-5 rounded-full bg-white shadow transition-transform', on && 'translate-x-5')} />
      </button>
    </div>
  )

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        <p className="text-sm font-semibold">Reminders</p>
        <Row icon={Droplet} label="Drink water" sub="Every hour, 10am–5pm" on={water} toggle={v => set('remind_water', v)} />
        <Row icon={Ban} label="No snacking" sub="Hourly nudge, 10am–5pm" on={snack} toggle={v => set('remind_snack', v)} />
        <p className="text-[11px] text-muted-foreground">Enable notifications in Admin to receive these on your phone or computer.</p>
      </CardContent>
    </Card>
  )
}
