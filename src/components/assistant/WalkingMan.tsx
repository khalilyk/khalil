'use client'

import { cn } from '@/lib/utils'

/**
 * StickFigure — KK's little body. `moving` swings the arms/legs and bobs the
 * head (used while roaming across the chat box); otherwise it stands still.
 */
export default function StickFigure({ moving = false, className }: { moving?: boolean; className?: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 36 36" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden>
      <g className={cn(moving && 'kk-bob')}>
        {/* head */}
        <circle cx="18" cy="8" r="3.2" fill="currentColor" stroke="none" />
        {/* body */}
        <line x1="18" y1="11.5" x2="18" y2="22" />
        {/* arms */}
        <line className={cn('kk-arm', moving && 'kk-arm-a')} x1="18" y1="14" x2="13.5" y2="18.5" />
        <line className={cn('kk-arm', moving && 'kk-arm-b')} x1="18" y1="14" x2="22.5" y2="18.5" />
      </g>
      {/* legs */}
      <line className={cn('kk-leg', moving && 'kk-leg-a')} x1="18" y1="22" x2="14.5" y2="30" />
      <line className={cn('kk-leg', moving && 'kk-leg-b')} x1="18" y1="22" x2="21.5" y2="30" />
    </svg>
  )
}
