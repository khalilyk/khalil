'use client'

import { useState, useEffect } from 'react'
import { Mail, MapPin, Clock, Sparkles, X } from 'lucide-react'

const RED = '#e5342b'
const INK = '#141414'
const GREY = '#a3a09b'
const CREAM = '#f4f2ed'
const EMAIL = 'hello@khalilkhouri.org'

export default function ContactButton({ label, className }: { label: React.ReactNode; className?: string }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    if (open) { document.addEventListener('keydown', onKey); document.body.style.overflow = 'hidden' }
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open])

  function send() {
    const subject = encodeURIComponent(`Portfolio enquiry${form.name ? ` from ${form.name}` : ''}`)
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name}${form.email ? `\n${form.email}` : ''}`)
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`
    setSent(true)
  }

  return (
    <>
      <button onClick={() => { setOpen(true); setSent(false) }} className={className}>{label}</button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl grid sm:grid-cols-2"
            style={{ backgroundColor: CREAM, color: INK }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} aria-label="Close"
              className="absolute top-4 right-4 z-10 w-9 h-9 grid place-items-center rounded-full text-white/90 hover:bg-white/15 sm:text-white">
              <X size={18} />
            </button>

            {/* Left — details (inverted: dark panel, red accents) */}
            <div className="p-7 sm:p-8 text-white flex flex-col gap-6" style={{ backgroundColor: INK }}>
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight">let&apos;s talk<span style={{ color: RED }}>.</span></h2>
                <p className="text-sm mt-2 text-white/70 leading-relaxed">
                  Whether it&apos;s a brand from scratch, a product to design, or an illustration you have in mind — I&apos;d love to hear about it.
                </p>
              </div>

              <div className="space-y-4 text-sm">
                <a href={`mailto:${EMAIL}`} className="flex items-start gap-3 hover:opacity-80">
                  <Mail size={17} className="mt-0.5 shrink-0" style={{ color: RED }} />
                  <span><span className="block text-white/50 text-xs uppercase tracking-wider">Email</span>{EMAIL}</span>
                </a>
                <p className="flex items-start gap-3">
                  <MapPin size={17} className="mt-0.5 shrink-0" style={{ color: RED }} />
                  <span><span className="block text-white/50 text-xs uppercase tracking-wider">Based in</span>Sydney, Australia · works worldwide</span>
                </p>
                <p className="flex items-start gap-3">
                  <Clock size={17} className="mt-0.5 shrink-0" style={{ color: RED }} />
                  <span><span className="block text-white/50 text-xs uppercase tracking-wider">Response</span>Usually within 24 hours</span>
                </p>
                <p className="flex items-start gap-3">
                  <Sparkles size={17} className="mt-0.5 shrink-0" style={{ color: RED }} />
                  <span><span className="block text-white/50 text-xs uppercase tracking-wider">Available for</span>Freelance, collaborations &amp; select full-time roles</span>
                </p>
              </div>

              <div className="mt-auto pt-4 border-t border-white/15 text-xs text-white/60">
                brand systems · digital experiences · illustration
              </div>
            </div>

            {/* Right — form */}
            <div className="p-7 sm:p-8">
              <p className="text-sm font-medium" style={{ color: GREY }}>Send a message</p>
              <div className="mt-4 space-y-3">
                <input placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full h-11 rounded-xl border bg-white/60 px-3.5 text-sm outline-none focus:border-black/40" style={{ borderColor: 'rgba(0,0,0,0.12)' }} />
                <input type="email" placeholder="Your email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full h-11 rounded-xl border bg-white/60 px-3.5 text-sm outline-none focus:border-black/40" style={{ borderColor: 'rgba(0,0,0,0.12)' }} />
                <textarea placeholder="What do you have in mind?" rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full rounded-xl border bg-white/60 px-3.5 py-2.5 text-sm outline-none focus:border-black/40 resize-none" style={{ borderColor: 'rgba(0,0,0,0.12)' }} />
                <button onClick={send} disabled={!form.message}
                  className="w-full h-11 rounded-full font-semibold text-white disabled:opacity-50 transition-opacity"
                  style={{ backgroundColor: RED }}>
                  {sent ? 'Opening your email…' : 'Send message →'}
                </button>
                <p className="text-[11px] text-center" style={{ color: GREY }}>Opens your email app, pre-filled and ready to send.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
