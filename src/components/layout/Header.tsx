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
  WebkitMaskPosition: 'left center',
  maskPosition: 'left center',
} as const

export default function Header({ userId, name }: { userId: string; name: string | null }) {
  void userId; void name
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8 max-w-lg lg:max-w-none mx-auto">
        <div className="leading-tight">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
            {format(new Date(), 'EEEE, d MMMM')}
          </p>
          {/* KHALIL wordmark, tinted to the theme foreground */}
          <Link href="/" aria-label="Khalil — home" className="block">
            <span className="block h-5 w-[46px] bg-foreground" style={WORDMARK} />
          </Link>
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
