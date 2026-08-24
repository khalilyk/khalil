'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import MarkerCanvas from './MarkerCanvas'
import { PROJECTS } from '@/lib/projects'

// Eye (sclera) centres as a % of the portrait image
const EYES = [{ left: 45.4, top: 11.5 }, { left: 54.6, top: 9.2 }]
// "hello," cycling through languages every 5s
const GREETINGS = ['hello,', 'bonjour,', 'مرحبا،', 'γεια σου,', 'ciao,', '你好，', 'こんにちは、']

const RED = '#e5342b'
const GREY = '#a3a09b'
const INK = '#141414'
const CREAM = '#f4f2ed'
const EMAIL = 'hello@khalilkhouri.org'

type View = 'home' | 'about' | 'portfolio' | 'contact'

// Brand link with a styled hover tooltip
function BrandLink({ href, label, tip }: { href: string; label: string; tip: string }) {
  return (
    <span className="relative inline-block group/tt">
      <a href={href} target="_blank" rel="noopener noreferrer"
        className="font-semibold underline decoration-1 underline-offset-2 hover:opacity-70" style={{ color: RED }}>{label}</a>
      <span role="tooltip"
        className="pointer-events-none absolute left-0 bottom-full mb-2 z-30 w-max max-w-[min(240px,70vw)] rounded-lg px-3 py-2 text-xs font-normal leading-snug text-white text-left shadow-lg opacity-0 translate-y-1 transition-all duration-150 group-hover/tt:opacity-100 group-hover/tt:translate-y-0"
        style={{ backgroundColor: INK }}>
        {tip}
        <span className="absolute left-5 top-full -translate-x-1/2 -mt-1 h-2 w-2 rotate-45" style={{ backgroundColor: INK }} />
      </span>
    </span>
  )
}

