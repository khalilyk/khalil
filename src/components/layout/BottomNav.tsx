'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, DollarSign, Activity, Calendar, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'

const left = [
  { href: '/money', label: 'Money', icon: DollarSign },
  { href: '/body', label: 'Body', icon: Activity },
]
const right = [
  { href: '/work', label: 'Work', icon: Briefcase },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
]

export default function BottomNav() {
  const pathname = usePathname()

  const Item = ({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Home }) => {
    const active = pathname.startsWith(href)
    return (
      <Link href={href} className={cn(
        'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-[52px]',
        active ? 'text-foreground' : 'text-muted-foreground'
      )}>
        <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
        <span className="text-[10px] font-medium">{label}</span>
      </Link>
    )
  }

  const homeActive = pathname === '/'

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-end h-16 max-w-lg mx-auto px-2">
        {left.map(i => <Item key={i.href} {...i} />)}

        {/* Centered Home circle */}
        <Link href="/" className="flex flex-col items-center -mt-6 shrink-0">
          <span className={cn(
            'flex items-center justify-center w-14 h-14 rounded-full shadow-lg border-4 border-background transition-colors',
            homeActive ? 'bg-primary text-primary-foreground' : 'bg-foreground text-background'
          )}>
            <Home size={24} strokeWidth={2.2} />
          </span>
        </Link>

        {right.map(i => <Item key={i.href} {...i} />)}
      </div>
    </nav>
  )
}
