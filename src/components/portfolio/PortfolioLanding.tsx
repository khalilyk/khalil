'use client'

import { useState, useRef, useEffect } from 'react'
import ContactButton from './ContactButton'

// Eye (sclera) centres as a % of the portrait image
const EYES = [{ left: 45.4, top: 11.5 }, { left: 54.6, top: 9.2 }]
// "hello," cycling through languages every 5s
const GREETINGS = ['hello,', 'bonjour,', 'مرحبا،', 'γεια σου,', 'ciao,', '你好，', 'こんにちは、']

const RED = '#e5342b'
const GREY = '#a3a09b'
const INK = '#141414'
const CREAM = '#f4f2ed'

type View = 'home' | 'about' | 'portfolio'

export default function PortfolioLanding() {
  const [view, setView] = useState<View>('home')
  const faceRef = useRef<HTMLDivElement>(null)
  const [gaze, setGaze] = useState({ x: 0, y: 0 })

  // Pupils follow the cursor
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = faceRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width * 0.5
      const cy = r.top + r.height * 0.09 // eye height
      const dx = e.clientX - cx, dy = e.clientY - cy
      const len = Math.hypot(dx, dy) || 1
      const MAX = 3 // px of iris travel
      setGaze({ x: (dx / len) * MAX, y: (dy / len) * MAX })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const navItem = (n: string, label: string, v: View) => (
    <button onClick={() => setView(v)} className="hover:opacity-60 transition-opacity">
      <span style={{ color: GREY }}>{n}</span>{' '}
      <span style={view === v ? { color: RED } : undefined}>{label}.</span>
    </button>
  )

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col" style={{ backgroundColor: CREAM, color: INK }}>
      {/* Nav */}
      <header className="flex items-baseline gap-8 lg:gap-14 px-6 lg:px-16 py-6 lg:py-7 max-w-[1500px] w-full mx-auto shrink-0">
        <button onClick={() => setView('home')} className="text-2xl font-extrabold tracking-tight">kk<span style={{ color: RED }}>.</span></button>
        <nav className="flex gap-5 sm:gap-8 lg:gap-12 text-sm sm:text-base font-semibold">
          {navItem('01', 'about', 'about')}
          {navItem('02', 'portfolio', 'portfolio')}
          <ContactButton className="hover:opacity-60 transition-opacity" label={<><span style={{ color: GREY }}>03</span> contact.</>} />
        </nav>
      </header>

      {/* Stage */}
      <main className="flex-1 min-h-0 max-w-[1500px] w-full mx-auto grid lg:grid-cols-[1.15fr_1fr] gap-8 items-center px-6 lg:px-16 pb-8">
        <div className="min-h-0 overflow-hidden">
          {view === 'home' && <HomeView key="home" />}
          {view === 'about' && <AboutView key="about" />}
          {view === 'portfolio' && <PortfolioView key="portfolio" onContact />}
        </div>

        {/* Portrait illustration — pupils follow the cursor */}
        <div className="hidden lg:flex h-full min-h-0 items-end justify-end">
          <div ref={faceRef} className="relative h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kk-eyes.png" alt="Illustration of Khalil Khouri" className="h-full w-auto object-contain" />
            {EYES.map((eye, i) => (
              <span key={i} aria-hidden
                className="absolute flex items-center justify-center overflow-hidden"
                style={{
                  left: `${eye.left}%`, top: `${eye.top}%`,
                  width: '4.4%', aspectRatio: '1.12', borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/eyeball.png" alt="" className="w-[82%] h-auto"
                  style={{ transform: `translate(${gaze.x}px, ${gaze.y}px)`, transition: 'transform .09s ease-out' }} />
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 max-w-[1500px] w-full mx-auto px-6 lg:px-16 py-4 text-xs" style={{ color: GREY }}>
        © {new Date().getFullYear()} Khalil Khouri. All rights reserved.
      </footer>
    </div>
  )
}

function HomeView() {
  const [gi, setGi] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setGi(v => (v + 1) % GREETINGS.length), 5000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="kk-view-in">
      <h1 className="font-extrabold tracking-tight leading-[0.92] text-5xl sm:text-7xl lg:text-8xl">
        <span key={gi} dir="auto" className="block kk-fade">{GREETINGS[gi]}</span>
        <span className="block" style={{ color: GREY }}>my name is</span>
        <span className="block" style={{ color: RED }}>khalil khouri<span style={{ color: INK }}>.</span></span>
      </h1>
      <div className="mt-8 space-y-1">
        <p className="text-lg lg:text-xl font-semibold">designer, maker, and curious mind.</p>
        <p className="text-lg lg:text-xl" style={{ color: GREY }}>i turn ideas into thoughtful visuals and digital experiences.</p>
      </div>
      <div className="mt-10 lg:mt-14 border-t pt-5" style={{ borderColor: 'rgba(0,0,0,0.12)' }}>
        <p className="font-semibold">selected work</p>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-sm" style={{ color: GREY }}>brand systems · digital experiences · illustration</p>
          <ContactButton className="text-sm font-semibold hover:opacity-70 transition-opacity text-left text-[#e5342b]" label="have something in mind? let's talk →" />
        </div>
      </div>
    </div>
  )
}

function AboutView() {
  return (
    <div className="kk-view-in max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: GREY }}>01 — about</p>
      <p className="mt-4 text-sm sm:text-base lg:text-lg leading-relaxed">
        The conviction is simple: the world doesn&apos;t need more of the same. Founder Khalil Khouri has spent two decades proving it, behind names recognised by <span className="font-semibold">Michelin</span>, celebrated by <span className="font-semibold">The World&apos;s 50 Best</span>, and awarded across Dubai&apos;s most competitive dining rooms.{' '}<span className="font-semibold" style={{ color: RED }}>3Fils. BRIX. Bordo Mavi.</span>{' '}From Dubai&apos;s waterfront to new concepts in Sydney and collaborations across Beirut, one thing held true everywhere.
      </p>
      <p className="mt-4 text-sm sm:text-base lg:text-lg leading-relaxed">
        There&apos;s a difference between a venue people visit and one they can&apos;t stop talking about.{' '}<span className="font-semibold">We build the second kind.</span>{' '}Restaurants, cafés, lifestyle brands. Identity, strategy, menus, packaging, content, launch. Every decision runs through a hospitality lens, because that&apos;s the only one we&apos;ve ever worked through.
      </p>
      <ContactButton className="mt-6 inline-block font-semibold text-[#e5342b] hover:opacity-70 transition-opacity" label="let's build something →" />
    </div>
  )
}

function PortfolioView({ onContact }: { onContact?: boolean }) {
  const items = [
    { t: 'Brand systems', d: 'Identity, type & visual language' },
    { t: 'Digital experiences', d: 'Web & product design, end to end' },
    { t: 'Illustration', d: 'Character & editorial work' },
    { t: 'Hospitality concepts', d: 'Restaurants, cafés & lifestyle brands' },
  ]
  return (
    <div className="kk-view-in max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: GREY }}>02 — portfolio</p>
      <div className="mt-5 divide-y" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
        {items.map(p => (
          <div key={p.t} className="flex items-baseline justify-between gap-4 py-4"
            style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            <span className="text-xl sm:text-2xl font-bold tracking-tight">{p.t}</span>
            <span className="text-sm text-right" style={{ color: GREY }}>{p.d}</span>
          </div>
        ))}
      </div>
      {onContact && (
        <ContactButton className="mt-6 font-semibold text-[#e5342b] hover:opacity-70 transition-opacity" label="start a project →" />
      )}
    </div>
  )
}
