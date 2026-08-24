'use client'

import { useRef, useEffect } from 'react'

// Draw on the page like a marker on paper. The canvas is pointer-events:none so
// it never blocks the nav/CTAs — drawing is driven by window pointer events.
export default function MarkerCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Drawing is a desktop (fine-pointer) feature only
    if (!window.matchMedia('(min-width: 1024px) and (pointer: fine)').matches) return

    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let dpr = 1

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      cv.width = Math.floor(window.innerWidth * dpr)
      cv.height = Math.floor(window.innerHeight * dpr)
      cv.style.width = window.innerWidth + 'px'
      cv.style.height = window.innerHeight + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
    resize()
    window.addEventListener('resize', resize)

    let drawing = false
    let last: { x: number; y: number } | null = null

    const stroke = (x: number, y: number) => {
      if (!last) { last = { x, y }; return }
      ctx.strokeStyle = 'rgba(26,26,26,0.9)'
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.moveTo(last.x, last.y)
      ctx.lineTo(x, y)
      ctx.stroke()
      last = { x, y }
    }

    const clear = () => {
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, cv.width, cv.height)
      ctx.restore()
    }
    window.addEventListener('kk:cleardraw', clear)

    const down = (e: MouseEvent) => { drawing = true; last = { x: e.clientX, y: e.clientY } }
    const move = (e: MouseEvent) => { if (drawing) stroke(e.clientX, e.clientY) }
    const up = () => { drawing = false; last = null }

    const tStart = (e: TouchEvent) => { drawing = true; last = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
    const tMove = (e: TouchEvent) => { if (drawing) { stroke(e.touches[0].clientX, e.touches[0].clientY) } }

    window.addEventListener('mousedown', down)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    window.addEventListener('touchstart', tStart, { passive: true })
    window.addEventListener('touchmove', tMove, { passive: true })
    window.addEventListener('touchend', up)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('kk:cleardraw', clear)
      window.removeEventListener('mousedown', down)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      window.removeEventListener('touchstart', tStart)
      window.removeEventListener('touchmove', tMove)
      window.removeEventListener('touchend', up)
    }
  }, [])

  return <canvas ref={ref} aria-hidden className="fixed inset-0 z-[60] pointer-events-none" />
}
