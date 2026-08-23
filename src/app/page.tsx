import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCachedUser } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Khalil Khouri — Designer & Maker',
  description: 'Designer, maker, and curious mind. I turn ideas into thoughtful visuals and digital experiences.',
  robots: { index: true, follow: true },
}

const RED = '#e5342b'
const GREY = '#a3a09b'
const INK = '#141414'
const CREAM = '#f4f2ed'

export default async function Landing() {
  // Logged in? Go straight to the private app.
  const user = await getCachedUser()
  if (user) redirect('/home')

  return (
    <div className="min-h-screen" style={{ backgroundColor: CREAM, color: INK }}>
      {/* Nav */}
      <header className="flex items-center gap-8 lg:gap-14 px-6 lg:px-16 py-7 max-w-[1500px] mx-auto">
        <a href="#top" className="text-2xl font-extrabold tracking-tight">kk<span style={{ color: RED }}>.</span></a>
        <nav className="flex gap-5 sm:gap-8 lg:gap-12 text-sm sm:text-base font-semibold">
          <a href="#about" className="hover:opacity-60 transition-opacity"><span style={{ color: GREY }}>01</span> about.</a>
          <a href="#portfolio" className="hover:opacity-60 transition-opacity"><span style={{ color: GREY }}>02</span> portfolio.</a>
          <a href="#contact" className="hover:opacity-60 transition-opacity"><span style={{ color: GREY }}>03</span> contact.</a>
        </nav>
      </header>

      {/* Hero */}
      <main id="top" className="max-w-[1500px] mx-auto grid lg:grid-cols-[1.15fr_1fr] gap-8 items-center px-6 lg:px-16 pb-10">
        <div className="order-2 lg:order-1">
          <h1 className="font-extrabold tracking-tight leading-[0.92] text-6xl sm:text-7xl lg:text-8xl">
            <span className="block">hello,</span>
            <span className="block" style={{ color: GREY }}>my name is</span>
            <span className="block" style={{ color: RED }}>khalil khouri<span style={{ color: INK }}>.</span></span>
          </h1>

          <div className="mt-8 space-y-1">
            <p className="text-lg lg:text-xl font-semibold">designer, maker, and curious mind.</p>
            <p className="text-lg lg:text-xl" style={{ color: GREY }}>i turn ideas into thoughtful visuals and digital experiences.</p>
          </div>

          <div className="mt-10 lg:mt-14 border-t pt-5 flex flex-wrap items-end justify-between gap-4" style={{ borderColor: 'rgba(0,0,0,0.12)' }}>
            <div>
              <p className="font-semibold">selected work</p>
              <p className="text-sm" style={{ color: GREY }}>brand systems · digital experiences · illustration</p>
            </div>
            <a href="#contact" className="font-semibold hover:opacity-70 transition-opacity" style={{ color: RED }}>
              have something in mind? let&apos;s talk →
            </a>
          </div>
        </div>

        {/* Portrait — drop your illustration at public/portrait.png */}
        <div className="order-1 lg:order-2 min-h-[46vh] lg:min-h-[82vh] bg-no-repeat bg-contain bg-bottom lg:bg-right-bottom"
          style={{ backgroundImage: 'url(/portrait.png)' }} aria-hidden />
      </main>

      {/* About */}
      <section id="about" className="max-w-[1100px] mx-auto px-6 lg:px-16 py-20 lg:py-28">
        <p className="text-sm font-semibold" style={{ color: GREY }}>01 — about</p>
        <p className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight max-w-3xl">
          I&apos;m a designer and maker who cares about the details — building <span style={{ color: RED }}>brand systems</span>, digital products, and illustration that feel considered and human.
        </p>
      </section>

      {/* Portfolio */}
      <section id="portfolio" className="max-w-[1100px] mx-auto px-6 lg:px-16 py-16 lg:py-24">
        <p className="text-sm font-semibold" style={{ color: GREY }}>02 — portfolio</p>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { t: 'Brand systems', d: 'Identity, type & visual language' },
            { t: 'Digital experiences', d: 'Web & product design, end to end' },
            { t: 'Illustration', d: 'Character & editorial work' },
          ].map(p => (
            <div key={p.t} className="rounded-2xl bg-white/60 border p-6" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
              <p className="text-lg font-bold">{p.t}</p>
              <p className="text-sm mt-1" style={{ color: GREY }}>{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="max-w-[1100px] mx-auto px-6 lg:px-16 py-20 lg:py-28">
        <p className="text-sm font-semibold" style={{ color: GREY }}>03 — contact</p>
        <p className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
          have something in mind?
        </p>
        <a href="mailto:hello@khalilkhouri.org" className="inline-block mt-4 text-2xl sm:text-3xl font-bold" style={{ color: RED }}>
          let&apos;s talk →
        </a>
      </section>

      <footer className="max-w-[1500px] mx-auto px-6 lg:px-16 py-8 flex items-center justify-between text-sm" style={{ color: GREY }}>
        <span>© {new Date().getFullYear()} Khalil Khouri</span>
        <Link href="/login" className="hover:opacity-70 transition-opacity">sign in</Link>
      </footer>
    </div>
  )
}
