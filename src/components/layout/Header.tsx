'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { Settings } from 'lucide-react'

const WORDMARK = {
  WebkitMaskImage: 'url(/khalil-wordmark.png)',
  maskImage: 'url(/khalil-wordmark.png)',
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
} as const

export default function Header({ userId, name }: { userId: string; name: string | null }) {
  void userId; void name
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="relative flex items-center justify-between h-16 px-4 lg:px-8 max-w-lg lg:max-w-none mx-auto">
        {/* Date pinned left */}
        <p className="text-[11px] text-white/75 uppercase tracking-widest">
          {format(new Date(), 'EEE, d MMM')}
        </p>

        {/* KHALIL wordmark centered */}
        <Link href="/personal" aria-label="Khalil — home" className="absolute left-1/2 -translate-x-1/2">
          <span className="block h-9 w-[96px] bg-white" style={WORDMARK} />
        </Link>

        {/* Icons pinned right */}
        <div className="flex items-center gap-1">
          <Link href="/admin" className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-colors">
            <Settings size={18} />
          </Link>
        </div>
      </div>
    </header>
  )
}
