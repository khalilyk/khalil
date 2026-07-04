'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { Settings, Camera } from 'lucide-react'

function timeGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Header({ userId, name }: { userId: string; name: string | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8 max-w-lg lg:max-w-none mx-auto">
        <div className="leading-tight">
          <p className="lg:hidden text-[10px] text-muted-foreground uppercase tracking-widest">
            {format(new Date(), 'EEEE, d MMMM')}
          </p>
          <h1 className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold tracking-tight">{timeGreeting()},</span>
            {name && (
              <span className="text-3xl leading-none -mt-0.5" style={{ fontFamily: 'var(--font-hand)' }}>
                {name}
              </span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/admin" className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Settings size={18} />
          </Link>
          <Link
            href="/money?capture=1"
            title="Snap a receipt"
            className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Camera size={18} />
          </Link>
        </div>
      </div>
    </header>
  )
}
