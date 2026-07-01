'use client'

import { useEffect, useRef, useState } from 'react'
import StickFigure from './WalkingMan'

const FIG = 28          // figure width (px)
const WALK_MS = 6000    // slow walk each way
const WAIT_MS = 15000   // pause at the end
const HOME_MS = 2000    // pause back in the doorway

/**
 * KK strolls slowly to the end of the chat bar, stands and waits 15s,
 * then strolls slowly back — looping. Unmounts (stops) when the user taps
 * to type, so KKDock only renders this while idle.
 */
export default function KKRoamer() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [x, setX] = useState(0)
  const [moving, setMoving] = useState(false)
  const [facing, setFacing] = useState<1 | -1>(1)
  const [dur, setDur] = useState(WALK_MS)

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    const after = (ms: number, fn: () => void) => { timers.push(setTimeout(() => { if (!cancelled) fn() }, ms)) }
    const endX = () => Math.max(0, (trackRef.current?.clientWidth ?? 160) - FIG)

    function cycle() {
      // Walk slowly to the end
      setFacing(1); setMoving(true); setDur(WALK_MS); setX(endX())
      after(WALK_MS, () => {
        // Stand and wait
        setMoving(false)
        after(WAIT_MS, () => {
          // Turn and walk slowly back
          setFacing(-1); setMoving(true); setDur(WALK_MS); setX(0)
          after(WALK_MS, () => {
            // Rest in the doorway, then go again
            setMoving(false); setFacing(1)
            after(HOME_MS, cycle)
          })
        })
      })
    }

    // kick off after first paint so the opening walk animates from x=0
    after(60, cycle)
    return () => { cancelled = true; timers.forEach(clearTimeout) }
  }, [])

  return (
    <div ref={trackRef} className="pointer-events-none absolute inset-y-0 left-0 right-24 z-10">
      <div
        className="absolute bottom-0 flex items-end h-9 text-foreground/70"
        style={{ translate: `${x}px 0`, scale: `${facing} 1`, transition: `translate ${dur}ms linear` }}
      >
        <StickFigure moving={moving} />
      </div>
    </div>
  )
}
