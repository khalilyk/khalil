import Link from 'next/link'
import { Sun, Moon, Dumbbell, Scale } from 'lucide-react'
import { cn } from '@/lib/utils'

type CI = { mood: number | null; energy: number | null }
const MOOD = ['', 'Rough', 'Low', 'Okay', 'Good', 'Great']

export default function TodayCard({ bySlot, workoutTitle, workoutDone, workoutTotal, latestWeight, unit, weekDots, className }: {
  bySlot: Partial<Record<'morning' | 'evening', CI>>
  workoutTitle: string; workoutDone: number; workoutTotal: number
  latestWeight: number | null; unit: string; weekDots: boolean[]; className?: string
}) {
  const am = bySlot.morning, pm = bySlot.evening
  const ciText = (c?: CI) => c?.mood ? `${MOOD[c.mood]}${c.energy ? ` · ⚡${c.energy}` : ''}` : 'Not yet'

  const rows = [
    { icon: Sun, label: 'Morning check-in', value: ciText(am), done: !!am?.mood, href: '/personal' },
    { icon: Moon, label: 'Evening check-in', value: ciText(pm), done: !!pm?.mood, href: '/personal' },
    { icon: Dumbbell, label: workoutTitle, value: workoutTotal ? `${workoutDone}/${workoutTotal}` : 'Rest day', done: workoutDone > 0, href: '/body' },
    { icon: Scale, label: 'Weight', value: latestWeight ? `${latestWeight} ${unit}` : ' - ', done: latestWeight != null, href: '/body' },
  ]

  return (
    <div className={cn('rounded-3xl bg-neutral-900 text-white p-5 flex flex-col', className)}>
      <div className="flex items-center justify-between">
        <span className="font-semibold">Today</span>
        <div className="flex gap-1">
          {weekDots.map((d, i) => (
            <span key={i} className={cn('w-1.5 h-1.5 rounded-full', d ? 'bg-primary' : 'bg-white/20')} />
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-1">
        {rows.map(({ icon: Icon, label, value, done, href }) => (
          <Link key={label} href={href}
            className="flex items-center gap-3 py-2 rounded-xl hover:bg-white/5 px-2 -mx-2 transition-colors">
            <span className={cn('flex items-center justify-center w-8 h-8 rounded-lg shrink-0',
              done ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white/60')}>
              <Icon size={15} />
            </span>
            <span className="flex-1 min-w-0 text-sm truncate">{label}</span>
            <span className={cn('text-sm font-medium shrink-0', done ? 'text-white' : 'text-white/45')}>{value}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
