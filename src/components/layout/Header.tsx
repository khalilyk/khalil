'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { Settings, Camera } from 'lucide-react'

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
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
      <div className="relative flex items-center justify-center h-16 px-4 lg:px-8 max-w-lg lg:max-w-none mx-auto">
        {/* Centered brand */}
        <div className="text-center leading-tight">
          <p className="text-[11px] text-white/75 uppercase tracking-widest mb-1">
            {format(new Date(), 'EEEE, d MMMM')}
          </p>
          <Link href="/" aria-label="Khalil — home" className="block">
            <span className="block h-7 w-[74px] mx-auto bg-white" style={WORDMARK} />
          </Link>
        </div>

        {/* Icons pinned right */}
        <div className="absolute right-4 lg:right-8 flex items-center gap-1">
          <Link href="/admin" className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-colors">
            <Settings size={18} />
          </Link>
          <Link
            href="/money?capture=1"
            title="Snap a receipt"
            className="w-9 h-9 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-colors"
          >
            <Camera size={18} />
          </Link>
        </div>
      </div>
    </header>
  )
}
