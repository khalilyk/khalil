'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

type Row = { icon: string; label: string; value: string; pill: boolean }
type Card = {
  name: string
  title: string
  hp: string
  type: string
  image: string | null
  color: string
  rows: Row[]
}

const THEMES = ['#70892e', '#e5342b', '#2f6bff', '#f59e0b', '#a855f7', '#0ea5e9', '#ec4899', '#14b8a6']

const DEFAULT: Card = {
  name: 'KHALIL',
  title: 'The Concept Creator',
  hp: '500',
  type: '✦',
  image: null,
  color: '#70892e',
  rows: [
    { icon: '💡', label: 'FUN FACT', value: 'Runs three brands at once', pill: false },
    { icon: '⚡', label: 'STRENGTH', value: 'Branding', pill: true },
    { icon: '✦', label: 'SIGNATURE MOVE', value: 'The milk-crate sit', pill: false },
  ],
}

// mix a hex toward white by t (0..1)
function tint(hex: string, t: number) {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const m = (c: number) => Math.round(c + (255 - c) * t)
  return `rgb(${m(r)}, ${m(g)}, ${m(b)})`
}

export default function CardGenerator() {
  const [card, setCard] = useState<Card>(DEFAULT)
  const [editorOpen, setEditorOpen] = useState(true)

  // ── 3D rotation ──────────────────────────────────────
  const [rot, setRot] = useState({ x: 8, y: 0 })
  const dragging = useRef(false)
  const auto = useRef(true)
  const last = useRef({ x: 0, y: 0 })
  const raf = useRef<number | null>(null)

  useEffect(() => {
    const tick = () => {
      if (auto.current && !dragging.current) {
        setRot(r => ({ x: r.x + (8 - r.x) * 0.02, y: r.y + 0.35 }))
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [])

  const onDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true; auto.current = false
    last.current = { x: e.clientX, y: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }, [])
  const onMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const dx = e.clientX - last.current.x, dy = e.clientY - last.current.y
    last.current = { x: e.clientX, y: e.clientY }
    setRot(r => ({ x: Math.max(-30, Math.min(30, r.x - dy * 0.4)), y: r.y + dx * 0.4 }))
  }, [])
  const onUp = useCallback(() => {
    dragging.current = false
    // resume auto-spin after a beat
    setTimeout(() => { if (!dragging.current) auto.current = true }, 1200)
  }, [])

  function upImage(file: File) {
    const reader = new FileReader()
    reader.onload = () => setCard(c => ({ ...c, image: reader.result as string }))
    reader.readAsDataURL(file)
  }
  const setRow = (i: number, patch: Partial<Row>) =>
    setCard(c => ({ ...c, rows: c.rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) }))

  const yNorm = ((rot.y % 360) + 360) % 360
  const flipped = yNorm > 90 && yNorm < 270
  const sheenX = 50 + Math.sin((rot.y * Math.PI) / 180) * 50

  return (
    <div className="min-h-[100dvh] w-full flex flex-col lg:flex-row" style={{ background: 'radial-gradient(1200px 800px at 50% -10%, #1b2233, #0b0e16 60%)' }}>
      {/* Stage */}
      <div className="relative flex-1 flex items-center justify-center py-16 px-6 overflow-hidden">
        {/* ambient glow */}
        <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(600px 600px at 50% 45%, ${card.color}22, transparent 70%)` }} />

        <div className="relative" style={{ perspective: '1400px' }}>
          {/* floating shadow */}
          <div className="absolute left-1/2 -translate-x-1/2 rounded-[50%] blur-2xl"
            style={{ bottom: -46, width: 260, height: 46, background: 'rgba(0,0,0,0.55)', transform: `scaleX(${0.7 + Math.abs(Math.cos((rot.y * Math.PI) / 180)) * 0.4})`, opacity: 0.6 }} />

          <div className="kk-tvc-float" style={{ transformStyle: 'preserve-3d' }}>
            <div
              onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
              className="relative cursor-grab active:cursor-grabbing select-none"
              style={{
                width: 340, height: 476,
                transformStyle: 'preserve-3d',
                transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
                transition: dragging.current ? 'none' : 'transform .05s linear',
              }}>
              {/* FRONT */}
              <CardFace card={card} sheenX={sheenX} back={false} style={{ backfaceVisibility: 'hidden' }} />
              {/* BACK */}
              <CardBack color={card.color} style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }} />
              <span className="sr-only">{flipped ? 'back' : 'front'}</span>
            </div>
          </div>
        </div>

        {/* controls */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <button onClick={() => { auto.current = !auto.current }}
            className="rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 backdrop-blur transition-colors">
            ⟳ Spin
          </button>
          <button onClick={() => setRot({ x: 8, y: 0 })}
            className="rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 backdrop-blur transition-colors">
            Reset
          </button>
          <button onClick={() => setEditorOpen(o => !o)}
            className="lg:hidden rounded-full bg-white text-black text-xs font-bold px-4 py-2">
            {editorOpen ? 'Hide' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Editor */}
      {editorOpen && (
        <aside className="w-full lg:w-[380px] shrink-0 bg-[#0f1420] border-t lg:border-t-0 lg:border-l border-white/10 text-white overflow-y-auto max-h-[100dvh]">
          <div className="p-5 space-y-5">
            <div>
              <h1 className="text-lg font-bold tracking-tight">Trading card</h1>
              <p className="text-xs text-white/50">Drag the card to spin it. Customise everything below.</p>
            </div>

            <Field label="Name">
              <input value={card.name} onChange={e => setCard(c => ({ ...c, name: e.target.value }))} className={inp} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Power (HP)">
                <input value={card.hp} onChange={e => setCard(c => ({ ...c, hp: e.target.value }))} className={inp} />
              </Field>
              <Field label="Type icon">
                <input value={card.type} onChange={e => setCard(c => ({ ...c, type: e.target.value.slice(0, 2) }))} className={inp} />
              </Field>
            </div>
            <Field label="Title / tagline">
              <input value={card.title} onChange={e => setCard(c => ({ ...c, title: e.target.value }))} className={inp} />
            </Field>

            <Field label="Photo">
              <label className="flex items-center justify-center gap-2 h-20 rounded-xl border border-dashed border-white/20 cursor-pointer hover:bg-white/5 transition-colors text-sm text-white/60">
                {card.image ? 'Change photo' : 'Upload a photo'}
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && upImage(e.target.files[0])} />
              </label>
              {card.image && <button onClick={() => setCard(c => ({ ...c, image: null }))} className="mt-1 text-xs text-white/40 hover:text-white/70">Remove photo</button>}
            </Field>

            <Field label="Theme colour">
              <div className="flex flex-wrap gap-2">
                {THEMES.map(t => (
                  <button key={t} onClick={() => setCard(c => ({ ...c, color: t }))}
                    className="w-8 h-8 rounded-full ring-2 ring-offset-2 ring-offset-[#0f1420] transition-transform hover:scale-110"
                    style={{ background: t, boxShadow: card.color === t ? `0 0 0 2px ${t}` : 'none', outline: card.color === t ? '2px solid white' : 'none' }} />
                ))}
                <input type="color" value={card.color} onChange={e => setCard(c => ({ ...c, color: e.target.value }))}
                  className="w-8 h-8 rounded-full bg-transparent border border-white/20 cursor-pointer" />
              </div>
            </Field>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Skills</p>
              {card.rows.map((row, i) => (
                <div key={i} className="rounded-xl border border-white/10 p-3 space-y-2">
                  <div className="flex gap-2">
                    <input value={row.icon} onChange={e => setRow(i, { icon: e.target.value.slice(0, 2) })} className={`${inp} w-12 text-center`} />
                    <input value={row.label} onChange={e => setRow(i, { label: e.target.value })} placeholder="Label" className={`${inp} flex-1`} />
                  </div>
                  <input value={row.value} onChange={e => setRow(i, { value: e.target.value })} placeholder="Value" className={inp} />
                  <label className="flex items-center gap-2 text-xs text-white/50">
                    <input type="checkbox" checked={row.pill} onChange={e => setRow(i, { pill: e.target.checked })} className="accent-white" />
                    Show value as a highlighted pill
                  </label>
                </div>
              ))}
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}

const inp = 'w-full h-10 rounded-lg bg-white/5 border border-white/15 px-3 text-sm text-white outline-none focus:border-white/40'
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-white/50">{label}</span>
      {children}
    </label>
  )
}

function CardFace({ card, sheenX, style }: { card: Card; sheenX: number; back: boolean; style?: React.CSSProperties }) {
  const frame = card.color
  const soft = tint(frame, 0.82)
  const softer = tint(frame, 0.92)
  return (
    <div className="absolute inset-0 rounded-[22px] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]"
      style={{ ...style, background: frame, padding: 10 }}>
      <div className="relative w-full h-full rounded-[16px] overflow-hidden flex flex-col" style={{ background: softer }}>
        {/* radiating burst behind image */}
        <div className="absolute inset-x-0 top-0 h-[62%]" style={{
          background: `repeating-conic-gradient(from 0deg at 50% 45%, ${soft} 0deg 6deg, ${softer} 6deg 12deg)`,
          opacity: 0.6,
        }} />
        {/* title pill */}
        <div className="relative z-10 flex justify-center pt-3">
          <span className="rounded-full bg-white/85 px-3 py-1 text-[11px] font-bold text-black shadow" style={{ maxWidth: '90%' }}>
            <span className="block truncate">{card.title}</span>
          </span>
        </div>
        {/* image */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4">
          {card.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.image} alt={card.name} draggable={false} className="max-h-[190px] w-auto object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.35)] [-webkit-user-drag:none]" />
          ) : (
            <div className="text-6xl select-none opacity-80">🃏</div>
          )}
        </div>
        {/* name plate */}
        <div className="relative z-10 flex justify-end px-4 -mt-2">
          <span className="rounded-xl px-4 py-1.5 text-2xl font-extrabold tracking-tight text-black shadow-md"
            style={{ background: 'white', border: `2px solid ${frame}` }}>
            {card.name || 'NAME'}
          </span>
        </div>
        {/* HP badge */}
        <span className="absolute z-10 top-3 right-3 rounded-full bg-white/90 text-black text-xs font-extrabold px-2.5 py-1 shadow">
          {card.type} {card.hp}
        </span>
        {/* stat rows */}
        <div className="relative z-10 mt-2 space-y-px bg-black/5">
          {card.rows.map((r, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2" style={{ background: i % 2 ? softer : soft }}>
              <span className="flex items-center justify-center w-6 h-6 rounded-full text-white text-[11px] shrink-0" style={{ background: frame }}>{r.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-black/70 leading-tight">{r.label}</p>
                {!r.pill && <p className="text-xs text-black leading-tight truncate">{r.value}</p>}
              </div>
              {r.pill && (
                <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold text-black" style={{ background: tint(frame, 0.4) }}>{r.value}</span>
              )}
            </div>
          ))}
        </div>
        <p className="relative z-10 text-center text-[9px] text-black/40 py-1.5">© {new Date().getFullYear()} · tvc</p>

        {/* holographic sheen */}
        <div className="pointer-events-none absolute inset-0 mix-blend-overlay"
          style={{ background: `linear-gradient(105deg, transparent ${sheenX - 25}%, rgba(255,255,255,0.55) ${sheenX}%, transparent ${sheenX + 25}%)` }} />
      </div>
    </div>
  )
}

function CardBack({ color, style }: { color: string; style?: React.CSSProperties }) {
  return (
    <div className="absolute inset-0 rounded-[22px] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] grid place-items-center"
      style={{ ...style, background: color, padding: 10 }}>
      <div className="w-full h-full rounded-[16px] grid place-items-center" style={{ background: tint(color, 0.15), backgroundImage: `repeating-linear-gradient(45deg, ${tint(color, 0.25)} 0 12px, transparent 12px 24px)` }}>
        <span className="text-5xl font-black tracking-tight text-white/90">kk<span style={{ color: tint(color, 0.6) }}>.</span></span>
      </div>
    </div>
  )
}
