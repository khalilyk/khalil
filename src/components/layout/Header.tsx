'use client'

import Link from 'next/link'
import { Settings } from 'lucide-react'

export default function Header({ userId, name }: { userId: string; name: string | null }) {
  void userId; void name
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border">
      <div className="relative flex items-center justify-end h-14 px-4 lg:px-8 max-w-lg lg:max-w-none mx-auto">
        <Link href="/personal" aria-label="Home"
          className="absolute left-1/2 -translate-x-1/2 text-xl font-extrabold tracking-tight">
          kk<span className="text-primary">.</span>
        </Link>

        <Link href="/admin"
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Settings size={18} />
        </Link>
      </div>
    </header>
  )
}