// CTA with an arrow that slides on hover
function Cta({ onClick, children, className = '' }: { onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button onClick={onClick}
      className={`group inline-flex items-center gap-1.5 font-semibold text-[#e5342b] hover:opacity-80 transition-opacity ${className}`}>
      {children}
      <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
    </button>
  )
}

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
      const cy = r.top + r.height * 0.09
      const dx = e.clientX - cx, dy = e.clientY - cy
      const len = Math.hypot(dx, dy) || 1
      const MAX = 3
      setGaze({ x: (dx / len) * MAX, y: (dy / len) * MAX })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Restore a view from ?view= (e.g. breadcrumb back from a project page)
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('view')
    if (v === 'about' || v === 'portfolio' || v === 'contact') setView(v)
  }, [])

  const navItem = (n: string, label: string, v: View) => (
    <button onClick={() => setView(v)} className="whitespace-nowrap hover:opacity-60 transition-opacity">
      <span className="hidden sm:inline" style={{ color: GREY }}>{n} </span>
      <span style={view === v ? { color: RED } : undefined}>{label}.</span>
    </button>
  )

  return (
    <div className="min-h-[100dvh] lg:h-[100dvh] overflow-x-hidden lg:overflow-hidden flex flex-col select-none lg:cursor-crosshair" style={{ backgroundColor: CREAM, color: INK }}>
      <MarkerCanvas />
      {/* Nav */}
      <header className="flex items-baseline justify-between gap-4 px-6 lg:px-16 py-6 lg:py-7 max-w-[1500px] w-full mx-auto shrink-0">
        <div className="relative group/home">
          <button onClick={() => setView('home')} className="text-2xl font-extrabold tracking-tight">kk<span style={{ color: RED }}>.</span></button>
          {view !== 'home' && (
            <span role="tooltip"
              className="pointer-events-none absolute left-0 top-full mt-2 z-30 rounded-lg px-3.5 py-2 text-xl font-extrabold tracking-tight text-white whitespace-nowrap shadow-lg opacity-0 -translate-y-1 transition-all duration-150 group-hover/home:opacity-100 group-hover/home:translate-y-0"
              style={{ backgroundColor: INK }}>
              go home
              <span className="absolute left-5 bottom-full -translate-x-1/2 -mb-1 h-2 w-2 rotate-45" style={{ backgroundColor: INK }} />
            </span>
          )}
        </div>
        <nav className="flex gap-5 sm:gap-8 lg:gap-12 text-sm sm:text-base font-semibold">
          {navItem('01', 'about', 'about')}
          {navItem('02', 'portfolio', 'portfolio')}
          {navItem('03', 'contact', 'contact')}
        </nav>
      </header>

      {/* Stage */}
      <main className="flex-1 min-h-0 max-w-[1500px] w-full mx-auto grid gap-8 items-center px-6 lg:px-16 pb-8 lg:grid-cols-[1.15fr_1fr]">
        <div className="min-h-0">
          {view === 'home' && <HomeView key="home" go={setView} />}
          {view === 'about' && <AboutView key="about" go={setView} />}
          {view === 'portfolio' && <PortfolioView key="portfolio" />}
          {view === 'contact' && <ContactView key="contact" />}
        </div>

        {/* Portrait illustration — pupils follow the cursor (desktop) */}
        <div className="flex h-[38vh] lg:h-full min-h-0 items-end justify-center lg:justify-end">
          <div ref={faceRef} className="relative h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kk-eyes.png" alt="Illustration of Khalil Khouri" draggable={false} className="h-full w-auto object-contain [-webkit-user-drag:none]" />
            {EYES.map((eye, i) => (
              <span key={i} aria-hidden
                className="absolute flex items-center justify-center overflow-hidden"
                style={{
                  left: `${eye.left}%`, top: `${eye.top}%`,
                  width: '3.3%', aspectRatio: '1.1', borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/eyeball.png" alt="" draggable={false} className="w-[66%] h-auto [-webkit-user-drag:none]"
                  style={{ transform: `translate(${gaze.x}px, ${gaze.y}px) rotate(-18deg)`, transition: 'transform .09s ease-out' }} />
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 max-w-[1500px] w-full mx-auto px-6 lg:px-16 py-4 flex flex-col items-center gap-1 text-center text-xs lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:text-left" style={{ color: GREY }}>
        <span>© {new Date().getFullYear()} Khalil Khouri. All rights reserved.</span>
        <button onClick={() => window.dispatchEvent(new Event('kk:cleardraw'))} className="hidden lg:inline hover:text-foreground transition-colors">
          reset drawing
        </button>
      </footer>
    </div>
  )
}

function HomeView({ go }: { go: (v: View) => void }) {
  const [gi, setGi] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setGi(v => (v + 1) % GREETINGS.length), 5000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="kk-view-in">
      <h1 className="font-extrabold tracking-tight leading-[0.95] text-5xl sm:text-6xl lg:text-7xl whitespace-nowrap">
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
          <Cta onClick={() => go('contact')} className="text-sm">have something in mind? let&apos;s talk</Cta>
        </div>
      </div>
    </div>
  )
}

function AboutView({ go }: { go: (v: View) => void }) {
  return (
    <div className="kk-view-in max-w-2xl space-y-2.5 text-sm leading-relaxed">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: GREY }}>01 — about</p>
      <p className="font-semibold text-base">The conviction is simple: the world doesn&apos;t need more of the same.</p>
      <p>
        For two decades, I&apos;ve helped shape hospitality brands recognised by <span className="font-semibold">Michelin</span>, celebrated by <span className="font-semibold">The World&apos;s 50 Best</span>, and awarded across Dubai&apos;s most competitive dining scene, including <span className="font-semibold" style={{ color: RED }}>3Fils, BRIX and Bordo Mavi</span>.
      </p>
      <p>
        From Dubai&apos;s waterfront to emerging concepts in Sydney and collaborations across Beirut, one belief has remained constant: there&apos;s a difference between a venue people visit and one they can&apos;t stop talking about.
      </p>
      <p className="font-semibold" style={{ color: RED }}>I create the second kind.</p>
      <p>
        Restaurants, cafés and lifestyle brands. Identity, strategy, menus, packaging, content and launch. Every decision is considered through a hospitality lens, because it&apos;s the world I know, understand and care deeply about.
      </p>
      <p>
        That thinking also extends through two sister brands:{' '}
        <BrandLink href="https://bybric.com" label="BRIC" tip="Identity, positioning & communication for developers and the building sector. bybric.com" />, focused on identity, positioning and communication for developers and the building sector; and{' '}
        <BrandLink href="https://printparadise.com.au" label="Print Paradise" tip="A fully fledged online print store. printparadise.com.au" />, a fully fledged online print store making high-quality, beautifully produced print simple and accessible.
      </p>
      <p className="font-semibold">Different sectors. The same ambition: to create brands people notice, understand and remember.</p>
      <Cta onClick={() => go('contact')} className="!mt-5">let&apos;s build something</Cta>
    </div>
  )
}

function PortfolioView() {
  return (
    <div className="kk-view-in max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: GREY }}>02 — portfolio · selected work</p>
      <div className="group/grid mt-4 grid grid-cols-3 grid-flow-dense auto-rows-[92px] sm:auto-rows-[120px] gap-1.5">
        {PROJECTS.map((p, i) => {
          const big = i === 0 || i === 5 // two feature tiles
          return (
            <Link key={p.slug} href={`/work/${p.slug}`}
              className={`group/tile relative overflow-hidden bg-black/5 origin-center transition-all duration-300 ease-out will-change-transform group-hover/grid:opacity-40 hover:!opacity-100 hover:scale-[1.45] hover:z-20 hover:shadow-2xl ${big ? 'col-span-2 row-span-2' : ''}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.img} alt={p.name} draggable={false} loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/tile:scale-110 [-webkit-user-drag:none]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 opacity-0 group-hover/tile:opacity-100 transition-opacity duration-300"
                style={{ background: 'rgba(0,0,0,0.55)' }}>
                <span className="text-white font-bold leading-tight text-sm">{p.name}</span>
                <span className="text-white/70 text-[10px] uppercase tracking-wider mt-0.5">{p.cat}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function ContactView() {
  const [form, setForm] = useState({ topic: '', name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const TOPICS = ['New project', 'Brand & identity', 'Restaurant / café concept', 'Collaboration', 'Something else']

  function send() {
    const subject = encodeURIComponent(`${form.topic || 'Portfolio enquiry'}${form.name ? ` — ${form.name}` : ''}`)
    const body = encodeURIComponent(`${form.topic ? `Topic: ${form.topic}\n\n` : ''}${form.message}\n\n— ${form.name}${form.email ? `\n${form.email}` : ''}`)
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`
    setSent(true)
  }

  const field = 'select-text w-full h-11 rounded-xl border bg-white/60 px-3.5 text-sm outline-none focus:border-black/40'
  return (
    <div className="kk-view-in max-w-xl">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: GREY }}>03 — contact</p>
      <h2 className="mt-2 text-4xl sm:text-5xl font-extrabold tracking-tight">let&apos;s talk<span style={{ color: RED }}>.</span></h2>
      <p className="mt-2 text-sm" style={{ color: GREY }}>Working globally, with roots in Dubai, Sydney and Beirut. Tell me about your project and I&apos;ll usually reply within 24 hours.</p>

      <select value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
        className={`${field} mt-5 appearance-none pr-10 ${form.topic ? '' : 'text-muted-foreground'}`}
        style={{
          borderColor: 'rgba(0,0,0,0.12)',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a3a09b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', backgroundSize: '14px',
        }}>
        <option value="" style={{ color: INK }}>What would you like to discuss?</option>
        {TOPICS.map(t => <option key={t} value={t} style={{ color: INK, backgroundColor: '#fff' }}>{t}</option>)}
      </select>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={field} style={{ borderColor: 'rgba(0,0,0,0.12)' }} />
        <input type="email" placeholder="Your email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={field} style={{ borderColor: 'rgba(0,0,0,0.12)' }} />
      </div>
      <textarea placeholder="What do you have in mind?" rows={4} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
        className="select-text mt-3 w-full rounded-xl border bg-white/60 px-3.5 py-2.5 text-sm outline-none focus:border-black/40 resize-none" style={{ borderColor: 'rgba(0,0,0,0.12)' }} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Cta onClick={send}>{sent ? 'opening your email' : 'send message'}</Cta>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" style={{ boxShadow: '0 0 8px 1px rgba(34,197,94,0.8)' }} />
          </span>
          2 spots left this month
        </p>
      </div>
    </div>
  )
}
